# LIVEVIEW CONTRACT

**Projection Display for Live Sessions**

---

## 1. Purpose

LiveView is a **read-only projection display** that shows live session activity to all participants in a physical training room.

LiveView serves as the **"medical monitor for the room"** — displaying collective vital signs that:
- Create energy and connection
- Anchor participants to shared focus
- Show conversation as it flows
- Reflect collective room mood

LiveView is **inviting and energizing**, not surveillance.

---

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

```
┌─────────────────────────────────────────────────────────────┐
│                                                               │
│                     [FOCUS BAR]                               │
│         Current focus/question anchoring the room             │
│              72-96px text, warm background                    │
│                                                               │
├──────────────────────────┬────────────────────────────────────┤
│                          │                                    │
│   [PULSE TIMELINE]       │     [MESSAGE STREAM]               │
│                          │                                    │
│   Timeline graph         │   Recent messages (8-10)           │
│   Shows room mood        │   Threading visible                │
│   over time              │   Large readable text              │
│   (like TrainerView)     │   Auto-updating                    │
│                          │                                    │
│   30-35% width           │   65-70% width                     │
│   Full height below      │   Full height below focus          │
│   focus bar              │   bar                              │
│                          │                                    │
└──────────────────────────┴────────────────────────────────────┘
```

### 3.2 Detailed Wireframe

```
╔═══════════════════════════════════════════════════════════════╗
║                                                                 ║
║  CURRENT FOCUS                                                  ║
║  "How do we balance speed with quality in our workflows?"      ║
║                                                                 ║
╠═════════════════════════╦═══════════════════════════════════════╣
║                         ║                                       ║
║  PULSE  👥 12 participants                                      ║
║                         ║                                       ║
║  ┌──────────────────┐   ║  MESSAGES                             ║
║  │ +12 ────────────│   ║                                       ║
║  │         ╱━━━━━●  │   ║  👤 Participant                        ║
║  │    0 ━━━────────│   ║  "I think we need clearer criteria    ║
║  │  ╱              │   ║   for what 'quality' means here."     ║
║  │ -12 ────────────│   ║                                       ║
║  └──────────────────┘   ║    ↳ Trainer                          ║
║                         ║     "Great point. Let's explore..."   ║
║  ENGAGED    NEUTRAL     ║                                       ║
║     5          3        ║  👤 Participant                        ║
║                         ║  "Speed matters for client response    ║
║  FRUSTRATED             ║   times though."                      ║
║     4                   ║                                       ║
║                         ║  👤 Participant                        ║
║                         ║  "Can we look at examples?"           ║
║                         ║                                       ║
║                         ║  👤 Participant                        ║
║                         ║  "I want to flag that some people     ║
║                         ║   process slower in chat."            ║
║                         ║                                       ║
║                         ║  👤 Participant                        ║
║                         ║  "Yes, silence doesn't always mean    ║
║                         ║   disengaged."                        ║
║                         ║                                       ║
╚═════════════════════════╩═══════════════════════════════════════╝
```

### 3.3 Zone Specifications

**Focus Bar (Top, Full Width):**
- Height: ~15-20% of viewport
- Centered text, 72-96px
- Warm background color (cream/beige)
- High contrast dark text
- Label: "CURRENT FOCUS" in small caps above

**Pulse Zone (Left, 30-35% width):**
- **"PULSE" header** with participant count on right
- **Clean graph area** with Y-axis scale (±participantCount)
- **Blue sentiment line** showing net pulse over last 60 seconds
- **Vote counts below:** ENGAGED / NEUTRAL / FRUSTRATED with numbers
- Identical to TrainerView PulseTimeline + PulseSummary

**Message Zone (Right, 65-70% width):**
- Displays last 8-10 messages
- Threading/indentation preserved
- Message text: 32-40px
- Author labels: 24-28px
- Auto-scroll as new messages arrive

---

## 4. Content Rules

### 4.1 Focus Display

**When Focus IS Set:**
- Display full focus text
- Large, prominent, high contrast
- Smooth transition animation on change
- Background color highlight

**When Focus NOT Set:**
- Display: "Open Conversation"
- Reduced visual prominence (40-48px text)
- Neutral background

**Update Behavior:**
- Instant update when trainer sets/clears focus
- Fade transition (400ms)

### 4.2 Pulse Display

**Content:**
- Timeline graph showing engaged/neutral/frustrated over time
- **Identical to TrainerView PulseTimeline component**
- Time window: Last 60 seconds (scrolling cardiac monitor style)
- Y-axis: ±participantCount (e.g., +12 to -12 for 12 participants)
- Vote counts: "X engaged, Y neutral, Z frustrated"
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

### 4.3 Message Display

**Inclusion Rules:**
- ✅ Show ALL audience messages
- ✅ Show ALL trainer messages
- ✅ Show threading/replies (indented)
- ✅ Show message order (chronological)

**Exclusion Rules:**
- ❌ Do NOT show message voting/reactions
- ❌ Do NOT show confusion signals
- ❌ Do NOT show message classification labels
- ❌ Do NOT show edit/delete controls

**Display Behavior:**
- Show last 8-10 messages (fits viewport without scroll)
- New messages appear at bottom with fade-in animation (400ms)
- Oldest messages fade out and are pushed off top
- Threading preserved (replies indented)
- Author role indicated (Trainer vs. Participant icon/label)

**Text Sizing:**
- Message content: 32-40px
- Author name: 24-28px
- Timestamp: 18-20px

### 4.4 What Must NOT Appear

LiveView explicitly excludes:
- ❌ Confusion signals or indicators
- ❌ Drift meter or scores
- ❌ Insights panel
- ❌ Participant names (show role only: "Participant" or "Trainer")
- ❌ Vote/send controls (read-only display)
- ❌ Session controls
- ❌ Connection status warnings
- ❌ Individual participant identification

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
- Joins session as observer (read-only participant)
- Subscribes to: `pulse:update`, `message.state.update`, `focus:update`, `focus:cleared`
- Does NOT emit events (pure consumer)

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
- Active display of focus, pulse, messages
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
- Catch up on missed messages (show last 10)

---

## 6. Visual & UX Specifications

### 6.1 Typography

**Font Family:**
- System default sans-serif (consistent with TrainerView)
- Or custom: Inter, Helvetica Neue, Arial

**Text Sizes:**
- Focus text: **72-96px**
- Message content: **32-40px**
- Author labels: **24-28px**
- Pulse labels: **20-24px**
- Timestamps: **18-20px**
- Session info: **16-18px**

**Font Weights:**
- Focus: 600-700 (bold)
- Message content: 400 (regular)
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
- Focus bar: 32-48px vertical, 64px horizontal
- Pulse zone: 24-32px all sides
- Message zone: 24-32px all sides
- Between messages: 16-24px

**Borders:**
- Focus bar: 2px bottom border
- Column divider: 2px vertical border (subtle gray)

### 6.4 Animations

**Focus Changes:**
- Fade transition: 400ms ease-in-out
- No abrupt flashing

**New Messages:**
- Fade-in from bottom: 400ms ease
- Smooth push-up of older messages

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
- Emits: `session:join` with `{ sessionId, actorRole: 'observer' }`

**Subscriptions:**
- `pulse:update` → updates pulse timeline
- `message.state.update` → updates message stream
- `focus:update` → updates focus bar
- `focus:cleared` → clears focus bar
- `session:metadata` → session info

**Does NOT Subscribe:**
- `confusion:advisory` (trainer-only)
- `audience:drift:update` (trainer-only)
- `insights:*` (trainer-only)

### 7.3 State Management

**Local State:**
- Current focus text (string or null)
- Pulse data (votes, timeline, participants)
- Message list (last 10 messages max)
- Connection status

**No Persistence:**
- LiveView does not persist state
- On refresh, re-fetches current session state
- No local storage

### 7.4 Performance

**Optimization:**
- Message list capped at 10 (auto-prune older)
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

**Messages:**
- Show role only: "Participant" or "Trainer"
- Do NOT show participant names or IDs
- Do NOT allow individual identification

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

**No Messages Yet:**
- Display: "Conversation will appear here"
- Or empty space (no placeholder needed)
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

**Message Overflow:**
- If >10 messages, auto-prune oldest
- Smooth fade-out transition (300ms)
- No jarring cuts

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
- Shows: Focus + Pulse + Messages only
- Audience: Entire room (public)
- Interaction: None (read-only)

**Shared Data:**
- Both consume same socket streams
- LiveView is a filtered subset of TrainerView

### 10.2 vs. AudienceInput

**AudienceInput:**
- Personal interaction device
- Sends: Pulse votes, messages, reactions
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
- ❌ Audience-facing confusion signals
- ❌ Real-time translation
- ❌ QR code generation (session access handled separately)

### 11.2 Intentionally Deferred

- Customizable pulse time windows (fixed at 60 seconds)
- Message filtering by type/thread
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
- ✅ Handles 50+ messages without performance issues
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
- `<PulseSummary />` - Vote count display (ENGAGED / NEUTRAL / FRUSTRATED)
- `<MessageThreadRow />` - Message display with threading
- `<FocusDisplay />` - Focus bar display

**Why This Matters:**
- Ensures LiveView looks and behaves exactly like TrainerView
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
│ Messages: 45            │
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
- All instances stay in sync (receiving same socket updates)

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
- Trainer cannot filter messages or change display
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

**New Message Arrival:**
- Fade-in: **400ms**
- Appears at bottom of message list
- Older messages scroll up smoothly
- No batch delay (instant when received)

**Pulse Updates:**
- Real-time (no artificial delay)
- Graph scrolls continuously at native rate
- Vote count changes: **200ms** fade
- Participant count changes: **300ms** fade

**Auto-Scroll Messages:**
- When 11th message arrives, oldest fades out
- Fade-out: **300ms**
- Scroll transition: **400ms**
- No jarring jumps

---

## 19. Performance Targets (Measurable)

**Update Latency:**
- Message appears on LiveView within **500ms** of server broadcast
- Pulse update within **100ms** of server broadcast
- Focus change within **300ms** of trainer action

**Frame Rate:**
- Pulse graph: **60fps** during animation
- Message scroll: **60fps** during transitions
- No dropped frames during normal operation

**Capacity:**
- Handles **100+ participants** without degradation
- Handles **500+ messages** in session (displays last 10)
- Handles **1000+ pulse events** in timeline (shows last 60s)

**Memory:**
- Does not accumulate unbounded state
- Auto-prunes old messages (keeps last 100 in memory)
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
- [ ] Messages appear on LiveView within 500ms
- [ ] Pulse graph updates in real-time
- [ ] Vote counts update correctly
- [ ] Participant count accurate

**Connection Tests:**
- [ ] LiveView reconnects after network drop
- [ ] Multiple LiveViews stay in sync
- [ ] Session end shows "Session Complete"
- [ ] Invalid session code shows error

**Performance Tests:**
- [ ] 50 messages in rapid succession (no lag)
- [ ] 20 participants voting simultaneously (no lag)
- [ ] Pulse graph maintains 60fps
- [ ] 2-hour session (no memory leak)

---

## 21. Contract Version & Authority

**Contract Version:** 1.0  
**Created:** January 2026  
**Authority:** Foundational — defines LiveView as shared room display  
**Stability:** Locked for v1 — changes require UX and governance review  
**Dependencies:** SESSION_CONTRACT, MESSAGE_CONTRACT, PULSE_CONTRACT

---

**End of LiveView Contract**
