# Status: Draft
# Owner: TBD
# Last reviewed: 2026-01-24

# UNIFIED CUE STACK CONTRACT

## Purpose

This contract defines a **unified cue stack** system that provides a single, sequential interface for managing all session elements (focus statements, media cues, and future cue types) across:

- **StageView** (authoring)
- **TrainerView** (execution & review)
- **LiveView** (display)

The unified cue stack follows a **hybrid execution model**: one stack with multiple execution paths and unified navigation.

---

## 0. Pipeline Separation (Architectural Foundation)

**The unified cue stack is a presentation and control abstraction only.**

It must NOT:
- Introduce a new execution pipeline
- Alter existing pipeline responsibilities
- Bypass or override pipeline authority
- Create parallel execution paths

**Each cue type routes execution intent to its respective pipeline, which remains authoritative for:**
- Execution semantics
- Validation rules
- Failure handling
- State management
- Broadcast/notification

### 0.1 Execution Routing

**Focus Cues:**
- Route to: **Focus Pipeline** (`server/pipelines/focus/`)
- Pipeline handles: activation, deactivation, state, broadcasting
- Cue stack provides: selection, sequencing, review interface

**Media Cues:**
- Route to: **Executor Pipeline** (default: OBS Pipeline, `server/pipelines/obs/`)
- Pipeline handles: playback, scene switching, validation, ACKs
- Cue stack provides: selection, sequencing, review interface

### 0.2 Pipeline Authority

**Pipelines remain the source of truth for:**
- Execution state (active/inactive, playing/stopped)
- Validation status (ready/warning/blocked)
- Error handling and recovery
- Broadcast events to clients

**The cue stack provides:**
- Unified authoring interface
- Sequential navigation
- Position tracking
- Review/replay orchestration

### 0.3 Contract Compliance

This principle ensures:
- Existing contracts remain valid (Media Cue Contract, Focus Box Contract)
- Pipeline boundaries are preserved
- No semantic drift between UI and execution
- Clear separation of concerns

**The cue stack orchestrates. Pipelines execute.**

---

## Core Principles

1. **Unified narrative order** - All cues exist in a single ordered stack
2. **Execution is explicit** - No auto-execution or auto-advancement
3. **Position does not imply execution** - Navigation and execution are independent
4. **Revisiting is allowed; rewriting is not** - Executed history is immutable
5. **Executed history must remain truthful** - No retroactive changes to what happened

---

## 1. Definitions

### 1.1 Cue Stack

A sequential, ordered list of cues defining the planned flow of a session.

The stack is:
- **Authorable** in StageView (pre-live and optionally live)
- **Executable & reviewable** in TrainerView (live only)
- **Rendered** in LiveView (live only)

### 1.2 Cue

A single element in the cue stack. Each cue has:
- A **type** (focus, media, or extensible future types)
- A **stable ID** (immutable, never changes)
- A **position** in the stack (0-indexed)
- **Type-specific data**
- **Timestamps** (createdAt, updatedAt)

### 1.3 Cue Types

#### Focus Cue
- **Type identifier**: `"focus"`
- **Purpose**: Declarative statement defining the room's intentional focus
- **Execution**: Activates via Focus Pipeline
- **State**: Active/Inactive (managed by pipeline)

#### Media Cue
- **Type identifier**: `"media"`
- **Purpose**: Declarative instruction to play media via executor
- **Execution**: Triggers executor pipeline (e.g. OBS)
- **State**: Idle/Playing/Stopped/Failed

### 1.4 Current Position

The index in the cue stack that TrainerView is currently positioned at.

- Cues **before** the position are considered **passed**
- The cue **at** the position is **eligible for execution**
- Cues **after** the position are **upcoming**

**Initial state**: `currentPosition = -1` (not started)

---

## 2. Data Model

### 2.1 Unified Cue Stack Schema

```typescript
CueStack {
  cues: Cue[],
  currentPosition: number,  // -1 if not started, 0+ if execution begun
  createdAt: isoString,
  updatedAt: isoString
}

Cue {
  id: string,                 // stable, immutable
  type: "focus" | "media",
  position: number,            // position in stack (0-indexed)
  data: FocusCueData | MediaCueData,
  createdAt: isoString,
  updatedAt: isoString
}
```

### 2.2 Focus Cue Schema

```typescript
FocusCueData {
  text: string,                // focus statement text
  isDefault?: boolean          // true if this is the default "Open Conversation" focus
}
```

### 2.3 Media Cue Schema

```typescript
MediaCueData {
  label: string,
  source: {
    type: "youtube" | "powerpoint" | "googleslides",
    url?: string,
    filePath?: string
  },
  playback: {
    audioMode?: "videoOnly" | "videoAndAudio",
    startAtSec?: number,
    endAtSec?: number
  },
  binding?: {
    executor: "obs",
    sceneId?: string,
    inputName?: string
  },
  validation: {
    status: "unvalidated" | "ready" | "warning" | "blocked",
    reasons?: string[]
  }
}
```

---

## 3. Cue State Machine

### 3.1 Canonical States

```
Draft → Validated → Executable → Executed (Immutable)
            ↘ Warning ↗
```

**State Definitions:**
- **Draft**: Cue created but not validated (media cues only)
- **Validated**: Cue has passed validation (READY or WARNING status)
- **Executable**: Cue is at or after currentPosition and ready to execute
- **Executed**: Cue has been executed at least once (immutable)

### 3.2 Allowed Operations by State

| State | Edit | Reorder | Execute | Re-Execute | Delete |
|-------|------|---------|---------|------------|--------|
| Draft | ✓ | ✓ | ✗ | ✗ | ✓ |
| Validated | ✗ | ✓* | ✓ | ✓ | ✗ |
| Executable | ✗ | ✓* | ✓ | ✓ | ✗ |
| Executed | ✗ | ✗ | ✓ (review) | ✓ (review) | ✗ |

\* Only if `position > currentPosition` (unexecuted cues)

**Key Rules:**
- **Focus cues**: Always in Validated state (no validation required)
- **Media cues**: Must be Validated before execution
- **Executed cues**: Immutable (no edit, reorder, or delete)

---

## 4. Authority Boundaries

### 4.1 StageView Authority

**StageView may:**
- Create cues of any type
- Edit unexecuted cues
- Delete unexecuted cues
- Reorder unexecuted cues
- Validate media cues
- View the full stack

**StageView must never:**
- Execute cues
- Advance execution position
- Modify execution state
- Mutate executed cues

### 4.2 TrainerView Authority

**TrainerView may:**
- View the full cue stack
- Advance or rewind position (Next/Previous)
- Execute or re-execute cues explicitly
- Review previously executed cues (review mode)
- Insert new cues ahead of currentPosition (if allowed)
- Stop current media execution

**TrainerView must never:**
- Auto-execute cues
- Auto-advance position
- Mutate executed cues
- Execute BLOCKED media cues
- Advance position without stopping current media (must use explicit stop)

### 4.3 LiveView Authority

**LiveView may:**
- Display the active focus (if a focus cue is active)
- Display currently playing media (if a media cue is playing)

**LiveView must never:**
- Display the cue stack
- Display upcoming or inactive cues
- Display editing controls
- Trigger execution

---

## 5. Authoring Model (StageView)

### 5.1 Unified Cue Stack Interface

StageView presents a single, unified interface:
- **Stack View**: Vertical list showing all cues in order
- **Cue Cards**: Each cue displayed as a card showing:
  - Cue type indicator (focus/media)
  - Content preview
  - Position number
  - Validation status (for media cues)
  - Edit/Delete/Reorder controls (when allowed)

### 5.2 Creating Cues

Trainers create cues by:
1. Selecting cue type (focus or media)
2. Filling type-specific form
3. Cue is inserted at end of stack (or at selected position)
4. Media cues are automatically validated on creation

### 5.3 Editing Rules

**Pre-live:**
- All cues editable

**Live:**
- **Focus cues**: Editable if unexecuted (`position > currentPosition`)
- **Media cues**: Read-only once validated (immutability after validation)

**Cue IDs and timestamps are never changed.**

---

## 6. Execution & Review Model (TrainerView)

### 6.1 Position Navigation

TrainerView may move the current position:
- **Forward** (Next button)
- **Backward** (Previous button)

**Position change does NOT trigger execution.**

### 6.2 Execution Semantics

#### Focus Cue Execution

```javascript
focus:activate { cueId }
```

- Routes to Focus Pipeline
- Pipeline handles activation, broadcasting, state
- Creates new activation timestamp (preserves original if re-activated)
- May be re-activated during review

#### Media Cue Execution

```javascript
media:cue:play {
  cueId,
  mode: "normal" | "review"
}
```

- Routes to Executor Pipeline (e.g. OBS Pipeline)
- Pipeline handles playback, scene switching, ACKs
- Execution is explicit
- Replay uses original validated definition
- Executor behavior is identical regardless of mode
- Executor is unaware of "review" beyond metadata

### 6.3 Review Mode

**Review mode** permits re-execution of a cue using its original, immutable definition.

**Review executions:**
- Do NOT alter cue state (Executed cues remain Executed)
- Do NOT create new canonical execution records
- Are logged separately for audit purposes only
- May be used to execute previously skipped cues

**Review mode must never rewrite historical execution order.**

**Catching Up:**
If a cue was skipped (position advanced without execution):
- Trainer may move position back
- Execute cue in review mode
- Cue becomes reviewed, not retroactively "executed"
- Preserves honesty: "We didn't do this earlier, we're doing it now."

### 6.4 Partial Media Execution

**Media cues may be interrupted** by trainer action.

**Rules:**
- Advancing position does NOT implicitly stop media
- Trainers must explicitly stop media or use combined "Stop & Advance" action
- Executor Pipeline must acknowledge stop before subsequent media execution

**Recommended Operation:**
- "Stop current & advance" button that:
  - Stops media cleanly (routes to Executor Pipeline)
  - Waits for stop ACK from pipeline
  - Advances position safely

---

## 7. Inserting Cues During Live

### 7.1 Insertion Rules

**Focus cues:**
- Always insertable ahead of currentPosition
- No validation required
- Must be positioned strictly after currentPosition

**Media cues:**
- Insertable ahead of currentPosition only
- Immediate validation required (routes to validation system)
- Must be positioned strictly after currentPosition

### 7.2 Validation Failure Policy

**BLOCKED** → insertion denied
- Cue cannot be inserted
- Trainer sees clear error message

**WARNING** → insertion allowed but execution disabled
- Cue is inserted into stack
- Cue marked as non-executable until validation resolved
- Trainer can re-validate later

**READY** → insertion allowed and executable
- Cue is inserted and immediately executable

**No silent failures. No "we'll see if it works."**

### 7.3 Insertion Constraints

- Inserted cues must be positioned strictly after currentPosition
- Never before or at position 0 during live
- No hard numeric limit (artificial limits backfire)
- Inserted cues inherit standard immutability rules once executed

---

## 8. Reordering Rules

### 8.1 Reordering Constraints

**Only cues with `position > currentPosition` may be reordered.**

**Rules:**
- Reordering does NOT modify validation state
- Validation is enforced at execution time, not reorder time
- Reordering must never place an unvalidated media cue into an executable position

### 8.2 Edge Cases

**During live:**
- If `currentPosition ≥ 0`, nothing may move ahead of it
- If `currentPosition = -1` (not started), reordering is unrestricted
- A media cue reordered earlier does NOT gain readiness
- Validation status is authoritative (managed by validation pipeline)
- Execution checks validation, not position

---

## 9. Destructive Edits (Explicitly Prohibited)

A **destructive edit** is any mutation that:
- Alters executed history
- Breaks validation guarantees
- Rewrites session chronology
- Undermines auditability

**The following are NEVER allowed:**
- Editing executed cue content
- Changing media source or playback after validation
- Reordering cues before currentPosition
- Deleting executed cues

**Executed cues become immutable records.**

---

## 10. Focus Cue Re-Activation (Temporal Integrity)

**Re-activating a focus cue:**
- Routes to Focus Pipeline
- Pipeline creates a new activation event with a new timestamp
- Original activation records are preserved
- Message alignment and temporal logic reference the most recent activation
- Focus cue content remains immutable

**This mirrors human reality:** "We're returning to this now."

---

## 11. Snapshot on Live Transition

### 11.1 Snapshot Behavior

**On transition to LIVE:**
1. Cue stack is snapshotted with `currentPosition = -1`
2. Snapshot becomes execution authority
3. Executed cues are locked
4. Snapshot ID is recorded for audit

### 11.2 Incremental Snapshots

**Live edits create incremental snapshot revisions, not replacements.**

- **Snapshot 1**: Live transition (baseline)
- **Snapshot 2+**: Incremental updates (insertions only, if allowed)
- Executed cues must remain identical across all snapshot versions

**This provides:**
- Clean "start state"
- Auditability across live changes
- Ability to reconstruct exactly what the trainer saw

---

## 12. Relationship to Existing Contracts

### 12.1 Media Cue Contract

This contract **extends** the Media Cue Contract:
- Media cues now exist within a unified stack
- Media cue execution remains unchanged (routes to Executor Pipeline)
- Media cue validation remains unchanged (routes to validation system)
- **Resolution**: Media cues are read-only once validated (preserves contract)

### 12.2 Focus Box Contract

This contract **extends** the Focus Box Contract:
- Focus cues now exist within a unified stack
- Focus activation remains unchanged (routes to Focus Pipeline)
- Focus semantics remain unchanged
- **Enhancement**: Focus cues can be sequenced with media

### 12.3 Stage-to-TrainerView Handoff Contract

This contract **extends** the Handoff Contract:
- Cue stack is part of staging payload
- Cue stack is snapshotted on Live transition
- TrainerView may insert cues during live (with constraints)

---

## 13. Explicit Prohibitions

The unified cue stack must never:

1. **Auto-execute cues** (no autoplay)
2. **Auto-advance position** (trainer controls all advancement)
3. **Show stack to audience** (LiveView shows only current active state)
4. **Modify cue IDs** (IDs are stable and immutable)
5. **Skip validation** (media cues must be validated before execution)
6. **Execute BLOCKED media cues** (prevent execution, show error)
7. **Mutate executed cues** (executed history is immutable)
8. **Implicitly stop media** (must be explicit)
9. **Bypass pipeline authority** (all execution routes through pipelines)
10. **Create new execution pipelines** (use existing pipelines only)

---

## 14. Future Extensibility

The cue stack is designed to be extensible:

- **Future cue types** can be added (e.g., "slide", "break", "poll")
- **Type-specific execution** routes to appropriate pipeline
- **Type-specific validation** as needed
- **Unified interface** remains consistent across all types

---

## 15. Implementation Guidelines

### 15.1 Socket Events

**Stack Management:**
- `cue:stack:get` - Fetch current cue stack
- `cue:stack:update` - Update entire stack (reorder)
- `cue:create` - Create new cue
- `cue:edit` - Edit existing cue (if allowed)
- `cue:delete` - Delete cue (if allowed)
- `cue:stack:position:advance` - Advance execution position
- `cue:stack:position:rewind` - Rewind execution position

**Execution (routes to pipelines):**
- `focus:activate { cueId }` - Routes to Focus Pipeline
- `media:cue:play { cueId, mode }` - Routes to Executor Pipeline
- `media:cue:stop { cueId }` - Routes to Executor Pipeline

**Review:**
- Review executions use same events with `mode: "review"`
- Review events logged separately for audit

### 15.2 Storage

- Cue stack stored in staging state
- Snapshot stored in session state on Live transition
- Incremental snapshots stored as revisions

### 15.3 Component Structure

**StageView:**
- `UnifiedCueStackPanel` - Single component managing entire stack
- Type-specific forms for creation/editing
- Drag-and-drop or arrow controls for reordering

**TrainerView:**
- `CueStackExecutionPanel` - Displays stack with position indicator
- Next/Previous navigation controls
- Type-specific execution buttons
- Review mode toggle

**LiveView:**
- Displays current active state only (no stack visibility)

---

## 16. Contract Status

This contract is **DRAFT** and requires:
- Review and approval
- Implementation plan
- Integration with existing contracts

---

**End of Contract**
