# Status: Draft
# Owner: TBD
# Last reviewed: 2026-01-18

# LIVEVIEW CONTRACT (UNLOCKED FOR REDESIGN)

**Projection Display for Live Sessions**

> **UNLOCKED**: This contract is intentionally in **Draft** while we redesign LiveView’s look + functionality.
> It should be treated as a working spec until it returns to **Canonical**.
>
> **Still binding (Phase 8 invariants):**
> - Silence is always valid; absence is never legible
> - No individual identification, ranking, or “scoreboard” dynamics
> - Pulse must not visually react to audience behavior or non-behavior
> - Safety overrides visibility (containment over amplification)

---

## TL;DR (Guarantees)

- **Read-only** projection surface (no required interaction).
- **Shows ONLY** (5 elements):
  - **Session Info** (QR + alphanumeric join code)
  - **Pulse** timeline (collective room pulse)
  - **Focus** statement (room-anchoring text)
  - **OBS Slide/Deck Feed** (PowerPoint/Slides surface; pixels-only)
  - **Optional future**: presenter video tile (reserved; not v1)
- **Stays non-surveillant**: emphasizes collective state (“we”), not individual tracking.
- **Does NOT show**: messages/threads, confusion, drift, insights, participant identity, rankings, or controls.
- **Layout**: vertical columns — left **25%** (Session + Pulse), right **75%** (Focus + Slides).
- **Session access** is displayed from the route param (`/live/:sessionCode`) and rendered as a QR join URL.

## Decision Log (Redesign)

- 2026-01-18: LiveView contract unlocked for redesign (layout + functionality).
- TBD: (add decisions here as we lock them)

## 1. Purpose

LiveView is a **read-only projection display** that shows live session activity to all participants in a physical training room.

LiveView serves as the **"medical monitor for the room"** — displaying collective vital signs that:
- Keep the room oriented to shared focus
- Keep access visible (QR + code)
- Make collective pulse legible without pressure
- Provide a stable slide/deck surface for the room (pixels-only)

LiveView is **inviting and energizing**, not surveillance.

---

## Implementation Pointers (Code)

**Client:**
- Route definition: `src/App.jsx` (`/live/:sessionCode`)
- LiveView page: `src/pages/LiveView.jsx`
- Pulse: `src/components/pulse/PulseTimeline.jsx`
- Join QR: `src/components/session/QRCodeDisplay.jsx`
- OBS status subscription: `src/hooks/useObsCaptureState.js`

**Trainer (source for local OBS deck feed):**
- OBS capture client (browser-only): `src/obs/obsCaptureClient.js`
- Trainer UI controls: `src/pages/TrainerView.jsx` (Start/Stop capture)

**Notes:**
- LiveView does not render messages/threads/confusion/drift/insights.
- v1 OBS deck feed is **not server-streamed**; LiveView can render the deck only via **local stream handoff** from TrainerView (Option B).

## 2. Core Principles

### 2.1 Display Philosophy

LiveView must be:
- **Ambient** (present, not demanding)
- **Inviting** (warm, not clinical)
- **Collective** (shows "we," not "you")
- **Energizing** (creates aliveness, not pressure)
- **Read-only** (no interaction required)

### 2.2 Medical Monitor Metaphor

Like a medical monitor, LiveView:
- Shows vital signs clearly
- Creates confidence, not anxiety
- Invites observation without demanding action
- Shows patterns, not just numbers
- Is present but not dominating

---

## 3. Layout & Structure

### 3.1 Overall Layout (16:9 Projection Optimized)

**Vertical two-column layout (side-by-side):**
- **Left column (25%)**: Pulse (top) + Session Info (bottom)
- **Right column (75%)**: Focus statement (top) + OBS slide/deck feed (bottom)

```
┌───────────────┬───────────────────────────────────────────────────────────┐
│ LEFT (25%)    │ RIGHT (75%)                                               │
│               │                                                           │
│ Pulse         │ Focus (fixed height)                                      │
│               │                                                           │
│ Session Info  │ Slides / Deck Feed (dominant; pixels-only)                │
│ QR + code     │                                                           │
│               │ Optional future: presenter video (PiP; out of scope v1)    │
└───────────────┴───────────────────────────────────────────────────────────┘
```

### 3.2 Zone Specifications

**Left Column (25% width):**
- **Pulse (top):**
  - PulseTimeline (collective room pulse)
  - No controls; stable posture
- **Session Info (bottom):**
  - QR code + join code always visible
  - Language posture: access enables presence, not performance

**Right Column (75% width):**
- **Focus panel (top):**
  - Fixed height: **16% of viewport height** (locked)
  - Large, room-anchoring text (1–3 lines)
  - Fade transition (400ms) on change
- **Slides / Deck Feed (bottom):**
  - Dominant surface for the room
  - **Pixels-only** deck surface (PowerPoint/Slides/etc.)
  - **Scaling: contain (no cropping)** (locked). Letterboxing is acceptable.
  - If unavailable: calm placeholder + neutral OBS status line

**Optional Future (not v1):**
- Presenter video tile (PiP) — reserved only

---

## 4. Content Rules

### 4.1 Focus Display

**When Focus IS Set:**
- Display full focus text
- Large, prominent, high contrast
- Smooth transition animation on change

**When Focus NOT Set:**
- Display: "Open Conversation"
- Reduced visual prominence (40-48px text)

**Update Behavior:**
- Instant update when trainer sets/clears focus
- Fade transition (400ms)

### 4.2 Pulse Display

**Content:**
- Timeline graph showing engaged/neutral/frustrated over time
- **Identical to TrainerView PulseTimeline component**
- Time window: Last 60 seconds (scrolling cardiac monitor style)
- Y-axis: ±participantCount (e.g., +12 to -12 for 12 participants)
- Participant count visible

**Update Behavior:**
- Real-time streaming (same as TrainerView)
- Smooth animations for vote changes
- Graph scrolls left as time progresses

**Visualization:**
- Use same PulseTimeline component as TrainerView
- Projection-optimized colors (high contrast)
- Blue line (#0066ff) showing net sentiment
- Current position marked with filled circle (●)
- No interactive elements (read-only)

### 4.3 Session Access Display

**Required content:**
- QR code display for easy participant join
- Session code displayed prominently
- Join instructions visible
- Required for participants to access the session

### 4.4 OBS Slide/Deck Feed (Pixels-Only)

**What it is:**
- A pixels-only surface intended for slides/deck content (PowerPoint/Slides/etc.)
- The system must not infer slide numbers, boundaries, or meaning

**Slide Scaling (Locked):**
- Slides must use **contain** (no cropping). Letterboxing is acceptable.

### 4.5 OBS Deck Feed v1 (Option B — Local Handoff)

**Constraint:** The OBS capture `MediaStream` is not server-streamed in v1.

**Allowed behavior (v1):**
- When LiveView is opened from TrainerView on the **same machine/browser context**, LiveView may attach to the trainer-owned OBS `MediaStream` via a local handoff mechanism.
- If no local stream is available, LiveView must display:
  - a calm placeholder (“Slides will appear here”), and
  - the neutral OBS capture status (idle / requesting_permission / capturing / interrupted / error_*).

**Hard rules:**
- Slides are **pixels-only**. No slide numbers, inference, highlighting, or semantic overlays.
- No audio in v1.

### 4.6 What Must NOT Appear (Hard Exclusions)

LiveView explicitly excludes:
- ❌ Messages, threads, replies, thread lenses
- ❌ Confusion indicators or thread confusion breakdowns
- ❌ Drift meter, insights panel, trainer analytics
- ❌ Participant names/IDs, join/leave events, attendance language
- ❌ Vote/send controls, any input controls
- ❌ Any interaction UI (buttons, toggles, settings)

**Required display:**
- ✅ Focus statement (or “Open Conversation”)
- ✅ QR code and session access code (required for participants to join)
- ✅ Pulse timeline
- ✅ Slides/deck area (or placeholder + neutral status)

---

## 5. Launch & Lifecycle

### 5.1 Launch Mechanism

**Access Pattern:**
- URL: `/live/:sessionCode`
- Trainer opens from TrainerView via "Open LiveView" button
- Opens in new browser window/tab
- Trainer drags window to projector screen
- LiveView auto-connects to specified session

**No Manual Entry:**
- LiveView does NOT show session code entry screen
- Session code is always passed from TrainerView
- If someone navigates to `/live` without code → show error: "Please launch LiveView from TrainerView"

### 5.2 Session Binding

**Connection:**
- LiveView connects via same Socket.io infrastructure
- Joins session as a read-only display client
- Subscribes to: `pulse:update`, `focus:update`, `focus:cleared`, `session:metadata`, `obs:status_changed`
- Does NOT emit room-shaping events (display-only)

**Session Discovery:**
- Session code provided via URL parameter
- LiveView validates session exists
- Auto-reconnect if connection drops

### 5.3 Lifecycle States

**Before Session:**
- Show: "Waiting for session to begin"
- Display session code for reference
- Neutral, calm state

**During Session:**
- Active display of session info, pulse, focus, and slides (OBS deck feed)
- Real-time updates
- Auto-reconnect on disconnect

**After Session Ends:**
- Show: "Session Complete"
- Display final state (frozen snapshot)
- Remain open until manually closed
- No auto-close (trainer controls when to turn off projector)

### 5.4 Connection Loss Handling

**If Connection Drops:**
- Keep displaying last known state (freeze in place)
- Show small "Reconnecting..." indicator (subtle, non-alarming)
- Auto-reconnect every 5 seconds
- Do NOT clear display

**If Reconnect Succeeds:**
- Resume real-time updates
- Remove "Reconnecting" indicator
- Resubscribe and sync state (fetch current session state)

---

## 6. Visual & UX Specifications

### 6.1 Typography

**Font Family:**
- System default sans-serif (consistent with TrainerView)
- Or custom: Inter, Helvetica Neue, Arial

**Text Sizes:**
- Focus text: **72-96px**
- Pulse labels: **20-24px**
- Session code: **24-32px** (monospace recommended)
- Session help text: **14-18px**
- Slide placeholder/status text: **20-28px**

**Font Weights:**
- Focus: 600-700 (bold)
- Body text: 400 (regular)
- Labels: 500-600 (medium)

### 6.2 Color Palette (Projection-Optimized)

**Background:**
- Primary: Warm cream/beige (#f5f3f0 or similar)
- NOT pure white (reduces projector bloom)

**Text:**
- Primary: Near-black (#1a1a1a)
- Secondary: Dark gray (#4a4a4a)
- High contrast required (WCAG AAA)

**Pulse Colors:**
- Engaged: #0b5fff (blue)
- Neutral: #666666 (gray)
- Frustrated: #ff4444 (red)
- Same as TrainerView palette

**Focus Bar:**
- Background: Warm accent (#fff4e6 or similar)
- Border: Subtle, 1-2px
- Text: Near-black

### 6.3 Spacing & Layout

**Padding:**
- Left column: 24-32px
- Right column: 24-32px
- Focus panel: 24-32px

**Borders:**
- Column divider: 2px vertical border (subtle gray)
- Panel borders: optional 1-2px (subtle)

**Fixed Focus Height (Locked):**
- Focus panel is fixed at **16% of viewport height** (right column, top).
- Slides occupy the remaining right-column height (right column, bottom).

**Slide Scaling (Locked):**
- Slides must use **contain** (no cropping). Letterboxing is acceptable.

### 6.4 Animations

**Focus Changes:**
- Fade transition: 400ms ease-in-out
- No abrupt flashing

**Slides / OBS Feed:**
- No flashy transitions.
- Optional: gentle fade (200-400ms) when the local stream attaches/detaches.

**Pulse Updates:**
- Smooth graph scrolling (continuous, not stepped)
- Vote count changes: 200ms ease

**General:**
- All animations gentle, not distracting
- No flashing or strobing effects
- Projection-safe (no rapid changes)

---

## 7. Technical Specifications

### 7.1 Routing

**Path:** `/live/:sessionCode`
- With session code: auto-connect to that session
- Without session code: show error message

**Examples:**
- `/live/ABCD-1234` → connects to session ABCD-1234
- `/live` → shows error: "Please launch LiveView from TrainerView"

### 7.2 Socket Connection

**Connection:**
- Uses same Socket.io client as TrainerView
- Connects to main server endpoint
- Emits: `session:join` using the session code from the URL route param (join is required to receive session-scoped broadcasts)

**Subscriptions:**
- `pulse:update` → updates pulse timeline
- `focus:update` / `focus:cleared` → updates focus panel
- `session:metadata` → session info (code + participant count)
- `obs:status_changed` → OBS capture status for slide/deck feed

**Does NOT Subscribe:**
- `message.state.update`, `message.vote.update` (messages are not shown)
- `confusion:update` (not shown)
- `audience:drift:update` (trainer-only)
- `insights:*` (trainer-only)

### 7.3 State Management

**Local State:**
- Current focus text (string or null)
- Pulse data (votes, timeline, participants)
- Session metadata (access code, participant count)
- OBS capture status (status, reason, metrics)
- Whether a local OBS MediaStream is attached (boolean)
- Connection status

**No Persistence:**
- LiveView does not persist state
- On refresh, re-fetches current session state
- No local storage

### 7.4 Performance

**Optimization:**
- Pulse timeline windowed (last 60 seconds)
- Smooth animations via CSS transforms
- Minimal re-renders

**Projection Considerations:**
- 60fps target for smooth display
- No flicker or jank
- Efficient canvas rendering for pulse timeline

---

## 8. Governance & Psychological Safety

### 8.1 Core Safety Rules

LiveView must **NEVER**:
- ❌ Create pressure to participate
- ❌ Identify individual participants by name
- ❌ Show rankings or leaderboards
- ❌ Display warnings or alerts
- ❌ Interrupt or demand attention
- ❌ Make silence feel like failure
- ❌ Create performance anxiety

### 8.2 Anonymity Preservation

**Pulse:**
- Aggregate display only
- Vote counts shown, not individual votes
- Timeline shows collective mood, not who voted what

### 8.3 Participation Stance

LiveView reinforces:
- Silence is valid and welcome
- Participation is optional
- No "scoreboard" mentality
- Collective awareness, not individual judgment

### 8.4 Visual Tone

LiveView must feel:
- ✅ Inviting (not demanding)
- ✅ Energizing (not stressful)
- ✅ Collective (not isolating)
- ✅ Ambient (not intrusive)

---

## 9. Edge Cases & Error States

### 9.1 Empty States

**No Focus Set:**
- Display: "Open Conversation"
- Reduced visual weight
- Neutral tone

**No Slides Yet / No Local Feed:**
- Display: "Slides will appear here"
- Show neutral OBS status line
- Not an error condition

**No Pulse Data:**
- Display: "Waiting for pulse signals"
- Or show neutral baseline
- Not alarming

### 9.2 Connection Issues

**Invalid Session Code:**
- Display: "Session not found. Please check the code."
- Suggest: "Launch LiveView from TrainerView"
- No automatic retry

**Connection Lost:**
- Freeze current display
- Small "Reconnecting..." indicator
- Auto-retry every 5 seconds

**Session Ended:**
- Display: "Session Complete"
- Show final state (frozen)
- Remain open until manual close

### 9.3 Data Issues

**Slides Feed Unavailable:**
- If OBS is idle/not supported/permission denied/interrupted:
  - Keep showing placeholder + neutral status
  - Do not show alarming warnings

**Pulse Spike:**
- All participants vote at once
- Timeline handles gracefully (no overflow)
- Smooth scaling

**Focus Text Too Long:**
- Maximum: **200 characters** before truncation
- Display: Up to 3 lines
- Line wrapping: Word boundaries
- If exceeds 3 lines: Truncate with "..." ellipsis
- Font scales down if needed (minimum 48px)

---

## 10. Relationship to Other Views

### 10.1 vs. TrainerView

**TrainerView:**
- Shows: All signals + controls + insights
- Audience: Trainer only (private)
- Interaction: Full control and input

**LiveView:**
- Shows: Session Info + Pulse + Focus + Slides
- Audience: Entire room (public)
- Interaction: None (read-only)

**Shared Data:**
- Both consume same socket streams
- LiveView is a filtered subset of TrainerView

### 10.2 vs. AudienceInput

**AudienceInput:**
- Personal interaction device
- Sends: Pulse votes, messages, reactions (private device)
- Private to each participant

**LiveView:**
- Shared room display
- Receives: Collective signals
- Public to all participants

**Relationship:**
- AudienceInput provides input
- LiveView shows collective output
- Complementary, not redundant

### 10.3 Data Flow

```
Audience (AudienceInput) ──→ Server ──→ LiveView (display)
                                  ↓
                            TrainerView (control + insights)
```

---

## 11. Out of Scope (v1)

Explicitly deferred to future versions:

### 11.1 NOT Included in v1

- ❌ Custom theming/branding per session
- ❌ Multiple layout modes (trainer-selectable)
- ❌ Controls or interaction on LiveView itself
- ❌ Historical replay or timeline scrubbing
- ❌ Recording or export functionality
- ❌ Multi-session display (split screen)
- ❌ Trainer annotations visible on LiveView
- ❌ Live captions or transcription
- ❌ Real-time translation

### 11.2 Intentionally Deferred

- Customizable pulse time windows (fixed at 60 seconds)
- Presenter video tile
- Server-streamed slide video/composition backend
- Dark mode toggle (light mode only for projection)
- Accessibility features beyond high contrast
- Mobile/tablet optimization (desktop/projection only)

---

## 12. Success Criteria

### 12.1 Functional Success

LiveView is successful if:
- ✅ Readable from 30+ feet away
- ✅ Updates within 1 second of source events
- ✅ Projection-friendly (high contrast, no flicker)
- ✅ Focus text readable and stable
- ✅ Slides visible without cropping (contain)
- ✅ OBS interruptions display neutrally (placeholder + status)
- ✅ Reconnects automatically after disconnect
- ✅ Displays correctly on 16:9 projectors

### 12.2 Experiential Success

LiveView is successful if:
- ✅ Creates energy in the room (not anxiety)
- ✅ Feels inviting (not surveillance)
- ✅ Shows collective activity (not individual judgment)
- ✅ Doesn't distract from trainer
- ✅ Participants say: "It helped me feel connected"
- ✅ Trainers say: "It added energy without pressure"

### 12.3 Safety Success

LiveView is successful if:
- ✅ Silence feels valid (no pressure to participate)
- ✅ Anonymity is preserved (no individual exposure)
- ✅ No "scoreboard" feeling emerges
- ✅ Participants feel safe, not watched
- ✅ Room energy is collective, not competitive

---

## 13. Component Reuse & Technical Consistency

**Principle:** LiveView reuses TrainerView components to ensure visual and behavioral consistency.

**Shared Components:**
- `<PulseTimeline />` - Identical cardiac monitor graph
- `<QRCodeDisplay />` - Session access QR code
 - (Focus + Slides panels may be bespoke to LiveView’s layout)

**Why This Matters:**
- Ensures LiveView looks and behaves exactly like TrainerView (where applicable)
- Bug fixes/improvements automatically propagate
- No visual drift over time
- Reduces maintenance burden

**Scaling:**
- Components receive projection-optimized styling
- Scales fonts, spacing, and sizing for distance readability
- Otherwise identical rendering logic

---

## 14. Launch Mechanism (Authoritative)

**How LiveView Opens:**

1. **Trainer clicks "Open LiveView" button in TrainerView**
   - Button located in TrainerView right column (Session Info panel)
   - Label: "Open LiveView" or "Open Projection Display"
   - Icon: 📺 or projection icon

2. **TrainerView opens new window/tab:**
   ```javascript
   const sessionCode = currentSessionCode; // From TrainerView state
   const liveViewUrl = `/live/${sessionCode}`;
   window.open(liveViewUrl, '_blank', 'width=1920,height=1080');
   ```

3. **LiveView auto-connects to session:**
   - Reads session code from URL parameter
   - Joins session via socket as observer role
   - Begins displaying live data immediately

4. **Trainer moves window to projector:**
   - Drags LiveView window to external display/projector
   - Optionally fullscreen (F11)
   - Leaves TrainerView on laptop screen

**Button Placement in TrainerView:**

```
┌─────────────────────────┐
│ Session Info            │
├─────────────────────────┤
│ QR Code / Access Code   │
│                         │
│ [Open LiveView] ←────── New button
│                         │
│ Participant Count: 12   │
│ Status: Live            │
└─────────────────────────┘
```

**Button Behavior:**
- Tooltip: "Open projection display for in-room audience"
- Disabled if: Not connected or no active session
- Opens new window with LiveView
- Session code passed automatically

---

## 15. Multiple Instance Policy

**Same Session:**
- ✅ **Allowed** - Trainer can open multiple LiveView windows for same session
- Use case: Multiple projectors in same room or different rooms
- Each LiveView independently subscribes to session events
- All instances stay in sync for session info/pulse/focus/OBS status
- **Slides feed may not appear on all instances** in v1 (local handoff constraint)

**Different Sessions:**
- ✅ **Allowed** - Trainer can run multiple sessions with separate LiveViews
- Each LiveView binds to its own session code
- No interference between sessions

**Performance:**
- System supports multiple concurrent LiveView instances
- Each instance is lightweight (read-only consumer)
- No degradation expected with 2-3 LiveViews per session

---

## 16. User Interaction Policy (Zero Controls)

**LiveView is 100% read-only:**
- ❌ No buttons
- ❌ No input fields
- ❌ No controls
- ❌ No toggles or settings
- ❌ No keyboard shortcuts (except browser-native like F11)

**What This Means:**
- Trainer cannot pause/freeze LiveView
- Trainer cannot adjust text size via LiveView UI
- Trainer cannot filter content or change display
- All control happens in TrainerView only

**Rationale:**
- LiveView is a **display surface**, not a control panel
- Keeps interface simple and projection-friendly
- Avoids confusion about which view controls what
- Trainer manages everything from TrainerView

---

## 17. Browser Compatibility & Technical Requirements

**Supported Browsers:**
- ✅ Chrome/Chromium (90+)
- ✅ Edge (90+)
- ✅ Firefox (88+)
- ✅ Safari (14+)

**Why These:**
- Modern JavaScript support (ES2020+)
- Canvas/SVG rendering performance
- WebSocket support
- CSS Grid and Flexbox

**Projection Considerations:**
- Tested on 1920x1080 and 1280x720 resolutions
- 16:9 aspect ratio primary target
- 4:3 aspect ratio acceptable (may have letterboxing)
- Refresh rate: 60Hz standard

**Device Requirements:**
- Any device capable of running TrainerView
- External display/projector via HDMI/DisplayPort
- Modern GPU for smooth animations

---

## 18. Timing & Animation Specifications

**Focus Bar Changes:**
- Fade duration: **400ms** (locked)
- Easing: `ease-in-out`
- No flash or abrupt change

**Slides / OBS:**
- When local stream attaches/detaches: optional 200-400ms fade
- OBS status changes: update immediately (no alarm tone)

**Pulse Updates:**
- Real-time (no artificial delay)
- Graph scrolls continuously at native rate
- Vote count changes: **200ms** fade
- Participant count changes: **300ms** fade

---

## 19. Performance Targets (Measurable)

**Update Latency:**
- Focus update within **300ms** of trainer action
- Pulse update within **100ms** of server broadcast
- OBS status update within **300ms** of server broadcast

**Frame Rate:**
- Pulse graph: **60fps** during animation
- No dropped frames during normal operation

**Capacity:**
- Handles **100+ participants** without degradation
- Handles **1000+ pulse events** in timeline (shows last 60s)

**Memory:**
- Does not accumulate unbounded state
- Auto-prunes old pulse events (keeps last 5 minutes)

---

## 20. Testing Validation Checklist

**Before Launch, Verify:**

**Visual Tests:**
- [ ] Readable from 30 feet in lit room
- [ ] No flicker on projector
- [ ] High contrast (text clearly legible)
- [ ] Colors accurate on projection (not washed out)
- [ ] Fullscreen (F11) works correctly

**Functional Tests:**
- [ ] Focus changes appear on LiveView within 500ms
- [ ] Pulse graph updates in real-time
- [ ] Participant count accurate
- [ ] OBS status changes appear on LiveView promptly and neutrally
- [ ] Slides area shows local stream when opened from TrainerView on same machine, otherwise shows placeholder + status

**Connection Tests:**
- [ ] LiveView reconnects after network drop
- [ ] Multiple LiveViews stay in sync
- [ ] Session end shows "Session Complete"
- [ ] Invalid session code shows error

**Performance Tests:**
- [ ] OBS status churn (start/stop/interrupted) does not lag or flicker
- [ ] 20 participants voting simultaneously (no lag)
- [ ] Pulse graph maintains 60fps
- [ ] 2-hour session (no memory leak)

---

## 21. Contract Version & Authority

**Contract Version:** 1.0  
**Created:** January 2026  
**Authority:** Foundational — defines LiveView as shared room display  
**Stability:** Draft (Unlocked for redesign)  
**Dependencies:** SESSION_CONTRACT, PULSE_CONTRACT, FOCUS_BOX_CONTRACT, OBS_PIPELINE_CONTRACT

---

**End of LiveView Contract**
