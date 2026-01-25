# STAGE_TO_TRAINERVIEW_HANDOFF_CONTRACT

## Status: Canonical
## Owner: TBD
## Last reviewed: 2026-01-24

---

## 0. Purpose

This contract defines the **airlock** between Stage (pre-session authoring/verification) and TrainerView (live facilitation).

It exists to:

- prevent drift of authority across time boundaries
- ensure deterministic session startup
- protect shared reality once Live begins
- guarantee multi-tab correctness and server-enforced immutability

Stage authors intent. TrainerView activates intent. LiveView reflects activation.

---

## 1. Definitions

### 1.1 Session States

- **DRAFT**: session exists; pre-live; Stage writable
- **STAGED**: minimum readiness met; still pre-live; Stage writable
- **LIVE**: live facilitation has begun; Stage read-only; shared reality active

### 1.2 Staging Payload

A set of pre-live authored objects and defaults that are not participant-facing until Live begins.

- `focusCues_staging[]`
- `mediaCues_staging[]`
- `entryState_staging{}`
- `requirements{}`
- `validationStatus{}`
- `stageReadiness` (DRAFT | STAGED)

### 1.3 Live Snapshot Payload

A frozen, authoritative copy of staged intent that governs the Live session.

- `focusCues_live[]`
- `mediaCues_live[]`
- `entryState_live{}`
- `requirements_live{}`
- `snapshotMeta{}`
- `liveState`

### 1.4 Handoff

The sequence of actions and guarantees that occur when the trainer moves from Stage to TrainerView and subsequently initiates Live.

---

## 2. Authority Boundaries (Non-Negotiable)

### 2.1 Stage Authority (Pre-Live Only)

Stage may:
- create/edit/reorder focus cues
- create/edit/reorder media cues
- set entry state defaults
- set requirement toggles
- run validation checks
- surface readiness status

Stage must never:
- initiate Live
- auto-play media
- show participant messages/metrics
- modify any live snapshot

### 2.2 TrainerView Authority

TrainerView may:
- review staged intent (pre-live)
- initiate Live via explicit action
- activate focus cues (live)
- trigger media cue execution (live)
- insert new focus cues ahead of `currentPosition` (live)
- insert new media cues ahead of `currentPosition` (live, with immediate validation)
- edit unexecuted focus cues (`position > currentPosition`)
- edit unvalidated media cues (newly inserted, not yet validated)

TrainerView must never:
- create/edit/reorder cues at or before `currentPosition`
- edit validated media cues
- edit executed cues of any type
- modify entry state defaults once Live begins
- auto-transition to Live on page load

---

## 3. Handoff Timeline

### 3.1 Opening TrainerView (Pre-Live Review)

When TrainerView is opened while session state is DRAFT or STAGED:

TrainerView must:
1. Fetch canonical `session.state`
2. Fetch `staging payload` (focus/media/entry/requirements/validation)
3. Render a **pre-live** status indicator:
   - "NOT LIVE" must be unambiguous
4. Provide only two pre-live actions:
   - `Return to Stage`
   - `Go Live` (may be disabled if gating requires)

TrainerView must not snapshot automatically.

### 3.2 Initiating Live (Explicit Gate)

Live may begin only via an explicit trainer action in TrainerView:

- Button: `GO LIVE` (or equivalent)
- No auto-start on route load
- No auto-start based on validation pass

On click, TrainerView must send:

- `session:live:begin { sessionId }`

No staged objects are transmitted from TrainerView at this time; the server is authoritative.

### 3.3 Snapshot and Transition

On receiving `session:live:begin` the server must perform an atomic operation:

1. Re-check gating rules (Section 5)
2. Create a **baseline snapshot** (immutable) of staged data:
   - `*_staging` → `*_live` (baseline snapshot)
   - Baseline represents "what we planned"
   - Baseline is never modified after creation
3. Set `session.state = LIVE`
4. Emit `session:state:update { state: LIVE }` to all connected clients (Stage + TrainerView + LiveView as applicable)
5. Return ACK to TrainerView:
   - `session:live:ack { state: LIVE, snapshotId }` (baseline snapshot ID)

The snapshot operation must be atomic: no partial live state is permitted.

### 3.4 Hybrid Snapshot Model

The snapshot system uses a hybrid approach to support both planned intent and live adaptation:

**Baseline Snapshot** (created at Live transition):
- Immutable copy of all staged cues at the moment of Live transition
- Represents planned session flow ("what we planned")
- Never modified after creation
- Preserved for audit trail
- Contains: `focusCues_live[]`, `mediaCues_live[]`, `entryState_live{}`, `requirements_live{}`, `snapshotMeta{}`

**Incremental Revisions** (created during live):
- Created when cues are inserted during live sessions
- Contains only the new insertions (not a full replacement)
- References baseline snapshot for executed cues
- Preserved for audit trail ("what actually happened")
- Each revision has a unique revision ID and timestamp

**Audit Trail**:
- Baseline snapshot ID recorded at Live transition
- Each incremental revision ID recorded when created
- Full reconstruction possible: baseline + all revisions
- Executed cues must remain identical across all snapshot versions
- Provides clear separation: "what we planned" vs "what actually happened"

**Implementation Notes**:
- Baseline snapshot stored as: `snapshot_baseline_<snapshotId>.json`
- Incremental revisions stored as: `snapshot_revision_<revisionId>.json`
- Metadata tracks which cues came from baseline vs revisions
- Executed cues are never modified in any revision

---

## 4. Read-Only Enforcement After Live

### 4.1 Client-Side Locking

Upon receiving `session:state:update` with `LIVE`:

- Stage must become read-only immediately
- TrainerView must remove/hide any pre-live-only controls
- Any stale Stage tabs must also lock

### 4.2 Server-Side Enforcement (Required)

Once `session.state = LIVE`, the server must reject all Stage-authoring actions:

Rejected operations include:
- focus cue create/edit/reorder/delete
- media cue create/edit/reorder/delete
- entry state changes
- requirement toggle changes

Rejection response must include:
- reason: `SESSION_IS_LIVE`
- the attempted action name
- a user-safe message for trainer UI

Server enforcement is mandatory even if the client UI fails.

---

## 5. Gating Rules (Go-Live Eligibility)

Go-Live eligibility is evaluated at the server at the time of `session:live:begin`.

### 5.1 Minimum Required to Go Live

A session may transition to LIVE only if:

1. **Entry State is valid**
   - `entryState_staging.defaultFocusCueId` resolves to a staged focus cue
   - `focusVisibleOnJoin`, `chatOpenOnJoin` are present
   - Note: Anonymity is always ON and is not configurable (see visual-meaning-and-anonymity-contract.md)

2. **At least one staged focus cue exists**
   - including the canonical default if trainer authored none

### 5.2 Requirement Toggles

If any requirement toggle is true, its subsystem must be `READY` (not WARNING):

- If `requirements.obsRequired = true` → OBS validation must be READY
- If `requirements.slideControlRequired = true` → slide control validation must be READY

### 5.3 Warnings

Warnings do not block Live unless the subsystem is marked required.

---

## 6. Failure Handling

If Go Live fails gating:

- server must return `session:live:denied { reasons[] }`
- TrainerView must display reasons in plain language
- TrainerView must provide a single path back to Stage: `Return to Stage`

No partial state changes are permitted.

---

## 7. Multi-Tab / Multi-Window Consistency

- `session.state` is the sole authoritative source of truth.
- Stage and TrainerView must subscribe to `session:state:update`.
- If Stage remains open in a second tab:
  - it must lock on LIVE update
  - any write attempts must be rejected server-side

---

## 8. Data Integrity Guarantees

### 8.1 Identity Preservation
- Focus cue IDs and media cue IDs must remain stable across snapshot.
- Snapshot copies objects; it does not regenerate IDs.

### 8.2 Ordering Preservation
- Focus cue order and media cue order (if used) must be preserved exactly in snapshot.

### 8.3 No Silent Mutation
- Snapshot must not rewrite cue text, labels, or URLs.
- Any normalization must occur pre-live on Stage and be visible to the trainer.

---

## 9. Out of Scope (Intentionally Undecided)

- Persistence of staging payload across sessions/templates
- Replays and recording semantics
- Participant proposals for focus/media

**Note:** Mid-live creation of new cues is now in scope (see Section 2.2 for TrainerView authority).

---

## 10. Enforcement Clause

Any implementation that:
- allows Stage to mutate staged data after LIVE
- auto-starts Live on TrainerView open
- snapshots without explicit Go Live action
- permits TrainerView to author cues at or before `currentPosition`
- modifies baseline snapshot after Live transition
- modifies executed cues in any snapshot revision

is **non-compliant**.

This contract exists to protect shared reality, reduce live cognitive load, and prevent drift of authority across time.

---

**End of Contract**
