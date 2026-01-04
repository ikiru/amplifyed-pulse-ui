# MESSAGING CONTRACT

AudienceView · TrainerView · LiveView

---

## 1. Purpose

The Messaging system exists to provide a **shared, real-time conversational surface** where participants and facilitators can contribute messages during a live session.

Messaging is a **representation layer**.

It does not:

* evaluate correctness
* infer intent
* judge relevance
* determine understanding
* decide outcomes

Messaging presents human expression.
Other contracts determine meaning.

---

## 2. Message Participants (Roles)

Messages are authored by participants in the session.

Participant roles include:

* **Audience participant**
* **Trainer / facilitator**

Roles identify **who authored a message**, not what the message means.

Messaging:

* preserves role metadata
* may visually indicate role

Messaging does **not**:

* grant semantic authority
* alter interaction rights
* change ordering based on role

---

## 3. Message Types (Contract Boundary)

Messages may be associated with a **message type**.

Message types are **defined and determined by other contracts**.

Messaging:

* does not define meaning
* does not define assignment logic
* does not define transitions

Valid types include:

* On Topic
* Off Topic

---

## 4. Threading Model

Messages are organized into **threads**.

Threads are **structural containers**, not semantic units.

---

### 4.1 Thread Anchor

* Every thread has exactly one anchor message
* The anchor is the structural root
* Thread-level navigation targets the anchor
* The anchor has no semantic priority

---

### 4.2 Replies & Conversational Depth

* Replies respond to another message within the same thread
* Replies are **progressively indented**
* Indentation reflects conversational depth only
* Indentation does not imply importance or correctness
* Replies do not create subthreads

All replies belong to the same thread.

---

### 4.3 Thread Collapse & Expansion

* Threads may be collapsed or expanded when the UI opts to render a control
* Collapse affects **visibility only**
* Anchor always remains visible
* Thread-level controls live **inside the anchor card** when present

Collapse controls are conditional and may not be available for every message level or view.

---

### 4.4 Thread Integrity Rules

* Messages are never moved between threads
* Replies cannot exist outside a thread
* Threads do not auto-resolve
* Threads do not auto-close

---

## 5. Message States (Contract Boundary)

Messages may have states supplied by other contracts.

Messaging:

* displays states
* preserves metadata

Messaging does not determine state logic.

Valid states include:

* Confused
* Resolution

Confused and Resolution metadata are not surfaced on Off Topic messages.

---

## 6. Message Voting

* One vote per participant per message
* Upvote or downvote
* No stacking or spam
* Votes are displayed but never interpreted

---

## 7. Message & Thread Ordering

* Default ordering is **creation time**
* Other ordering may be facilitator-selected
* Messaging does not define ordering logic

---

## 8. Message Surfaces

Messages appear across:

* Audience View
* Trainer View
* Live View (room-facing)

Semantics are preserved across all surfaces.
Presentation may vary.

---

## 9. Design Principles

* Human voice first
* No judgment
* No forced conclusions
* Structure supports clarity

---

## 10. Non-Goals

Messaging does not:

* determine focus
* determine confusion
* rank messages
* replace facilitation

---

# APPENDIX A — MESSAGE CARD WIREFRAME (NORMATIVE)

(unchanged)

---

# APPENDIX B — THREAD WIREFRAME (NORMATIVE)

The following wireframe defines the **required structural layout of a full thread**, including **anchor and indented replies**.
Indentation is mandatory and semantically meaningful for conversational context.

---

### B.1 Thread Anchor (Level 0)

```
┌────────────┬──────────────────────────────────────────┬────────────┐
│    ▼ 0     │ Let’s ground ourselves. What norms        │    ▲ 1     │
│            │ matter most when discussions get heated? │            │
├────────────┼──────────────────────────────────────────┼────────────┤
│     ▾      │ [ Confused ]  Resolution ▼  [ Off Topic ]│   Reply    │
└────────────┴──────────────────────────────────────────┴────────────┘

```

---

### B.2 Reply (Level 1)

```
    ┌──────────────────────────────────────────────────────────┐
    │ ▼ 0                                        ▲ 2          │
    │                                                          │
    │ Time limits help. Otherwise a few voices dominate.       │
    │                                                          │
    │──────────────────────────────────────────────────────────│
    │ [ Confused ]        Resolution ▼           Reply         │
    │                                                          │
    │ [ Off Topic ]                                            │
    └──────────────────────────────────────────────────────────┘
```

---

### B.3 Reply to Reply (Level 2)

```
┌────────────┬──────────────────────────────────────────┬────────────┐
│    ▼ 0     │ Time limits help. Otherwise a few voices  │    ▲ 2     │
│            │ dominate.                                │            │
├────────────┼──────────────────────────────────────────┼────────────┤
│            │ [ Confused ]  Resolution ▼  [ Off Topic ]│   Reply    │
└────────────┴──────────────────────────────────────────┴────────────┘

```

---

### B.4 MESSAGE CARD — CONFUSION + RESOLUTION + ATTRIBUTION

```
┌────────────┬──────────────────────────────────────────┬────────────┐
│    ▼ 0     │ Time limits help. Otherwise a few voices  │    ▲ 2     │
│            │ dominate.                                │            │
├────────────┼──────────────────────────────────────────┼────────────┤
│            │ [ Confused ● ]  Resolution: Clarified ▼  │   Reply    │
│            │                     by trainer           │            │
└────────────┴──────────────────────────────────────────┴────────────┘

```

---

### B.5 MESSAGE CARD — OFF TOPIC

```
┌────────────┬──────────────────────────────────────────┬────────────┐
│    ▼ 0     │ Time limits help. Otherwise a few voices  │    ▲ 2     │
│            │ dominate.                                │            │
├────────────┼──────────────────────────────────────────┼────────────┤
│            │ [ Off Topic ]                            │   Reply    │
└────────────┴──────────────────────────────────────────┴────────────┘

```

---
### B.6 Wireframe Authority

This appendix is **normative**.

It defines:

* required indentation behavior
* required affordance availability
* required structural consistency across views

Visual styling may change.
Structural semantics may not.
