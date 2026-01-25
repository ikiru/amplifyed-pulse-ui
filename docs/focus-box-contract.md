# Status: Canonical
# Owner: TBD
# Last reviewed: 2026-01-24

# FOCUS BOX CONTRACT

## TL;DR (Guarantees)

- **Exactly one active focus** at all times (default: “Open Conversation”).
- **Audience sees only the active focus** (no history, no inactive list, no controls).
- **Trainer can activate** focus entries and manage focus state during live facilitation (trainer-only controls/state).
- **Non-enforcement**: focus is orientation only; it must not restrict, judge, or coerce behavior.

## 1. Purpose

The Focus Box provides **shared orientation** in a live, projected training environment.

It declares a single, canonical focus for the room so participants can align understanding and contribution without coercion, enforcement, or behavioral control.

The Focus Box governs **meaning**, not behavior.

---

## Implementation Pointers (Code)

**Socket events (implementation surface):**
- **Audience-facing broadcast**: `focus:update`, `focus:cleared`
- **Trainer actions**: `focus:entry:add`, `focus:activate`, `focus:reset_default`, `focus:edit_in_place`, `focus:revise_by_new`, `focus:reorder`
- **Trainer state sync**: `focus:trainer:state`
- (Legacy) aliases used in some clients: `focus:set`, `focus:clear`

**Server:**
- Focus pipeline: `server/pipelines/focus/focusPipeline.js` (`registerFocusHandlers`)
- Focus state: `server/pipelines/focus/focus.state.js`
- Router wiring + join sync: `server/routers/eventRouter.js`

**Client:**
- Trainer controls UI: `src/components/focus/FocusControls.jsx`
- Trainer state hook: `src/hooks/useFocusState.js`
- Focus subscriptions: `src/hooks/useTrainerSocket.js`, `src/hooks/useLiveViewSocket.js`
- Global focus mirror: `src/socket/SocketContext.jsx`

## 2. Definitions

**Focus**  
A concise, human-readable declarative statement representing what the room is collectively attending to.

**Active Focus**  
The single focus statement currently designated as canonical system state and visible to the audience.

**Inactive Focus**  
A stored focus statement visible only to the trainer and not part of shared room reality.

**Room**  
All participants and observers experiencing the live session, including projected, recorded, or assistive views.

**Focus Cue**  
A Focus entry authored pre-session on Stage and consumed by the Focus Box during live facilitation.

---

## 3. Non-Negotiable Principles

1. **Singularity**  
   Exactly one focus must be active at all times.

2. **Canonicity**  
   The active focus is the authoritative declaration of shared orientation.

3. **Trainer Cognition vs Room Reality Separation**  
   Trainer-only structures must not leak into audience perception.

4. **Non-Enforcement**  
   Focus provides orientation only and must never compel, restrict, or evaluate behavior.

5. **Projection Safety**  
   The active focus must be interpretable without explanation when viewed at scale.

6. **Dignity Preservation**  
   The Focus Box must not induce urgency, shame, compliance pressure, or correction signaling.

---

## 4. Visibility Guarantees

### 4.1 Audience View

- The audience must see **only the active focus**.
- The audience must never see:
  - inactive focuses
  - focus history
  - planned or alternative focuses
  - editing controls or affordances
- From the audience perspective, the active focus must appear as a **stable declaration**, not a menu or choice set.

### 4.2 Trainer View

- The trainer may see:
  - the active focus
  - a list of inactive focuses
  - controls for selecting and activating focuses (authoring occurs pre-live on Stage)
- Trainer-only affordances must not affect the audience view unless the active focus changes.

---

## 5. Structural Constraints

1. **Single Focus Box**
   - The Focus Box is a single component containing:
     - one input field
     - one list of focus entries (trainer-only)
   - No secondary panels or split boxes are permitted.

2. **Focus Entry States**
   - Each focus entry exists in exactly one of two states:
     - Active (exactly one)
     - Inactive (zero or more)

3. **Highlight Semantics**
   - In trainer view, the active focus must be unambiguously distinguished.
   - This distinction is semantic system state, not decorative styling.

4. **Focus Ordering**
   - Focus entries may be ordered intentionally prior to live facilitation.
   - Ordering of executed cues must not change once the session is live.
   - Unexecuted cues (`position > currentPosition`) may be reordered during live.
   - Order conveys authorial intent and must be preserved for executed cues.

---

## 6. Adding Focus

**Note:** Focus entries are primarily created pre-live on Stage. During live sessions, TrainerView may insert new focus cues ahead of the current execution position. See Section 6A for temporal restrictions and Section 6B for live insertion rules.

1. **Creation Rule**
   - Submitting text creates a new focus entry.
   - Newly created focuses must be inactive by default.

2. **No Implicit Activation**
   - Creating a focus must not activate it automatically.
   - Activation requires explicit selection.

3. **No Draft States**
   - Focus entries must not exist in hidden, partial, or provisional form.

---

## 6A. Focus Authoring (Pre-Live and Live)

- Focus entries are primarily authored, edited, and reordered before the session is live (on Stage).
- During live sessions, TrainerView may insert new focus cues ahead of the current execution position (`currentPosition`).
- Focus cues may be edited if unexecuted (`position > currentPosition`).
- Executed focus cues are immutable.
- Focus authoring occurs outside the Focus Box (e.g., Stage for pre-live, TrainerView for live insertion).

---

## 6B. Live Insertion Rules

During live sessions, TrainerView may insert new focus cues with the following constraints:

1. **Position Constraint**: Cues must be inserted strictly ahead of `currentPosition` (i.e., `position > currentPosition`)
2. **No Validation Required**: Focus cues do not require validation (unlike media cues)
3. **Immediate Availability**: Inserted focus cues are immediately available for activation
4. **Editing Permissions**: Inserted focus cues follow the same editing rules as pre-live cues (editable if unexecuted)
5. **No Silent Failures**: Trainer must see clear feedback if insertion fails (e.g., position constraint violation)

---

## 7. Selecting Focus (Activation)

1. **Selection Equals Activation**
   - Selecting a focus entry sets it as the active focus immediately.
   - The previously active focus becomes inactive.

2. **Atomic Change**
   - Focus activation must be instantaneous and singular.
   - There must be no overlap, blend, or transition state.

3. **Intentional Action Only**
   - Focus must not change due to hover, scroll, edit, timing, or automation.

---

## 8. Editing Focus (Temporal Restriction)

**Temporal Rules:**

**Pre-live:**
- All focus entries editable on Stage

**Live:**
- Focus entries may be edited if `position > currentPosition` (unexecuted)
- Executed focus entries are immutable
- If intent must change for an executed focus, create a new focus entry instead

### 8.1 Permitted Reasons for Editing

Editing is allowed only to correct:
- spelling
- grammar
- clarity that preserves original intent

Editing must not be used to retroactively change the meaning of what the room was oriented to.

---

### 8.2 Required Edit Modes

The system must support both modes explicitly.

#### A. Edit-in-Place
- Modifies text of an existing focus entry.
- Entry identity remains the same.
- If the entry is active, the audience immediately sees the updated wording.
- Must be used only when intent remains unchanged.

#### B. Revise-by-New
- Creates a new focus entry.
- Original entry remains unchanged.
- Trainer explicitly selects which entry becomes active.

The system must not guess which mode applies.

---

### 8.3 Edit Transparency

- Editing the active focus must result in a visible text change for the audience.
- Silent substitution or behind-the-scenes rewriting is prohibited.

---

## 9. Explicit Prohibitions

The Focus Box must never:

1. **Control or Shape Behavior**
   - Mute, slow, block, or prioritize messages
   - Mark contributions as on-topic or off-topic

2. **Act as Enforcement**
   - Display warnings, nudges, compliance signals, or corrective feedback

3. **Introduce Automation**
   - AI suggestions, rewrites, or auto-corrections
   - Auto-activation, auto-rotation, or inference of focus

4. **Create Ambiguous Reality**
   - Multiple active focuses
   - Hidden, partial, or time-based states

5. **Produce Analytics or Judgment**
   - Tracking of adherence, alignment, or performance

---

## 10. Structural Wireframe (Non-Visual)

### Trainer View

+------------------------------------------------------+
| FOCUS |
| |
| [ Enter focus statement… ] [ Add ] |
| |
| Focus List (trainer-only): |
| * [ACTIVE] Current focus statement |
| [ ] Previous focus statement |
| [ ] Another focus statement |
| |
| (Actions per entry: Select, Edit) |
+------------------------------------------------------+

shell
Copy code

### Audience View

+------------------------------------------+
| FOCUS |
| Current focus statement |
+------------------------------------------+

yaml
Copy code

---

## 11. Out-of-Scope (Intentionally Undecided)

- Focus persistence across sessions
- Focus visibility in recordings or replays
- Participant proposals or reactions

These require separate contracts.

---

## 12. Enforcement Clause

Any implementation that violates the guarantees or prohibitions in this contract is **non-compliant**, regardless of technical feasibility or convenience.

This component exists to protect **shared reality, dignity, and interpretability under pressure**.

---