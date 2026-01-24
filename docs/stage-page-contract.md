# Status: Canonical
# Owner: TBD
# Last reviewed: 2026-01-XX

# STAGE_PAGE_CONTRACT

## Purpose

The Stage page exists to provide a **pre-session authoring and verification environment** for trainers, separate from all live facilitation surfaces.

Its sole function is to allow intentional setup **before** a session becomes live, so that TrainerView remains cognitively light, stable, and focused on human facilitation.

Stage is not a live control surface.
Stage is not audience-facing.
Stage does not react to participants.

---

## Core Principle

**Stage governs preparation.  
TrainerView governs activation.  
LiveView governs shared reality.**

No surface may assume responsibilities outside its time boundary.

---

## Scope of Authority

Stage has **write authority** over the following domains **before a session is live**:

- Focus authoring and ordering (via Focus Cues)
- Media authoring and validation (via Media Cues)
- System readiness verification (OBS, slide control, permissions)
- Session entry state configuration
- Pre-session notes and outlines (trainer-only)

Once the session transitions to live, Stage loses all write authority.

---

## Temporal Boundary

Stage operates exclusively in **Pre-Live** time, using a separate **staging state** that is independent of session state.

### Defined States

- **Draft** – Staging state exists, nothing validated
- **Staged** – All required systems validated, staging state ready
- **Live** – Session has started (staging state is snapshotted, Stage becomes read-only)

### Session Creation

- Sessions are **not created** until the transition to Live
- Stage operates on staging state, not session state
- When Live begins:
  1. Staging state is snapshotted
  2. Session is created (per Session Contract)
  3. Snapshot becomes session's initial state
  4. Staging state becomes read-only

Stage **must not** initiate or control the Live state. The transition to Live is initiated by the trainer entering TrainerView and explicitly starting the session.

---

## Immutable Transition Rule

At the moment the trainer enters TrainerView and initiates Live:

1. **Staging state is snapshotted**
   - All Focus Cues (ordered list)
   - All Media Cues (with validation status)
   - Session entry state configuration
   - System readiness verification results

2. **Session is created** (per Session Contract)
   - Session identifier generated
   - Access code and QR code generated
   - Session state initialized from snapshot

3. **Snapshot becomes authoritative**
   - The snapshot is the single source of truth for the live session
   - TrainerView consumes from the snapshot, not staging state
   - Stage-authored objects become read-only in staging state

4. **Staging state becomes read-only**
   - No object authored on Stage may be edited once Live begins
   - Stage can view staging state but cannot modify it
   - Any changes to staging state do not affect the live session

**Critical:** The snapshot is created atomically at the moment of transition. There is no window where staging state changes can affect an already-live session.

---

## Definitions

**Staging State**  
A separate, pre-session data store that exists independently of session state. Staging state contains all Stage-authored content (Focus Cues, Media Cues, configuration) before the session becomes live. Staging state is not accessible to participants and does not create a session.

**Session State**  
The authoritative state managed by the Session Pipeline (see Session Contract). Session state exists only after the session becomes live. Session state is created when staging state is snapshotted at the transition to Live.

**Snapshot**  
The immutable copy of staging state that is created at the moment the session transitions to Live. The snapshot becomes the single source of truth for the live session. Once snapshotted, staging state becomes read-only and cannot be modified.

**Focus Cue**  
A Focus entry authored pre-session on Stage and consumed by the Focus Box during live facilitation. (See Focus Box Contract)

**Media Cue**  
A pre-authored, declarative instruction that represents trainer intent to play a specific piece of media during a live session. Media Cues are not media files and not playback—they are a declarative cue sheet that is authored pre-live, validated pre-live, and executed live via a deterministic executor (default: OBS pipeline). (See Media Cue Contract - TBD)

---

## Staging State Storage

### Storage Location

Staging state is stored separately from session state:
- Staging state: `server/staging/<stagingId>/` or equivalent
- Session state: `server/pipelines/session/` (per Session Contract)

### Staging State Contents

Staging state contains:
- Focus Cues (ordered list of Focus entries)
- Media Cues (list with validation status)
- Session entry defaults (configuration)
- Validation results (OBS, slide control, media accessibility)

### Access Control

- **Stage**: Full read/write access (pre-Live only)
- **TrainerView**: Read-only access to snapshot (Live only)
- **Session Pipeline**: Receives snapshot at Live transition
- **Participants**: No access to staging state or snapshot

### Lifecycle

1. Staging state created when Stage first opened
2. Staging state modified during Draft/Staged phases
3. Staging state snapshotted at Live transition
4. Staging state becomes read-only after snapshot
5. Staging state may persist for post-session review (out of scope for v1)

---

## Session Entry State Configuration

Session Entry State is the set of pre-live defaults that determine what a participant experiences at join and what the system considers canonical at LIVE_BEGIN.

It includes only participant-facing defaults and session-wide safety posture, not trainer convenience.

### Session Entry State Fields (v1)

**Default Focus Cue**
- `entry.defaultFocusCueId` (required)
- Must resolve to an existing staged Focus Cue
- If none exist, Stage must provide canonical default: "Open Conversation" as a system Focus Cue (created in staging automatically, not via "draft text")

**Focus Visibility On Join**
- `entry.focusVisibleOnJoin` (boolean, required)
- Default: `true`

**Audience Chat Availability On Join**
- `entry.chatOpenOnJoin` (boolean, required)
- Default: `true` unless a safety posture requires otherwise

**Anonymity**
- Anonymity is **always ON** and cannot be configured
- This is a fundamental principle of the system (see `visual-meaning-and-anonymity-contract.md`)
- The system always operates with participant anonymity enabled
- No configuration option exists for this setting

**Welcome Message**
- `entry.welcomeMessage` (optional string)
- If present: shown once on join (audience-facing)
- Must be static text. No personalization, no targeting, no inferred content

### Explicitly NOT Included

- Default Media Cue to play: **NO** (prohibited). Autoplay is not allowed by Stage contract; playback must be an intentional live trigger from TrainerView.
- Anything that changes message ranking, gating, or moderation thresholds in real time (those belong to their own contracts if needed).

---

## Validation Criteria

Stage validation must output for each subsystem:

- **READY** (pass) – System validated and functional
- **WARNING** (proceed allowed) – May work but unverified (trainer can proceed)
- **BLOCKED** (proceed disallowed) – Will fail (prevents STAGED if required)

### Media Accessibility Validation (per Media Cue)

**Checks (v1 YouTube):**
- URL parses and matches allowed host patterns (`youtube.com` / `youtu.be`)
- Video ID extractable
- Basic reachability check:
  - If server can fetch metadata/HEAD: do it
  - If not feasible: mark WARNING with "unverified reachability"
- Embeddability signal (best-effort):
  - If metadata indicates restricted/unavailable: BLOCKED
  - If unknown: WARNING

**Pass/fail:**
- **READY**: valid URL + reachable + not known restricted
- **WARNING**: valid URL but reachability/embeddability unconfirmed
- **BLOCKED**: invalid URL OR known unavailable/restricted

### OBS Connectivity Validation (session-level)

**Checks:**
- OBS executor reachable (whatever integration is: websocket/local agent)
- Auth/handshake success
- Scene inventory accessible (if you rely on scene binding)
- If Media Cues bind `sceneId`/`inputName`: confirm they exist

**Pass/fail:**
- **READY**: connected + (if bindings exist) bindings resolve
- **WARNING**: connected but bindings unverified (only allowed if you are not binding cues to scenes)
- **BLOCKED**: cannot connect OR required bindings missing

### Slide Control Agent Presence + Permissions

**Checks:**
- Local controller agent reachable (ping/handshake)
- Permission status known:
  - macOS: Accessibility permission granted
  - Windows: whatever equivalent your agent reports
- Target app detect (optional): Chrome/PowerPoint detected or "unknown"

**Pass/fail:**
- **READY**: agent reachable + permissions granted
- **WARNING**: agent reachable + permissions unknown (only if you allow manual fallback)
- **BLOCKED**: agent unreachable OR permissions denied

---

## Readiness Gating

### Stage Readiness State

- **DRAFT**: not staged
- **STAGED**: minimum readiness met
- **LIVE**: live

### Minimum Requirements for STAGED

To be STAGED, the session must satisfy:

**Required:**
1. Entry State Valid
   - `defaultFocusCueId` resolves
   - `focusVisibleOnJoin`, `chatOpenOnJoin` present
2. At least one Focus Cue exists in staging
   - Includes the canonical default if trainer created none

**Optional but recommended:**
3. OBS validated READY if any Media Cue is bound to OBS execution
4. Slide control agent validated READY if trainer toggles "Slide control required"

### Required Subsystem Toggles (v1)

Stage must allow the trainer to mark these as required for this session:

- `requirements.obsRequired` (default: `false`)
- `requirements.slideControlRequired` (default: `false`)

**STAGED Calculation:**
- If required flag is `true`, that subsystem must be READY (not WARNING)
- If required flag is `false`, that subsystem may be WARNING or even absent

This avoids Stage becoming tyrannical while still preventing accidental failure.

---

## Live Transition

### Rule

Live begins only via an explicit trainer action in TrainerView.

Not automatic on page open. Not auto if validations are green.

### Mechanism

TrainerView must provide an explicit control:

**GO LIVE** (or **START SESSION**)

When pressed:
- System performs LIVE_BEGIN transition
- System snapshots staging into live
- Session becomes immutable

Stage never initiates Live.

---

## Read-only Enforcement

### Detection Method (Required)

Stage detects Live via authoritative session state pushed from server.

**On Stage load:**
- Fetch `session.state`

**Subscribe to session state events:**
- `session:state:update`

**When Stage receives `state = LIVE`:**
- Stage UI becomes read-only immediately
- Any attempt to write triggers a server rejection (see below)

### Server-side Enforcement (Non-Negotiable)

Even if Stage UI fails:

- Server must reject write events when `session.state = LIVE`
- Rejects: focus cue create/edit/reorder, media cue create/edit/reorder, entry state edits
- Return error: `stage:write:rejected { reason: "SESSION_IS_LIVE" }`

### Multi-tab Behavior

If Stage is open in multiple tabs/windows:

- All tabs receive the state update event and lock simultaneously
- If a tab is stale/offline, server rejection still prevents mutation
- No polling required if events exist; polling is permitted as a fallback

---

## Validation Failure Handling

### Warnings

Warnings are allowed for:

- "Media reachability unverified"
- "Target app unknown (slide control)"
- "Optional binding not verified"

Warnings must:

- Name the subsystem
- Name the impact
- Offer the trainer a fallback suggestion (manual, skip, etc.)
- Remain trainer-only

### Blocks

Blocks prevent the session reaching "Staged" readiness and may prevent GO LIVE depending on category.

Blocks must exist for:

- No default focus cue resolvable
- OBS required but not connected (if session intends to use OBS execution)
- Slide control required but permissions denied/unreachable (if trainer requires slide control)
- Media cue invalid URL (if that cue is marked "required")

### Can Trainer Proceed with Warnings?

**Yes.**

### Can Trainer Proceed with Blocks?

Only if the blocked subsystem is not marked required for this session.

---

## Owned Responsibilities

Stage is responsible for:

1. **Authoring (Pre-Live Only)**
   - Creating and ordering Focus Cues
   - Creating and configuring Media Cues (see Media Cue Contract - TBD)
   - Defining session entry defaults

2. **Media Cues (Pre-Live Only)**
   - Stage must support authoring a list of Media Cues. A Media Cue is a declarative, pre-validated instruction that can be triggered during live facilitation.
   - Stage may create, edit, validate, and bind Media Cues only before the session is live.
   - TrainerView may only trigger execution of a Media Cue by referencing its cue ID.
   - Execution is performed by a deterministic executor (default: OBS pipeline) which must acknowledge success or failure.

3. **Validation**
   - Verifying media accessibility
   - Verifying OBS connectivity
   - Verifying slide control agent presence and permissions
   - Surfacing readiness status clearly

4. **Readiness Gating**
   - Clearly indicating whether the session is safe to proceed
   - Preventing accidental live entry when critical systems are unverified

Stage may warn.
Stage may block.
Stage may not auto-correct.

---

## Explicit Non-Responsibilities

Stage must never:

- Display participant messages
- Display live metrics (pulse, confusion, drift, votes)
- Allow moderation actions
- Allow live focus editing
- Allow live media browsing or searching
- Allow live Media Cue creation or editing
- Trigger playback automatically
- Initiate or terminate a live session
- Create or modify session state directly
- Access live session data
- Modify snapshotted data
- Trigger session creation

If an action requires reacting to participants, it does not belong on Stage.

---

## Relationship to Other Surfaces

- **TrainerView**
  - Consumes Stage-authored snapshots
  - Activates Focus Cues
  - Triggers Media Cues
  - Performs live facilitation only
  - When trainer opens TrainerView (pre-live):
    - TrainerView must fetch session state
    - TrainerView must fetch staging payload (if session is DRAFT/STAGED)
    - TrainerView must display "Not Live" state clearly
    - TrainerView must show Stage-authored Focus Cues and Media Cues as available
  - Does TrainerView snapshot automatically if staging is STAGED? **No.** Snapshot occurs only at GO LIVE.
  - Can trainer edit staging from TrainerView (pre-live)? **Default answer: No.** Why: it collapses the boundary that Stage is meant to protect, and TrainerView will re-congest.
  - Allowed exception (if you really want it): TrainerView may offer a single link/button: "Return to Stage". No editing inline.

- **LiveView**
  - Reflects only what TrainerView activates
  - Has no awareness of Stage

- **OBS Pipeline**
  - Executes Media Cues deterministically
  - Reports readiness status back to Stage
  - Reports execution status (ACKs) to TrainerView
  - Does not accept configuration from TrainerView

- **Slide Control Pipeline**
  - Reports readiness status back to Stage
  - Does not accept configuration from TrainerView

- **Session Pipeline**
  - Receives snapshot at Live transition
  - Creates session from snapshot
  - Manages session state (per Session Contract)
  - Has no awareness of staging state or Stage

---

## Failure Philosophy

Stage failures must be:

- Visible
- Descriptive
- Non-catastrophic

Stage exists to ensure failures occur **before** the audience arrives.

---

## Security & Privacy

- Stage is trainer-only
- Stage data is never visible to participants
- Stage does not log or analyze participant behavior
- Stage does not introduce surveillance or inference

---

## Enforcement Clause

Any feature that:
- Writes state
- Alters intent
- Reorders meaning
- Requires deliberation

**must occur on Stage or not at all.**

Any feature that:
- Reacts
- Moderates
- Activates
- Interprets human input

**must not occur on Stage.**

---

## Implementation Pointers (Code)

### Event Naming Rule

Use one namespace and keep it consistent:

- `stage:*` = pre-live authoring + validation
- `session:*` = session state + lifecycle
- `focus:*` = live activation/broadcast (existing)
- `media:*` = live execution/ack (existing)

Avoid `stage:focus:*` vs `focus:*` split unless you must. Keep pre-live under `stage:*`.

### Stage Authoring Events (Pre-Live)

#### Focus Cue Authoring (Stage Only)

**Client → Server:**
- `stage:focus:create { sessionId, text, insertAfterCueId? }`
- `stage:focus:edit { sessionId, cueId, text, editMode: "edit_in_place" | "revise_by_new" }`
- `stage:focus:reorder { sessionId, orderedCueIds: string[] }`
- `stage:focus:delete { sessionId, cueId }`
- `stage:focus:set_default { sessionId, defaultFocusCueId }`

**Server → Client:**
- `stage:focus:ack { sessionId, opId, focusCues_staging, entryState_staging }`
- `stage:focus:error { sessionId, opId, code, message }`

#### Session Entry State Configuration

**Client → Server:**
- `stage:entry:update { sessionId, entry: { defaultFocusCueId?, focusVisibleOnJoin?, chatOpenOnJoin?, welcomeMessage? } }`

**Server → Client:**
- `stage:entry:ack { sessionId, opId, entryState_staging }`
- `stage:entry:error { sessionId, opId, code, message }`

#### Requirement Toggles

**Client → Server:**
- `stage:requirements:update { sessionId, requirements: { obsRequired?, slideControlRequired? } }`

**Server → Client:**
- `stage:requirements:ack { sessionId, opId, requirements_staging }`
- `stage:requirements:error { sessionId, opId, code, message }`

#### Media Cue Authoring (Stage Only)

**Client → Server:**
- `stage:media:create { sessionId, label, source: { type, url }, playback: { audioMode, startAtSec?, endAtSec? }, binding?: { executor, sceneId?, inputName? } }`
- `stage:media:edit { sessionId, cueId, label?, source?, playback?, binding? }`
- `stage:media:delete { sessionId, cueId }`
- `stage:media:reorder { sessionId, orderedCueIds: string[] }`

**Server → Client:**
- `stage:media:ack { sessionId, opId, mediaCues_staging, validation_staging }`
- `stage:media:error { sessionId, opId, code, message }`

#### Validation Requests

**Client → Server:**
- `stage:validate:request { sessionId, subsystem?: "media" | "obs" | "slideControl" | "all" }`

**Server → Client:**
- `stage:validate:result { sessionId, subsystem, status: "ready" | "warning" | "blocked", reasons?: string[], details?: object }`
- `stage:validate:complete { sessionId, readinessState: "DRAFT" | "STAGED", validationSummary: object }`

#### Session State Queries

**Client → Server:**
- `session:state:get { sessionId }`

**Server → Client:**
- `session:state:response { sessionId, state: "DRAFT" | "STAGED" | "LIVE", stagingPayload?: object }`
- `session:state:update { sessionId, state: "DRAFT" | "STAGED" | "LIVE" }` (broadcast to all connected clients)

#### Go-Live (TrainerView Only)

**Client → Server:**
- `session:live:begin { sessionId }`

**Server → Client:**
- `session:live:ack { sessionId, state: "LIVE", snapshotId }`
- `session:live:error { sessionId, code, message }` (if gating rules fail)

### Server-Side Enforcement

All `stage:*` write events must check `session.state` before processing:

```javascript
if (session.state === 'LIVE') {
  return { event: 'stage:write:rejected', reason: 'SESSION_IS_LIVE' };
}
```

This check must occur **before** any staging state mutation.

### Staging State Structure (Server)

```javascript
stagingState = {
  sessionId: string,
  state: "DRAFT" | "STAGED",
  focusCues: [
    { id: string, text: string, order: number, createdAt: isoString }
  ],
  mediaCues: [
    { 
      id: string, 
      label: string, 
      source: { type: string, url: string },
      playback: { audioMode: string, startAtSec?: number, endAtSec?: number },
      binding?: { executor: string, sceneId?: string, inputName?: string },
      validation: { status: string, reasons?: string[] },
      createdAt: isoString
    }
  ],
  entryState: {
    defaultFocusCueId: string,
    focusVisibleOnJoin: boolean,
    chatOpenOnJoin: boolean,
    welcomeMessage?: string
  },
  requirements: {
    obsRequired: boolean,
    slideControlRequired: boolean
  },
  validation: {
    obs: { status: string, reasons?: string[], lastChecked?: isoString },
    slideControl: { status: string, reasons?: string[], lastChecked?: isoString },
    media: { [cueId: string]: { status: string, reasons?: string[], lastChecked?: isoString } }
  }
}
```

### Snapshot Creation (Atomic)

When `session:live:begin` is received:

1. Lock staging state (prevent concurrent writes)
2. Deep clone staging state → snapshot
3. Set `session.state = "LIVE"`
4. Emit `session:state:update` to all clients
5. Mark staging state as read-only
6. Unlock

The snapshot becomes the authoritative source for the live session.

---

## Contract Status

This contract is binding.

Changes require explicit versioning and review, as it defines a core temporal boundary in the system.

---

**End of Contract**
