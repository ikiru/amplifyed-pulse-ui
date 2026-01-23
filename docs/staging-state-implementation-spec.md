# Status: Implementation Spec
# Owner: TBD
# Last reviewed: 2026-01-XX

# STAGING STATE IMPLEMENTATION SPEC

## Purpose

This document defines the authoritative storage structure, snapshot rules, and server-side enforcement for staging state. It is a technical implementation specification that complements the Stage Page Contract.

---

## Storage Location

### Directory Structure

```
server/
  staging/
    <stagingId>/
      state.json          # Complete staging state
      snapshot_<id>.json  # Immutable snapshots (created at Live transition)
```

### Staging ID Generation

- Staging ID is generated when Stage page is first opened
- Format: `stg_<timestamp>_<random>` or equivalent
- One staging state per session (1:1 relationship)

### Session ID Relationship

- Staging state is associated with a `sessionId` (may be generated pre-live)
- Session ID is stable across Draft → Staged → Live transitions
- Staging state persists even after Live transition (for review/audit)

---

## Staging State Schema

### Complete State Object

```typescript
interface StagingState {
  sessionId: string;
  stagingId: string;
  state: "DRAFT" | "STAGED";
  createdAt: string;  // ISO 8601
  updatedAt: string;  // ISO 8601
  isReadOnly: boolean;  // false until Live
  
  // Focus Cues (ordered list)
  focusCues: FocusCue[];
  
  // Media Cues (unordered, validated)
  mediaCues: MediaCue[];
  
  // Session Entry State
  entryState: EntryState;
  
  // Requirement Toggles
  requirements: Requirements;
  
  // Validation Results
  validation: ValidationResults;
}

interface FocusCue {
  id: string;  // stable identity
  text: string;
  order: number;  // 0-based index for ordering
  createdAt: string;
  isSystemDefault?: boolean;  // true for "Open Conversation" default
}

interface MediaCue {
  id: string;  // stable identity
  label: string;
  source: {
    type: "youtube";  // v1 scope
    url: string;
  };
  playback: {
    audioMode: "videoOnly" | "videoAndAudio";
    startAtSec?: number;
    endAtSec?: number;
  };
  binding?: {
    executor: "obs";
    sceneId?: string;
    inputName?: string;
  };
  validation: {
    status: "unvalidated" | "ready" | "warning" | "blocked";
    reasons?: string[];
    lastChecked?: string;
  };
  createdAt: string;
}

interface EntryState {
  defaultFocusCueId: string;  // required, must resolve
  focusVisibleOnJoin: boolean;  // default: true
  chatOpenOnJoin: boolean;  // default: true
  anonymityDefault: string;  // enum, default: "on"
  welcomeMessage?: string;  // optional
}

interface Requirements {
  obsRequired: boolean;  // default: false
  slideControlRequired: boolean;  // default: false
}

interface ValidationResults {
  obs: SubsystemValidation;
  slideControl: SubsystemValidation;
  media: { [cueId: string]: SubsystemValidation };
}

interface SubsystemValidation {
  status: "unvalidated" | "ready" | "warning" | "blocked";
  reasons?: string[];
  lastChecked?: string;
}
```

---

## Snapshot Rules

### Snapshot Creation

A snapshot is created atomically when `session:live:begin` is received:

1. **Lock staging state** (prevent concurrent writes)
2. **Deep clone** staging state → snapshot object
3. **Assign snapshot ID**: `snapshot_<timestamp>_<random>`
4. **Set `snapshot.createdAt`**: ISO 8601 timestamp
5. **Set `snapshot.isSnapshot = true`**
6. **Write snapshot** to `snapshot_<id>.json`
7. **Set `stagingState.isReadOnly = true`**
8. **Update `session.state = "LIVE"`**
9. **Emit `session:state:update`** to all connected clients
10. **Unlock staging state**

### Snapshot Immutability

- Snapshots are **never modified** after creation
- Snapshot files are append-only (new snapshots, never edits)
- Snapshot ID is stable and referenced by session state

### Snapshot Structure

```typescript
interface Snapshot {
  snapshotId: string;
  sessionId: string;
  createdAt: string;
  isSnapshot: true;
  
  // Deep copy of staging state at moment of Live transition
  focusCues: FocusCue[];
  mediaCues: MediaCue[];
  entryState: EntryState;
  requirements: Requirements;
  validation: ValidationResults;
}
```

### Snapshot Access

- **TrainerView**: Reads from snapshot (not staging state) once Live
- **Session Pipeline**: Receives snapshot at Live transition
- **Stage**: Can view snapshot but cannot modify it

---

## Server-Side Enforcement

### Write Protection

All `stage:*` write events must check session state **before** any mutation:

```javascript
function handleStageWrite(event, sessionId) {
  const session = getSession(sessionId);
  
  // CRITICAL: Check session state first
  if (session.state === 'LIVE') {
    return {
      event: 'stage:write:rejected',
      sessionId,
      reason: 'SESSION_IS_LIVE',
      message: 'Staging state is read-only after session goes live'
    };
  }
  
  // Proceed with write operation
  // ...
}
```

### Protected Operations

The following operations must be rejected when `session.state === 'LIVE'`:

- `stage:focus:create`
- `stage:focus:edit`
- `stage:focus:reorder`
- `stage:focus:delete`
- `stage:focus:set_default`
- `stage:media:create`
- `stage:media:edit`
- `stage:media:delete`
- `stage:media:reorder`
- `stage:entry:update`
- `stage:requirements:update`

### Read Operations

Read operations are **always allowed** (even when Live):

- `session:state:get`
- `stage:focus:get` (if implemented)
- `stage:media:get` (if implemented)

---

## State Transitions

### Draft → Staged

Triggered when:
- All required validation checks pass
- Entry state is valid
- At least one Focus Cue exists

State update:
```javascript
stagingState.state = 'STAGED';
stagingState.updatedAt = new Date().toISOString();
```

### Staged → Live (Snapshot)

Triggered by:
- `session:live:begin` event from TrainerView

Process:
1. Validate gating rules (re-check)
2. Create snapshot (atomic)
3. Set `session.state = 'LIVE'`
4. Set `stagingState.isReadOnly = true`
5. Emit state update to all clients

---

## Default Focus Cue

### System-Generated Default

If no Focus Cues exist when Stage first loads:

1. Create system Focus Cue:
   ```javascript
   {
     id: `focus_system_${Date.now()}`,
     text: "Open Conversation",
     order: 0,
     createdAt: new Date().toISOString(),
     isSystemDefault: true
   }
   ```
2. Set `entryState.defaultFocusCueId` to this cue's ID
3. Add to `stagingState.focusCues`

### Trainer-Created Cues

- Trainer can delete system default if they create their own
- System default is not special once trainer creates cues
- `defaultFocusCueId` must always resolve to an existing cue

---

## Validation State Management

### Validation Triggers

Validation runs:
- On Media Cue create/edit (immediate)
- On `stage:validate:request` (manual trigger)
- On OBS/slide control status change (polling or event-driven)

### Validation Storage

Validation results are stored in `stagingState.validation`:

```javascript
validation: {
  obs: {
    status: "ready",
    reasons: [],
    lastChecked: "2026-01-15T10:30:00Z"
  },
  slideControl: {
    status: "blocked",
    reasons: ["Permissions denied"],
    lastChecked: "2026-01-15T10:30:00Z"
  },
  media: {
    "media_cue_123": {
      status: "warning",
      reasons: ["Reachability unverified"],
      lastChecked: "2026-01-15T10:30:00Z"
    }
  }
}
```

### Readiness Calculation

`STAGED` state is calculated as:

```javascript
function calculateReadiness(stagingState) {
  // Required checks
  if (!stagingState.entryState.defaultFocusCueId) return "DRAFT";
  if (stagingState.focusCues.length === 0) return "DRAFT";
  
  // Required subsystem checks
  if (stagingState.requirements.obsRequired) {
    if (stagingState.validation.obs.status !== "ready") return "DRAFT";
  }
  
  if (stagingState.requirements.slideControlRequired) {
    if (stagingState.validation.slideControl.status !== "ready") return "DRAFT";
  }
  
  return "STAGED";
}
```

---

## File Operations

### Reading Staging State

```javascript
function getStagingState(stagingId) {
  const filePath = `server/staging/${stagingId}/state.json`;
  const data = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(data);
}
```

### Writing Staging State

```javascript
function saveStagingState(stagingState) {
  // Check read-only
  if (stagingState.isReadOnly) {
    throw new Error('Staging state is read-only');
  }
  
  stagingState.updatedAt = new Date().toISOString();
  const filePath = `server/staging/${stagingState.stagingId}/state.json`;
  fs.writeFileSync(filePath, JSON.stringify(stagingState, null, 2));
}
```

### Creating Snapshot

```javascript
function createSnapshot(stagingState) {
  const snapshot = {
    snapshotId: `snapshot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    sessionId: stagingState.sessionId,
    createdAt: new Date().toISOString(),
    isSnapshot: true,
    // Deep clone all staging data
    focusCues: JSON.parse(JSON.stringify(stagingState.focusCues)),
    mediaCues: JSON.parse(JSON.stringify(stagingState.mediaCues)),
    entryState: JSON.parse(JSON.stringify(stagingState.entryState)),
    requirements: JSON.parse(JSON.stringify(stagingState.requirements)),
    validation: JSON.parse(JSON.stringify(stagingState.validation))
  };
  
  const filePath = `server/staging/${stagingState.stagingId}/snapshot_${snapshot.snapshotId}.json`;
  fs.writeFileSync(filePath, JSON.stringify(snapshot, null, 2));
  
  return snapshot;
}
```

---

## Concurrency

### Locking Strategy

Use file-based or in-memory locks to prevent concurrent writes:

```javascript
const locks = new Map();

function acquireLock(stagingId) {
  if (locks.has(stagingId)) {
    throw new Error('Staging state is locked');
  }
  locks.set(stagingId, Date.now());
}

function releaseLock(stagingId) {
  locks.delete(stagingId);
}
```

### Atomic Operations

Critical operations (snapshot creation, state transitions) must be atomic:

1. Acquire lock
2. Read current state
3. Validate
4. Write new state
5. Release lock

---

## Error Handling

### Validation Errors

If validation fails:
- Store error in `validation[subsystem].reasons`
- Set `status = "blocked"` or `"warning"`
- Do not prevent staging state save
- Emit `stage:validate:result` with error details

### Write Rejection

If write is rejected (session is Live):
- Return `stage:write:rejected` immediately
- Do not modify staging state
- Log rejection for audit

### Snapshot Failure

If snapshot creation fails:
- Return `session:live:error`
- Do not set `session.state = "LIVE"`
- Keep staging state writable
- Log error for investigation

---

## Migration & Backwards Compatibility

### Versioning

Staging state should include a version field:

```typescript
interface StagingState {
  version: string;  // e.g., "1.0.0"
  // ... rest of state
}
```

### Migration Path

If schema changes:
1. Detect version mismatch
2. Run migration function
3. Update version field
4. Save migrated state

---

## Testing Considerations

### Unit Tests

- Snapshot creation (atomicity)
- Write protection (Live state)
- Readiness calculation
- Default Focus Cue creation

### Integration Tests

- Concurrent write handling
- State transition sequences
- Snapshot → Session Pipeline handoff

### Edge Cases

- Empty staging state (no Focus Cues)
- All validation blocked
- Snapshot creation during concurrent write
- Staging state corruption recovery

---

**End of Implementation Spec**
