# Status: Canonical
# Owner: TBD
# Last reviewed: 2026-01-24

# MEDIA CUE CONTRACT

## Purpose

Media Cues are pre-authored, declarative instructions that represent trainer intent to play a specific piece of media during a live session, using a deterministic executor (usually OBS).

Media Cues are not media files and not playback.
They are a declarative cue sheet.

---

## TL;DR (Guarantees)

- **Authored pre-live** (Stage) or **inserted live** (TrainerView, ahead of currentPosition)
- **Validated pre-live** (Stage) or **immediately upon live insertion** (TrainerView)
- **Executed live** (TrainerView trigger)
- **Rendered/played by a single executor** (OBS pipeline by default)
- **Never audience-editable, never audience-visible as a list**
- **Immutable once validated** (cannot be edited after validation status is set)

---

## Core Principles

1. **Declarative, Not Imperative**
   - Media Cues describe intent, not execution steps
   - Execution is deterministic and handled by the executor

2. **Authoring and Live Insertion**
   - Media Cues are primarily authored pre-live on Stage
   - During live sessions, TrainerView may insert new media cues ahead of the current execution position (`currentPosition`)
   - Once validated, media cues become immutable (cannot be edited)
   - Executed media cues are always immutable

3. **Validation Before Execution**
   - All Media Cues must be validated before execution
   - Pre-live cues are validated on Stage before session becomes live
   - Live-inserted cues are validated immediately upon insertion
   - Validation status determines readiness and insertion eligibility

4. **Executor Independence**
   - Media Cues are executor-agnostic in structure
   - Execution details are handled by the executor (default: OBS pipeline)

5. **No Autoplay**
   - Media Cues never play automatically
   - Execution requires explicit trainer trigger from TrainerView

---

## Definitions

**Media Cue**  
A pre-authored, declarative instruction that represents trainer intent to play a specific piece of media during a live session. Media Cues are not media files and not playback—they are a declarative cue sheet that is authored pre-live, validated pre-live, and executed live via a deterministic executor (default: OBS pipeline).

**Executor**  
The system component responsible for deterministic execution of Media Cues. Default executor is the OBS Pipeline. Executors handle the mechanical details of playback, scene switching, and audio routing.

**Binding**  
The association between a Media Cue and executor-specific resources (e.g., OBS scene, input source). Bindings are optional and executor-specific.

**Validation**  
The process of verifying that a Media Cue can be executed successfully. Validation occurs pre-live (on Stage) or immediately upon live insertion (on TrainerView), and outputs READY, WARNING, or BLOCKED status.

---

## Media Cue Object Schema

### Minimum Viable Canonical Shape

```typescript
MediaCue {
  id: string,                 // stable identity
  label: string,              // human-friendly name shown to trainer
  source: {
    type: "youtube" | "powerpoint" | "googleslides",
    url?: string,             // for youtube/googleslides: canonical link
    filePath?: string         // for powerpoint: file path or filename
  },
  playback: {
    audioMode: "videoOnly" | "videoAndAudio",  // only applies to youtube
    startAtSec?: number,      // optional, only applies to youtube
    endAtSec?: number         // optional, only applies to youtube
  },
  binding: {
    executor: "obs",
    sceneId?: string,         // optional: fixed scene
    inputName?: string        // optional: source name within OBS
  },
  validation: {
    status: "unvalidated" | "ready" | "warning" | "blocked",
    reasons?: string[]
  },
  createdAt: isoString
}
```

### Field Descriptions

**id** (required)
- Stable, unique identifier for the Media Cue
- Assigned by system at creation
- Never changes

**label** (required)
- Human-friendly name shown to trainer
- Exists so trainers don't see URLs in live workflow
- Trainer-authored

**source** (required)
- **type**: Media source type ("youtube" | "powerpoint" | "googleslides")
- **url**: Canonical link to the media resource (required for youtube/googleslides)
- **filePath**: File path or filename (required for powerpoint)

**playback** (required)
- **audioMode**: "videoOnly" or "videoAndAudio" (only applies to youtube, defaults to "videoOnly" for slides)
- **startAtSec**: Optional start time in seconds (for trimming, only applies to youtube)
- **endAtSec**: Optional end time in seconds (for trimming, only applies to youtube)

**binding** (optional)
- **executor**: Executor identifier (default: "obs")
- **sceneId**: Optional fixed OBS scene to use
- **inputName**: Optional source name within OBS

**validation** (required)
- **status**: Current validation state
- **reasons**: Optional array of validation messages

**createdAt** (required)
- ISO timestamp of creation
- Set by system at creation

---

## Media Cue Creation

### Creation Rules

Media Cues may be created:
- **Pre-live**: On Stage only
- **Live**: On TrainerView, but only ahead of `currentPosition` (insertion only)

**Creation is a single atomic action** that results in a real object (no drafts), consistent with Focus philosophy.

### Creation Process

Trainer submits a Media Cue with:

1. **label** (required)
2. **source type** (youtube, powerpoint, or googleslides)
3. **source data**:
   - For YouTube/Google Slides: **url** (required)
   - For PowerPoint: **filePath** (required)
4. **audioMode** (default: "videoOnly", only applies to YouTube)
5. **Optional playback settings** (startAtSec, endAtSec - only apply to YouTube)
6. **Optional OBS binding** (scene/source)

System assigns:
- `id` (stable identifier)
- `createdAt` (timestamp)
- `validation.status` (initially "unvalidated")

System stores cue in session staging state (pre-live) or live session state (live insertion).

Validation is triggered immediately:
- **Pre-live**: Stage immediately runs validation and sets `validation.status`
- **Live**: TrainerView triggers immediate validation upon insertion; validation status determines if insertion is allowed

### Live Insertion Rules

During live sessions, TrainerView may insert new media cues with the following constraints:

1. **Position Constraint**: Cues must be inserted strictly ahead of `currentPosition` (i.e., `position > currentPosition`)
2. **Immediate Validation**: Inserted cues must be validated immediately
3. **Validation Outcomes**:
   - **BLOCKED**: Insertion denied, cue not added to stack
   - **WARNING**: Insertion allowed, but cue marked as non-executable until validation resolved
   - **READY**: Insertion allowed and cue immediately executable
4. **Initial State**: Inserted cues start with `validation.status = "unvalidated"` before validation runs
5. **No Silent Failures**: Trainer must see clear feedback on validation outcome

### Prohibitions During Creation

- No browsing/searching YouTube inside the system
- No recommendations
- No autoplay
- No audience access
- No silent rewriting of URLs or metadata

---

## Media Cue Validation

### Validation Trigger

Validation occurs:
- Immediately after Media Cue creation (pre-live on Stage)
- Immediately upon live insertion (live on TrainerView)
- On demand (trainer-initiated revalidation)
- Before session reaches "Staged" readiness (pre-live only)

### Validation Criteria

#### YouTube

**Checks:**
- URL parses and matches allowed host patterns (`youtube.com` / `youtu.be`)
- Video ID extractable
- Basic reachability check:
  - If server can fetch metadata/HEAD: do it
  - If not feasible: mark WARNING with "unverified reachability"
- Embeddability signal (best-effort):
  - If metadata indicates restricted/unavailable: BLOCKED
  - If unknown: WARNING

**Validation Outputs:**
- **READY**: valid URL + reachable + not known restricted
- **WARNING**: valid URL but reachability/embeddability unconfirmed
- **BLOCKED**: invalid URL OR known unavailable/restricted

#### PowerPoint

**Checks:**
- File path provided
- File extension is `.pptx` or `.ppt`
- File existence (if path is server-accessible)

**Validation Outputs:**
- **READY**: valid file extension + file exists (if path accessible)
- **WARNING**: valid format but file existence cannot be verified (common for browser-selected files)
- **BLOCKED**: invalid file extension OR file path missing

#### Google Slides

**Checks:**
- URL parses and matches Google Slides pattern (`docs.google.com/presentation/d/{id}`)
- Presentation ID extractable
- Basic reachability check (HEAD request to preview URL)

**Validation Outputs:**
- **READY**: valid URL format + presentation reachable
- **WARNING**: valid URL format but reachability unconfirmed
- **BLOCKED**: invalid URL format OR presentation not found

### Binding Validation

If Media Cue has binding (`sceneId` or `inputName`):

- Executor must verify binding exists
- If binding missing: BLOCKED
- If binding unverified: WARNING (only if binding is optional)

### Validation Status Impact

- **READY**: Cue can be executed
- **WARNING**: Cue may work, but proceed with caution
- **BLOCKED**: Cue cannot be executed (prevents STAGED if required, prevents live insertion)

### Live Validation During Insertion

When a media cue is inserted during a live session:

1. **Validation runs immediately** upon insertion attempt
2. **BLOCKED status** → Insertion is denied, trainer sees error message
3. **WARNING status** → Insertion allowed, but execution disabled until validation resolved
4. **READY status** → Insertion allowed and cue immediately executable
5. **No silent failures**: Trainer must receive clear feedback on validation outcome

---

## Media Cue Execution

### Execution Flow

Execution is a two-step handshake:

#### 1. Trigger (TrainerView)

TrainerView emits an execution request referencing only the cue ID:

```javascript
media:cue:play { cueId }
media:cue:stop { cueId }
```

**TrainerView must not send:**
- Raw URLs
- OBS scene configs
- Audio routing instructions beyond what's already in the cue

**TrainerView is a launcher, not a configurator.**

#### 2. Execute (OBS Pipeline)

OBS pipeline receives the cue ID, loads the cue from the session's staged snapshot, and performs deterministic actions:

**For play:**
1. Ensure OBS connected
2. Switch to bound scene (if defined)
3. Set/confirm source URL for the input (if supported by the chosen OBS source type)
4. Apply audio mode (mute/unmute routing) exactly as specified
5. Start playback (or bring the source live if playback is embedded)

**For stop:**
1. Stop playback OR cut away to a neutral/previous scene as defined by executor policy
2. Confirm final state

**OBS then returns ACKs:**

```javascript
media:cue:ack { cueId, state }
media:cue:error { cueId, reason, recoverable }
```

Where `state` may be:
- `started`
- `stopped`
- `failed`
- `unavailable`

### Execution Guarantees

- Execution is deterministic (same cue = same behavior)
- Execution is idempotent (repeated triggers are safe)
- Execution failures are acknowledged (never silent)
- Execution does not modify the Media Cue object

---

## Ownership Boundaries

### Stage Owns

- Create/edit/delete/reorder Media Cues (pre-live only)
- Validation
- Binding configuration

### TrainerView Owns

- Play/Stop triggers (live)
- Insert new media cues ahead of `currentPosition` (live, with immediate validation)
- Displaying current cue status (based on ACKs)

### OBS Pipeline Owns

- Deterministic execution
- Status reporting
- Scene/input management

### Audience Owns

- Nothing (they just experience what becomes live)

---

## Relationship to Other Contracts

### Stage Page Contract

- Stage creates and validates Media Cues pre-live
- Stage snapshots Media Cues at Live transition
- Stage cannot modify Media Cues once live

### OBS Pipeline Contract

- OBS Pipeline executes Media Cues deterministically
- OBS Pipeline reports execution status via ACKs
- OBS Pipeline does not accept configuration from TrainerView

### Session Contract

- Media Cues are snapshotted into session state at Live transition
- Session state contains Media Cues but does not execute them

### Unified Cue Stack Contract

- Media cues now exist within a unified cue stack alongside focus cues
- Media cue execution remains unchanged (routes to Executor Pipeline)
- Media cue validation remains unchanged (routes to validation system)
- Media cues are immutable once validated (preserves validation guarantee)
- Live insertion of media cues is allowed ahead of `currentPosition`

---

## Editing and Deletion

### Editing Rules

**Pre-live:**
- All media cues editable on Stage

**Live:**
- Media cues may only be edited if `validation.status === "unvalidated"` (newly inserted, not yet validated)
- Once validated (`status === "ready" | "warning" | "blocked"`), media cues become immutable
- Executed media cues are always immutable

**Editable fields** (when editing is allowed):
- `label`
- `source.type`
- `source.url` (for youtube/googleslides)
- `source.filePath` (for powerpoint)
- `playback.audioMode` (only applies to youtube)
- `playback.startAtSec` (only applies to youtube)
- `playback.endAtSec` (only applies to youtube)
- `binding.sceneId`
- `binding.inputName`

**Non-editable fields:**
- `id` (never changes)
- `createdAt` (never changes)

**After editing:**
- Validation must be re-run
- `validation.status` updated

### Deletion Rules

Media Cues may only be deleted pre-live on Stage.

**Deletion impact:**
- Removed from staging state
- Does not affect live session if already snapshotted
- Cannot delete if referenced in session entry state

---

## Reordering

Media Cues may be reordered pre-live on Stage.

**Reordering rules:**
- Order is intentional (conveys authorial intent)
- Order must not change once the session is live
- Order is preserved in snapshot

---

## Error Handling

### Execution Errors

When execution fails:

1. **OBS Pipeline returns error ACK:**
   ```javascript
   media:cue:error {
     cueId,
     reason: string,
     recoverable: boolean
   }
   ```

2. **TrainerView displays error:**
   - Shows reason clearly
   - Indicates if recoverable
   - Offers next action (retry, skip, etc.)

3. **No silent failures:**
   - All execution attempts are acknowledged
   - Errors are visible to trainer

### Validation Errors

When validation fails:

1. **Status set to BLOCKED or WARNING**
2. **Reasons stored in `validation.reasons`**
3. **Stage displays validation status clearly**
4. **Trainer can proceed with WARNING, not with BLOCKED (if required)**

---

## Explicit Prohibitions

Media Cues must never:

1. **Autoplay**
   - Never play automatically
   - Always require explicit trainer trigger

2. **Modify Validated Cues During Live**
   - Never allow editing of validated media cues once session is live
   - Never allow editing of executed media cues
   - Never allow deletion once session is live
3. **Insert Behind Current Position**
   - Never allow insertion of cues at or before `currentPosition`

4. **Bypass Validation**
   - Never execute unvalidated cues
   - Never skip validation checks
   - Never allow insertion without immediate validation

5. **Accept Live Configuration**
   - Never accept URLs from TrainerView
   - Never accept binding config from TrainerView
   - Never accept playback settings from TrainerView

6. **Expose to Audience**
   - Never show Media Cue list to audience
   - Never allow audience to trigger execution

---

## Implementation Pointers (Code)

**Socket events (implementation surface):**
- **Stage actions**: `media:cue:create`, `media:cue:edit`, `media:cue:delete`, `media:cue:reorder`, `media:cue:validate`
- **TrainerView actions**: `media:cue:insert` (live insertion), `media:cue:play`, `media:cue:stop`
- **Executor ACKs**: `media:cue:ack`, `media:cue:error`
- **State sync**: `media:cue:state` (trainer-only)

**Server:**
- Media Cue staging state: `server/staging/<stagingId>/mediaCues/`
- Media Cue validation: `server/staging/mediaCueValidator.js` (TBD)
- Router wiring: `server/routers/eventRouter.js`

**Client:**
- Stage authoring UI: `src/pages/Stage.jsx` (TBD)
- TrainerView trigger UI: `src/components/media/MediaCuePanel.jsx` (TBD)
- Media Cue state hook: `src/hooks/useMediaCueState.js` (TBD)

**Executor (OBS Pipeline):**
- Execution handler: `server/pipelines/obs/obsPipeline.js` (TBD)
- ACK emission: `media:cue:ack`, `media:cue:error`

---

## Contract Status

This contract is binding.

Changes require explicit versioning and review, as it defines a core authoring and execution boundary in the system.

---

## Future Considerations

### v1 Scope

- YouTube, PowerPoint (.pptx/.ppt), and Google Slides
- Stage Engine executor (formerly OBS)
- Basic validation (URL format/reachability for YouTube/Google Slides, file format for PowerPoint)

### Future Expansions (Require Contract Revision)

- Additional source types (Vimeo, direct video files, etc.)
- Additional executors (VLC, custom players, etc.)
- Advanced validation (DRM checks, format verification, etc.)
- Cue sequencing (play multiple cues in order)
- Cue scheduling (play at specific times)

---

**End of Contract**
