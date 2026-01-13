# SESSION CONTRACT

**AmplifyEd Pulse — Foundational Layer**

---

## 1. Purpose

The Session system provides **authoritative participant state** and manages the **lifecycle of human presence** within a live facilitated session.

Sessions are a **structural foundation**.

They do not:

* interpret participant behavior
* evaluate participation quality
* determine correctness
* assign meaning
* make facilitation decisions

Sessions track **who is present**, not what they do or mean.

---

## 2. Scope

Sessions govern:

* Participant join, leave, and reconnect events
* Authoritative participant registry
* Role attribution (audience, trainer)
* Connection state management
* Participant metadata persistence during session lifetime
* Session access codes and QR generation
* Session state synchronization on join/rejoin

Sessions do **not** govern:

* Message content or threading
* Pulse values or aggregation
* Confusion signals
* Focus state
* Emotion scoring
* Safety evaluation

---

## 3. Authority & Precedence

The Session Pipeline is **authoritative** for:

* Who is currently in the session
* When participants joined
* What role a participant has
* Participant connection status
* Session identifier and access codes
* Initial state synchronization

Other pipelines **must not**:

* maintain separate participant registries
* override session role assignments
* persist participant state independently
* decide who is "really" present
* generate alternative session identifiers

Session state is **read-only** to all other pipelines.

---

## 4. Participant Model

### 4.1 Core Schema

Every participant has:

* **socketId** — unique connection identifier
* **role** — `"audience"` or `"trainer"`
* **name** — optional display name (may be null)
* **metadata** — extensible object for non-semantic data
* **joinedAt** — timestamp of join event
* **status** — `"active"` or `"disconnected"`

### 4.2 Role Semantics

Roles identify **intent to participate**, not authority or correctness.

* **Audience** — participants who engage as learners
* **Trainer** — participants who engage as facilitators

Roles do not:

* grant message priority
* affect pulse weight
* change confusion scoring
* alter safety evaluation

Roles are **descriptive metadata only**.

---

## 5. Session Access & Entry Flow

### 5.1 Session Identifiers

Each active session has:

* **sessionId** — unique session identifier (system-level)
* **accessCode** — human-readable code for manual entry
* **QR code** — machine-readable representation of session access

---

### 5.2 Audience Entry Flow

**Step 1: Access Code Entry**

Audience members begin at the **AudienceInput page** where they:

1. See a code entry interface (or scan QR code)
2. Enter the session access code
3. Submit to join the session

**Step 2: Session Join**

On successful code validation:

1. Client emits `session:join` with sessionId
2. Session Pipeline adds participant to registry
3. Session state is synchronized to client

**Step 3: AudienceView Population**

Once joined, AudienceView receives:

* All current messages in the session
* Current focus state (if set)
* Vote totals
* Thread structure
* Confusion state
* All active session context

The audience member sees **current session state**, not historical state.

---

### 5.3 Rejoin Flow (Disconnection Recovery)

If an audience member:

* Gets disconnected
* Leaves the room
* Closes the browser
* Loses network connection

They can **rejoin** by:

1. Returning to AudienceInput page
2. Re-entering the same access code (or scanning same QR)
3. Submitting to rejoin

**On rejoin:**

* Session Pipeline recognizes reconnection
* Full session state is re-synchronized
* AudienceView repopulates with current state
* Participant resumes as if they never left

---

### 5.4 Access Methods

Participants may join a session via:

1. **QR Code Scan** — mobile-friendly, reduces entry friction
2. **Manual Code Entry** — accessibility alternative, backup method

Both methods:

* Resolve to the same `sessionId`
* Are entered on the **AudienceInput page**
* Grant access to the same session state

---

### 5.5 QR Code & Access Code Display

**TrainerView:**
* Displays QR code for audience scanning
* Displays alphanumeric access code for manual entry
* Both remain visible throughout session
* Intended for trainer reference and sharing

**LiveView (projected):**
* Future implementation
* Will display QR code for in-room audience
* Will display alphanumeric access code for in-room audience
* Optimized for room-scale visibility

**AudienceInput (Entry Page):**
* Displays code entry field or QR scan interface
* Does **not** display the session codes themselves
* This is where audience **enters** codes, not where codes are **shown**

**AudienceView (In-Session):**
* Does not display code entry
* Does not display session codes
* Shows session identifier for reference only

---

### 5.6 Access Code Properties

Access codes:

* are **ephemeral** (valid only during session lifetime)
* are **reusable within session** (same code allows rejoin)
* are **non-sequential** (randomly generated)
* do **not** encode semantic information
* do **not** reveal participant count or session state
* **expire** when session ends

Access codes are **structural identifiers only**.

---

### 5.7 QR Code Generation

QR codes:

* encode the session access URL and/or sessionId
* are generated when session begins
* remain constant throughout session
* can be scanned multiple times by different participants
* expire when session ends
* do not encode participant data

QR code content is **session join information only**.

---

### 5.8 Access Security Scope

Session access:

* provides **session routing** (which room to join)
* does **not** provide authentication
* does **not** provide authorization
* does **not** validate identity
* does **not** enforce capacity limits

Sessions are **open by default** within their access boundary.

Knowing the code = ability to join.

---

## 6. Lifecycle Events

### 6.1 Join (Initial Entry)

**Event:** `session:join`

**Trigger:** Client enters valid access code on AudienceInput page

**Behavior:**

1. Validate sessionId or accessCode
2. Create or update participant entry
3. Assign role from payload or default to `"audience"`
4. Set `joinedAt` timestamp
5. Set status to `"active"`
6. **Synchronize current session state to client:**
   - Current messages
   - Current focus
   - Current vote totals
   - Current confusion state
7. Broadcast updated participant count (if applicable)

**Does not:**

* validate participant identity
* enforce room limits
* require authentication
* assign semantic meaning
* replay full session history (only current state)

---

### 6.2 Leave

**Event:** `session:leave` or `disconnect`

**Trigger:** Client explicitly leaves or connection drops

**Behavior:**

1. Remove participant from active registry
2. Notify dependent pipelines (e.g., pulse cleanup)
3. Broadcast updated participant count (if applicable)

**Does not:**

* persist historical participation
* save session transcript
* evaluate participation quality
* trigger closure logic
* prevent rejoin

---

### 6.3 Reconnect (Rejoin)

**Event:** `session:reconnect` or repeat `session:join`

**Trigger:** Client re-enters access code after disconnection or departure

**Behavior:**

1. Treat as new join if no prior state exists
2. Add participant back to active registry
3. Set status to `"active"`
4. **Re-synchronize current session state to client:**
   - All current messages
   - Current focus
   - Current vote totals
   - Current confusion state
   - Current session context
5. Resume participant session

**Does not:**

* restore individual pulse votes
* replay message history (only current state)
* merge duplicate identities
* validate reconnection legitimacy
* remember previous join timestamp

---

## 7. Session State Synchronization

### 7.1 Synchronization Trigger Events

Session state is synchronized to clients on:

* Initial join (first entry with access code)
* Reconnect (re-entry after disconnection)
* Explicit reconnection event

---

### 7.2 Synchronized State

When a client joins or rejoins, they receive:

**From Message Pipeline:**
* All current messages and threads
* Vote totals per message
* Message classification (on-topic, off-topic)
* Resolution states

**From Focus Pipeline:**
* Current active focus (if set)

**From Confusion Pipeline:**
* Current confusion state per thread

**From Pulse Pipeline:**
* Aggregate pulse state (not individual votes)

**From Session Pipeline:**
* Session identifier
* Participant count (trainer view only)

---

### 7.3 What Is NOT Synchronized

* Historical messages that have been removed
* Individual participant pulse votes
* Previous focus states
* Resolved confusion history
* Participant join/leave history
* Session analytics or reports

**Philosophy:** Rejoin gives you **current state**, not session history.

---

## 8. Session Boundaries

### 8.1 Session Identity

Sessions are identified by:

* **sessionId** — unique session identifier (system-level)
* **accessCode** — human-readable equivalent (participant-facing)

Default: `"session:default"`

All participants in the same session:

* share the same message stream
* share the same focus state
* share the same confusion signals
* receive the same broadcasts

---

### 8.2 Cross-Session Isolation

Participants in different sessions:

* cannot see each other's messages
* cannot vote on each other's content
* do not contribute to each other's pulse or confusion
* cannot discover each other's access codes
* cannot join without the correct access code

Sessions are **fully isolated**.

---

## 9. Participant Anonymity

### 9.1 Identifier Philosophy

Participant `socketId` is:

* transient (exists only during connection)
* non-persistent (does not survive session end)
* non-portable (cannot be transferred)
* regenerated on each join/rejoin

---

### 9.2 Name Handling

Participant `name` is:

* optional
* self-reported
* non-validated
* non-unique

Names are **display metadata only**.

Session does not:

* enforce naming rules
* prevent duplicates
* verify identity
* link names across sessions
* remember names across reconnections (unless re-supplied)

---

## 10. State Access

### 10.1 Read-Only Access

Other pipelines may **read** session state via:

* `getParticipants()` — returns all active participants
* `getParticipant(socketId)` — returns single participant or null
* `getAllParticipants()` — alias for getParticipants
* `getSessionId()` — returns current sessionId
* `getAccessCode()` — returns human-readable access code

---

### 10.2 Write Protection

Only the Session Pipeline may:

* add participants
* remove participants
* update participant status
* modify role assignments
* generate or invalidate access codes

Other pipelines **must not** mutate session state directly.

---

## 11. Broadcast Rules

### 11.1 Participant Count

When participants join or leave:

* Updated participant count may be broadcast
* Broadcast is system-level (not participant-specific)
* Count reflects **active participants only**

---

### 11.2 Participant Details

Session does **not** broadcast:

* individual participant names
* join/leave events with identity
* role assignments to audience

Participant list visibility is **trainer-only** when applicable.

---

### 11.3 Access Code Broadcasting

Session access codes and QR codes:

* are displayed in TrainerView
* are **not** displayed in AudienceView (post-join)
* are **entered** on AudienceInput (pre-join)
* do **not** refresh or rotate during session

---

## 12. Interaction with Other Pipelines

### 12.1 Pulse Pipeline

Session provides:

* Authoritative participant list for pulse aggregation
* Join/leave signals to trigger pulse recalculation
* Participant count for pulse context

Session does not:

* interpret pulse values
* weight pulse by role
* validate pulse submissions

---

### 12.2 Message Pipeline

Session provides:

* Role metadata for message attribution
* Participant presence for message addressing
* Join/rejoin trigger for state synchronization

Session does not:

* validate message content
* filter messages by role
* determine threading

---

### 12.3 Focus Pipeline

Session provides:

* Context for focus state synchronization
* Participant list for focus broadcasts
* Join/rejoin trigger for focus sync

Session does not:

* set or clear focus
* validate focus content
* determine focus scope

---

### 12.4 Confusion Pipeline

Session provides:

* Participant count for confusion signal context
* Join/rejoin trigger for confusion state sync

Session does not:

* detect confusion
* resolve confusion
* weight confusion signals

---

## 13. Temporal Boundaries

### 13.1 Session Start

Sessions begin when:

* First participant (typically trainer) initiates session
* Access code and QR code are generated

There is no:

* pre-session setup
* scheduled start time
* required initialization

---

### 13.2 Session Duration

During an active session:

* Access codes remain valid
* Participants can join and rejoin freely
* State accumulates (messages, confusion, etc.)
* Current state is always available for sync

---

### 13.3 Session End

Sessions end when:

* Last participant leaves
* Server shuts down
* Explicit session termination (future)

Session end **triggers**:

* Access code invalidation
* QR code expiration
* Participant registry cleared

Session end **does not**:

* persist participant history
* save transcripts
* generate reports
* archive state

---

### 13.4 Ephemeral State

All session state is **ephemeral**:

* Participant lists are not saved
* Join/leave history is not retained
* Metadata does not persist
* Access codes expire
* QR codes become invalid

Sessions exist **only while active**.

---

## 14. Non-Goals

Session does not:

* authenticate users
* enforce access control beyond session routing
* manage permissions beyond role assignment
* validate credentials
* track attendance
* measure engagement
* evaluate learning
* replace facilitation
* persist identity across sessions
* provide password protection or encryption
* rate-limit join attempts
* enforce participant limits

---

## 15. Design Principles

### 15.1 Minimal State

Session maintains **only what is needed** for live coordination.

No historical data.
No predictive data.
No evaluative data.

---

### 15.2 Participant Dignity

Session treats all participants as:

* equally present
* equally valid
* equally temporary

Roles are **logistical only**.

---

### 15.3 Pipeline Autonomy

Session provides **foundational services** without imposing:

* semantic interpretation
* behavioral constraints
* outcome expectations

Other pipelines decide what presence means.

---

### 15.4 Frictionless Access

Session access prioritizes:

* ease of joining
* ease of rejoining
* accessibility
* mobile compatibility
* room-scale visibility

Over:

* security theater
* identity verification
* access restriction

---

### 15.5 Seamless Rejoin

Rejoining a session should feel like:

* you never left
* the conversation continued
* you're picking up where things are now

Not like:

* starting over
* losing context
* being penalized

---

## 16. Testing Boundaries

Session testing must verify:

* Join/leave/reconnect state transitions
* Participant count accuracy
* Role assignment consistency
* Cross-session isolation
* State access protection
* Access code generation and validation
* QR code validity
* State synchronization on join/rejoin
* Access code reusability within session
* Access code expiration on session end

Session testing must **not** verify:

* Message delivery (Message Pipeline)
* Pulse aggregation (Pulse Pipeline)
* Confusion detection (Confusion Pipeline)
* Focus propagation (Focus Pipeline)

---

## 17. Future Considerations

### 17.1 Implemented in Future Phases

* Session persistence (replay, archival)
* Session naming or labeling
* Participant authentication (if required)
* Multi-session views for trainers
* Session migration or merging
* Access code rotation
* Pre-session lobby or waiting room
* LiveView projection display

### 17.2 Intentionally Deferred

* Participant identity verification
* Cross-session participant linking
* Historical session analytics
* Automated session lifecycle management
* Password-protected sessions
* Participant limits or capacity management
* Join rate limiting
* Participant removal or banning

These features **may** be added in future phases but are **not** part of the current contract.

---

## 18. Entry Flow Summary (Normative)

### 18.1 First-Time Join

1. Audience member navigates to application
2. Sees AudienceInput page with code entry interface
3. Enters access code (or scans QR code)
4. Submits
5. Session validates code
6. Client joins session
7. Current session state synchronizes
8. AudienceView populates with messages, focus, votes, etc.

---

### 18.2 Rejoin After Disconnection

1. Audience member returns to application
2. Sees AudienceInput page with code entry interface
3. Enters **same** access code (or scans same QR code)
4. Submits
5. Session validates code
6. Client rejoins session
7. Current session state re-synchronizes
8. AudienceView re-populates with current state

**Key:** Same code works. Current state loads. Session continues.

---

## 19. Final Lock Statement

> Sessions exist to track who is present in the room. They provide authoritative participant state without interpretation, judgment, or persistence. Sessions are structural, ephemeral, and foundational. Access is frictionless and rejoin is seamless. Entry is via code submission on AudienceInput. State synchronization ensures participants always see current session context.

---

# APPENDIX A — SESSION COMPONENT WIREFRAMES (NORMATIVE)

---

## A.1 AUDIENCEINPUT PAGE (Entry/Rejoin Interface)

### A.1.1 Desktop/Tablet View

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│              AMPLIFYED PULSE                            │
│                                                         │
│            Join a Live Session                          │
│                                                         │
│   ┌─────────────────────────────────────────────┐      │
│   │                                             │      │
│   │         [📷 QR Code Scanner Icon]           │      │
│   │                                             │      │
│   │         Tap to Scan QR Code                 │      │
│   │                                             │      │
│   └─────────────────────────────────────────────┘      │
│                                                         │
│                    — or —                               │
│                                                         │
│              Enter Session Code                         │
│                                                         │
│   ┌─────────────────────────────────────────────┐      │
│   │  [ ABCD-1234                    ]          │      │
│   └─────────────────────────────────────────────┘      │
│                                                         │
│        ┌───────────────────────────┐                   │
│        │    Join Session           │                   │
│        └───────────────────────────┘                   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

### A.1.2 Mobile View

```
┌─────────────────────┐
│                     │
│  AMPLIFYED PULSE    │
│                     │
│  Join Session       │
│                     │
│  ┌───────────────┐  │
│  │               │  │
│  │  [📷 Scan]    │  │
│  │               │  │
│  │  Tap to Open  │  │
│  │   Camera      │  │
│  │               │  │
│  └───────────────┘  │
│                     │
│      — or —         │
│                     │
│  Enter Code         │
│  ┌───────────────┐  │
│  │ ABCD-1234    │  │
│  └───────────────┘  │
│                     │
│  ┌───────────────┐  │
│  │ Join Session  │  │
│  └───────────────┘  │
│                     │
└─────────────────────┘
```

---

### A.1.3 Error State

```
┌─────────────────────────────────────────────────────────┐
│              AMPLIFYED PULSE                            │
│            Join a Live Session                          │
│                                                         │
│   ┌─────────────────────────────────────────────┐      │
│   │         [📷 QR Code Scanner Icon]           │      │
│   │         Tap to Scan QR Code                 │      │
│   └─────────────────────────────────────────────┘      │
│                    — or —                               │
│              Enter Session Code                         │
│   ┌─────────────────────────────────────────────┐      │
│   │  [ XYZ9-8765                    ]          │      │
│   └─────────────────────────────────────────────┘      │
│                                                         │
│   ⚠️  Session not found. Check your code and try again. │
│                                                         │
│        ┌───────────────────────────┐                   │
│        │    Join Session           │                   │
│        └───────────────────────────┘                   │
└─────────────────────────────────────────────────────────┘
```

---

### A.1.4 Loading State

```
┌─────────────────────────────────────────────────────────┐
│              AMPLIFYED PULSE                            │
│            Join a Live Session                          │
│                                                         │
│   ┌─────────────────────────────────────────────┐      │
│   │         [📷 QR Code Scanner Icon]           │      │
│   │         Tap to Scan QR Code                 │      │
│   └─────────────────────────────────────────────┘      │
│                    — or —                               │
│              Enter Session Code                         │
│   ┌─────────────────────────────────────────────┐      │
│   │  [ ABCD-1234                    ]          │      │
│   └─────────────────────────────────────────────┘      │
│                                                         │
│                  ⏳ Joining session...                   │
│                                                         │
│        ┌───────────────────────────┐                   │
│        │    Join Session           │  (disabled)       │
│        └───────────────────────────┘                   │
└─────────────────────────────────────────────────────────┘
```

---

## A.2 TRAINERVIEW - SESSION ACCESS PANEL

### A.2.1 Expanded Panel (Recommended for Initial Implementation)

```
┌─────────────────────────────────────────────────────────┐
│  SESSION ACCESS                      👥 5 participants  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────┐       Session Code                        │
│  │         │                                            │
│  │ █████   │       ABCD-1234                            │
│  │ █████   │                                            │
│  │ █████   │       Share this code with your audience   │
│  │ █████   │       to join the session                  │
│  │         │                                            │
│  └─────────┘       ┌──────────────────┐                │
│   QR Code          │  Copy Code       │                │
│                    └──────────────────┘                │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

### A.2.2 Compact Header (Alternative)

```
┌─────────────────────────────────────────────────────────┐
│  TrainerView                           👥 5 participants│
├──────────────────────┬──────────────────────────────────┤
│  Session: ABCD-1234  │  [QR] [Copy]                    │
└──────────────────────┴──────────────────────────────────┘
```

---

### A.2.3 Collapsible Panel (Future Enhancement)

**Collapsed:**

```
┌─────────────────────────────────────────────────────────┐
│  SESSION  ▶                          👥 5 participants  │
└─────────────────────────────────────────────────────────┘
```

**Expanded:**

```
┌─────────────────────────────────────────────────────────┐
│  SESSION  ▼                          👥 5 participants  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────┐       Code: ABCD-1234                     │
│  │ █████   │                                            │
│  │ █████   │       Audience joins at:                   │
│  │ █████   │       pulse.app/join                       │
│  └─────────┘                                            │
│                    ┌──────────────────┐                │
│                    │  Copy Link       │                │
│                    └──────────────────┘                │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## A.3 TRAINERVIEW - SESSION PANEL PLACEMENT OPTIONS

### A.3.1 Option A: Top of Page (Recommended)

```
┌─────────────────────────────────────────────────────────┐
│  SESSION ACCESS      ABCD-1234  [QR] [Copy]  👥 5       │
├──────────────────┬──────────────────────────────────────┤
│                  │                                      │
│  [Confusion]     │  [Messages & Focus]                  │
│  [Left Panel]    │  [Main Content]                      │
│                  │                                      │
│                  │                                      │
└──────────────────┴──────────────────────────────────────┘
```

---

### A.3.2 Option B: Left Sidebar (Alternative)

```
┌──────────────────┬──────────────────────────────────────┐
│  SESSION         │                                      │
│  ABCD-1234       │  [Messages & Focus]                  │
│  👥 5            │  [Main Content]                      │
│  ┌────────┐      │                                      │
│  │ QR     │      │                                      │
│  │ Code   │      │                                      │
│  └────────┘      │                                      │
│  [Copy]          │                                      │
│                  │                                      │
│  ───────────     │                                      │
│  [Confusion]     │                                      │
│  [Panel]         │                                      │
│                  │                                      │
└──────────────────┴──────────────────────────────────────┘
```

---

## A.4 FLOW DIAGRAM

### A.4.1 Audience Journey

```
[AudienceInput Page]
      |
      | Enter code: ABCD-1234
      | or Scan QR
      ↓
[Validate & Join]
      |
      | Success → sync state
      ↓
[AudienceView]
- Shows messages
- Shows focus
- Shows pulse buttons
- NO entry controls
- Session code shown for reference only
```

---

### A.4.2 Trainer Journey

```
[TrainerView Loads]
      |
      | Generate session
      ↓
[Session Panel Displays]
- QR Code: shareable
- Access Code: ABCD-1234
- Copy link button
- Participant count
      |
      | Share with audience
      ↓
[Audience joins using code]
      |
      | Participant count updates
      ↓
[Session continues]
```

---

## A.5 Wireframe Authority

These wireframes are **normative**.

They define:

* Required user interaction patterns
* Required input methods (QR and manual)
* Required state feedback (loading, error)
* Required information display (code, QR, participant count)
* Structural placement options

Visual styling may change.
Structural semantics and interaction patterns may not.

---

## A.6 Implementation Notes

**AudienceInput Component:**
* Single purpose: get audience into session
* Two input methods (QR or manual) for accessibility
* Clear feedback for loading/error states
* Mobile-first responsive design
* On success, navigates to AudienceView

**TrainerView Session Panel:**
* Always visible (persistent)
* Shows live participant count
* QR code must be large enough to photograph/screenshot
* Copy button for digital sharing
* Can start expanded, add collapse later if needed

**Not in Scope Yet:**
* LiveView projection (deferred)
* Session naming/labeling
* Multiple sessions
* Session history

---

**Contract Version:** 1.0  
**Last Updated:** January 2026  
**Authority:** Foundational — All pipelines depend on session state  
**Stability:** Locked — Changes require cross-pipeline review
