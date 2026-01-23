# Status: Design Spec
# Owner: TBD
# Last reviewed: 2026-01-XX

# STAGE WIREFRAME & COMPONENT MAP

## Purpose

This document provides a minimal wireframe and component structure for the Stage page to prevent UI from inventing behavior that conflicts with contracts. It defines layout, component responsibilities, and interaction patterns.

---

## Page Layout

### Overall Structure

```
┌─────────────────────────────────────────────────────────────┐
│ Stage Header                                                │
│ [Session Status: DRAFT/STAGED] [Readiness Indicator]       │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  ┌──────────────────────┐  ┌──────────────────────────┐   │
│  │ Focus Cues Section   │  │ Media Cues Section       │   │
│  │                      │  │                          │   │
│  │ [List of Focus Cues] │  │ [List of Media Cues]    │   │
│  │ [+ Add Focus]        │  │ [+ Add Media Cue]        │   │
│  │                      │  │                          │   │
│  └──────────────────────┘  └──────────────────────────┘   │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Session Entry State Configuration                    │  │
│  │ [Default Focus Dropdown] [Visibility Toggles]       │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ System Readiness                                      │  │
│  │ [OBS Status] [Slide Control Status] [Media Status]   │  │
│  │ [Requirement Toggles]                                │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│ Footer / Actions                                            │
│ [Link to TrainerView] [Status: Not Live]                    │
└─────────────────────────────────────────────────────────────┘
```

---

## Component Hierarchy

### Root Component: `StagePage`

**Location:** `src/pages/StagePage.jsx` (or equivalent)

**Responsibilities:**
- Fetch staging state on mount
- Subscribe to `session:state:update` events
- Render read-only overlay when `session.state === 'LIVE'`
- Coordinate child components

**State:**
- `stagingState` (from server)
- `sessionState` (DRAFT/STAGED/LIVE)
- `isReadOnly` (derived from sessionState)

---

### Header Component: `StageHeader`

**Location:** `src/components/stage/StageHeader.jsx`

**Displays:**
- Session status badge (DRAFT / STAGED / LIVE)
- Readiness indicator (if STAGED, show checkmark; if DRAFT, show warnings)
- Read-only banner (if LIVE)

**Props:**
```typescript
{
  sessionState: "DRAFT" | "STAGED" | "LIVE";
  readinessState: "DRAFT" | "STAGED";
  validationSummary: object;
}
```

---

### Focus Cues Section: `FocusCuesPanel`

**Location:** `src/components/stage/FocusCuesPanel.jsx`

**Displays:**
- Ordered list of Focus Cues
- Drag-and-drop reordering (pre-live only)
- Edit/delete controls per cue
- "Set as Default" button per cue
- "+ Add Focus Cue" button

**Props:**
```typescript
{
  focusCues: FocusCue[];
  defaultFocusCueId: string;
  isReadOnly: boolean;
  onCreate: (text: string) => void;
  onEdit: (cueId: string, text: string) => void;
  onDelete: (cueId: string) => void;
  onReorder: (orderedIds: string[]) => void;
  onSetDefault: (cueId: string) => void;
}
```

**Behavior:**
- When `isReadOnly === true`: disable all write controls, show read-only indicator
- Drag handles only visible when `!isReadOnly`
- Edit button opens inline editor (pre-live only)

---

### Media Cues Section: `MediaCuesPanel`

**Location:** `src/components/stage/MediaCuesPanel.jsx`

**Displays:**
- List of Media Cues with validation status badges
- Each cue shows: label, URL preview, validation status (READY/WARNING/BLOCKED)
- Edit/delete controls per cue
- "+ Add Media Cue" button (opens modal/form)

**Props:**
```typescript
{
  mediaCues: MediaCue[];
  isReadOnly: boolean;
  onCreate: (cue: MediaCueInput) => void;
  onEdit: (cueId: string, updates: Partial<MediaCue>) => void;
  onDelete: (cueId: string) => void;
  onReorder: (orderedIds: string[]) => void;
}
```

**Behavior:**
- Validation status displayed as colored badge (green/yellow/red)
- Clicking a cue shows validation details (if warning/blocked)
- Edit button opens form modal (pre-live only)

---

### Media Cue Form: `MediaCueForm`

**Location:** `src/components/stage/MediaCueForm.jsx`

**Fields:**
- Label (text input)
- Source URL (text input, YouTube validation)
- Audio Mode (radio: "Video Only" / "Video and Audio")
- Start Time (optional, seconds)
- End Time (optional, seconds)
- OBS Binding (optional):
  - Scene ID (dropdown or text)
  - Input Name (text)

**Validation:**
- URL format check (client-side)
- Server validates on submit
- Shows validation result after creation

---

### Session Entry State: `EntryStatePanel`

**Location:** `src/components/stage/EntryStatePanel.jsx`

**Displays:**
- Default Focus Cue (dropdown, populated from Focus Cues)
- Focus Visibility On Join (toggle)
- Chat Open On Join (toggle)
- Anonymity Default (dropdown/radio)
- Welcome Message (textarea, optional)

**Props:**
```typescript
{
  entryState: EntryState;
  focusCues: FocusCue[];
  isReadOnly: boolean;
  onUpdate: (updates: Partial<EntryState>) => void;
}
```

**Behavior:**
- All controls disabled when `isReadOnly === true`
- Default Focus dropdown filters out deleted cues
- Welcome Message has character limit (if defined)

---

### System Readiness: `ReadinessPanel`

**Location:** `src/components/stage/ReadinessPanel.jsx`

**Displays:**
- OBS Status (READY/WARNING/BLOCKED badge + details)
- Slide Control Status (READY/WARNING/BLOCKED badge + details)
- Media Validation Summary (count of READY/WARNING/BLOCKED cues)
- Requirement Toggles:
  - "OBS Required" (checkbox)
  - "Slide Control Required" (checkbox)
- "Validate All" button (triggers `stage:validate:request`)

**Props:**
```typescript
{
  validation: ValidationResults;
  requirements: Requirements;
  mediaCues: MediaCue[];
  isReadOnly: boolean;
  onRequirementToggle: (key: string, value: boolean) => void;
  onValidateRequest: () => void;
}
```

**Behavior:**
- Status badges are color-coded (green/yellow/red)
- Clicking a status shows detailed reasons (if warning/blocked)
- Requirement toggles affect STAGED calculation
- "Validate All" button triggers server validation

---

### Focus Cue Item: `FocusCueItem`

**Location:** `src/components/stage/FocusCueItem.jsx`

**Displays:**
- Drag handle (if not read-only)
- Focus text (editable inline if not read-only)
- Order number
- "Set as Default" button (if not already default)
- Delete button (if not read-only)

**Props:**
```typescript
{
  cue: FocusCue;
  isDefault: boolean;
  isReadOnly: boolean;
  onEdit: (text: string) => void;
  onDelete: () => void;
  onSetDefault: () => void;
}
```

---

### Media Cue Item: `MediaCueItem`

**Location:** `src/components/stage/MediaCueItem.jsx`

**Displays:**
- Validation status badge
- Label (editable if not read-only)
- URL preview (truncated)
- Audio mode indicator
- Edit button (if not read-only)
- Delete button (if not read-only)

**Props:**
```typescript
{
  cue: MediaCue;
  isReadOnly: boolean;
  onEdit: () => void;
  onDelete: () => void;
}
```

---

## Read-Only Overlay

### Component: `ReadOnlyOverlay`

**Location:** `src/components/stage/ReadOnlyOverlay.jsx`

**Displays:**
- Semi-transparent overlay covering entire Stage page
- Message: "Session is Live. Staging state is read-only."
- Link to TrainerView

**Behavior:**
- Rendered when `sessionState === 'LIVE'`
- Prevents all interactions with Stage controls
- Server-side enforcement still applies (defense in depth)

---

## Socket Integration

### Hook: `useStageState`

**Location:** `src/hooks/useStageState.js`

**Responsibilities:**
- Subscribe to `session:state:update`
- Fetch staging state on mount
- Emit `stage:*` write events
- Handle `stage:*:ack` and `stage:*:error` responses

**API:**
```javascript
const {
  stagingState,
  sessionState,
  isReadOnly,
  createFocusCue,
  editFocusCue,
  deleteFocusCue,
  reorderFocusCues,
  setDefaultFocusCue,
  createMediaCue,
  editMediaCue,
  deleteMediaCue,
  updateEntryState,
  updateRequirements,
  requestValidation
} = useStageState(sessionId);
```

---

## State Management

### Staging State Flow

1. **Mount:** Fetch `session:state:get` → receive `session:state:response`
2. **Load Staging:** If DRAFT/STAGED, fetch staging payload
3. **Subscribe:** Listen to `session:state:update`
4. **Write Operations:** Emit `stage:*` events, wait for `stage:*:ack`
5. **Live Transition:** Receive `session:state:update { state: "LIVE" }` → set read-only

### Optimistic Updates

- **Allowed:** UI can optimistically update for better UX
- **Required:** Must revert on `stage:*:error`
- **Critical:** Server is authoritative; client state is derived

---

## Error Handling

### Error Display

- **Write Rejection:** Show toast/alert: "Cannot modify staging state: Session is Live"
- **Validation Errors:** Display inline on affected components
- **Network Errors:** Show retry button, maintain local state

### Error Boundaries

- Wrap Stage page in error boundary
- Show fallback UI if staging state fetch fails
- Log errors for debugging

---

## Accessibility

### Keyboard Navigation

- Tab order: Focus Cues → Media Cues → Entry State → Readiness
- Enter/Space: Activate buttons
- Escape: Close modals/editors

### Screen Reader

- Status announcements: "Session state: DRAFT"
- Validation announcements: "OBS validation: Ready"
- Read-only announcement: "Staging state is read-only"

---

## Responsive Design

### Breakpoints

- **Desktop:** Full layout (side-by-side panels)
- **Tablet:** Stacked panels
- **Mobile:** Single column, collapsible sections

### Touch Interactions

- Drag-and-drop: Use touch-friendly drag handles
- Long-press: Context menu (if needed)
- Swipe: Delete gesture (optional)

---

## Testing Considerations

### Component Tests

- Read-only state rendering
- Write operation emissions
- Validation status display
- Error handling

### Integration Tests

- Socket event flow
- State synchronization
- Read-only enforcement
- Snapshot transition

---

## Implementation Checklist

- [ ] Create `StagePage` root component
- [ ] Implement `StageHeader` with status display
- [ ] Implement `FocusCuesPanel` with CRUD operations
- [ ] Implement `MediaCuesPanel` with validation display
- [ ] Implement `EntryStatePanel` with all fields
- [ ] Implement `ReadinessPanel` with status badges
- [ ] Create `useStageState` hook for socket integration
- [ ] Add read-only overlay component
- [ ] Implement error handling and display
- [ ] Add accessibility features
- [ ] Test responsive layouts

---

**End of Wireframe & Component Map**
