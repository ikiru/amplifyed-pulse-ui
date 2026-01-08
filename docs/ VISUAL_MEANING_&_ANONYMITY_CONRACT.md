# 📜 VISUAL MEANING & ANONYMITY CONTRACT  
## Thread Lineage, Depth, and Sensemaking

---

## 0. Purpose

This contract defines how **visual structure communicates meaning** in an anonymous, sensemaking-first system.

Its purpose is to ensure that:

- Ideas are perceived as **lines of thought**, not conversational turns
- Users can understand the **shape and depth of collective thinking** without reading message content
- Anonymity is preserved perceptually, not just technically
- Visual cues support orientation without creating competition, evaluation, or social pressure

This contract governs **visual semantics only**.  
It does **not** prescribe layout mechanics, interaction logic, behavior, or implementation.

---

## 0.1 Visual Metaphor (Normative)

The system adopts a **sensemaking / mind-map–inspired metaphor**, rather than a chat or conversational metaphor.

- Threads represent **paths of thought**
- Replies extend or branch those paths
- Messages function as **nodes along a path**, not standalone artifacts

The system is not a literal mind map, but it must *feel* like one in how structure and depth are perceived.

---

## 1. Unit of Meaning

### 1.1 Primary Unit: The Thread (Path of Thought)

- A thread represents a **continuous line of exploration**
- Threads are the primary carriers of structural meaning
- A thread’s visual footprint reflects **how far a line of thinking has been explored**, not its correctness, popularity, or importance

Threads must be perceptible **without reading message text**.

---

### 1.2 Secondary Unit: The Message (Node)

- Messages are **nodes attached to a thread**
- Messages do not own persistent visual identity
- Messages exist in service of the thread’s progression

Message-level visuals must not redefine thread structure or depth.

---

## 2. Structural Lineage Representation

### 2.1 Left-Side Lineage Bar

- Each thread is represented by a **vertical lineage bar** positioned along the left edge
- The height of the bar corresponds to the **vertical extent of the thread**
- Bar height communicates **structural depth**, not value or priority

The lineage bar is a pre-attentive orientation cue.

---

### 2.2 Elbow Geometry (Depth Transitions)

- Changes in depth are represented using **elbow-style connectors**
- Each elbow indicates **derivation from a prior node**
- Elbows communicate lineage and continuation, not response, challenge, or opposition

Elbows exist to make **structure visible**, not expressive.

---

## 3. Color Philosophy

### 3.1 Color Is Idea-Bound

- Color may attach to **thread lineage**
- Color must not attach to people, authors, or identities
- Color represents **idea continuity**, not ownership

---

### 3.2 Forking Behavior

- Forked paths retain the same base hue
- Forking indicates **conceptual divergence**, not sides or camps
- No new hues are introduced at forks

---

### 3.3 Thread Color Assignment & Lifecycle

- Thread color is assigned once at creation
- Thread color remains stable for the lifetime of the thread within a session
- Thread color must not change based on activity, participation, voting, or ordering

Color resets between sessions and carries no meaning beyond structural grouping.

---

### 3.4 Color Presence vs Emphasis

- The presence of color does not itself imply emphasis
- Emphasis refers to **relative perceptual contrast**, not existence of color
- Color may remain visible even when a thread is not visually prominent

---

## 4. Depth, Intensity, and Legibility

### 4.1 Depth-Based Intensity

- Intensity variation may reflect **distance from the thread origin**
- Intensity changes must be monotonic and predictable
- Intensity must not imply correctness, authority, or importance

---

### 4.2 Anchor Reference

- The thread origin is the perceptual reference point
- No depth-based treatment may create a focal point stronger than the anchor

Depth communicates structure, not escalation.

---

### 4.3 Text Legibility

- Structural shading must not compromise readability
- Text color may adapt mechanically to maintain contrast
- Such adaptation must remain semantically neutral and non-expressive

Legibility adjustments exist solely to preserve readability.

---

## 5. Visual Gravity and Scale

### 5.1 Meaning Over Activity

- Visual weight must reflect **structure**, not activity volume
- High participation alone must not amplify visual prominence

---

### 5.2 Large-Room Constraint

- Structural cues must remain calm under high concurrency
- The interface must prevent visual overload
- Only a small number of threads should carry strong contrast at any moment

If all threads appear equally dominant, the system has failed.

---

## 6. Off-Topic Treatment

### 6.1 Off-Topic as De-Emphasis

- Off-topic content is not incorrect or discouraged
- It represents **lower relevance** to the current inquiry

---

### 6.2 Off-Topic Visual Treatment

- Off-topic visuals must feel closer to absence than presence
- No new hue families may be introduced
- Off-topic paths must not compete with primary threads

If users remember the off-topic styling, the design has failed.

---

## 7. Prohibited Visual Signals

The following are disallowed:

- Signals implying winning, losing, dominance, or correctness
- Visual cues that create sides or factions
- Persistent styling that enables identity inference
- Expressive geometry or color that anthropomorphizes ideas
- Escalation tied to participation, speed, or volume

---

## 8. Enforcement Rule

If a visual decision:

- Encourages comparison between contributors
- Creates competition between paths
- Makes forks feel adversarial
- Makes depth feel evaluative
- Enables pattern recognition of individuals

…it violates this contract and must be rejected or reworked.

---

## 9. Relationship to Components

This contract exists **upstream of components**.

Component-level decisions must:

- Be justifiable under this contract
- Avoid introducing new semantic meaning
- Defer to this contract in cases of ambiguity

If a decision cannot be justified here, it must pause.

---

---

## 10. Message Card — Element-Level Visual Rules (Authoritative)

This section defines **non-negotiable visual semantics** for elements inside an individual message card.

These rules govern **visual meaning only**.  
They do **not** prescribe layout mechanics, interaction logic, behavior, or implementation.

Unless explicitly stated, these rules apply consistently across **TrainerView** and **AudienceInput**.

---
### 10.x Message Card Structural Invariants (Authoritative)

The Messages system uses a fixed structural grid that must not be altered.

This structure is not a visual design choice.
It is a semantic and anonymity boundary.

All visual, spacing, and affordance rules in Section 10 assume this grid.

#### Fixed Grid: 2 Rows × 3 Columns

┌───────────────┬────────────────────────────┬───────────────┐
│ CELL 1        │ CELL 2                     │ CELL 3        │
│ LEFT · TOP    │ CENTER · TOP               │ RIGHT · TOP   │
│               │                             │               │
│ Downvote      │ Message body text           │ Upvote        │
│ arrow + count │ (primary semantic content)  │ arrow + count │
│ (always on)   │                             │ (conditional) │
├───────────────┼────────────────────────────┼───────────────┤
│ CELL 4        │ CELL 5                     │ CELL 6        │
│ LEFT · BOTTOM │ CENTER · BOTTOM            │ RIGHT · BOTTOM│
│               │                             │               │
│ Collapse /    │ Badges + clarification     │ Reply         │
│ expand arrow  │ (Off Focus, Confused,      │               │
│               │ dropdown, etc.)             │               │
└───────────────┴────────────────────────────┴───────────────┘

#### Non-Negotiable Rules

- Elements MUST NOT move between cells.
- Cells MUST NOT be merged, split, or repurposed.
- Votes MUST remain in the top row only.
- Badges and clarification controls MUST remain in the bottom center cell.
- Collapse control MUST remain bottom left.
- Reply MUST remain bottom right.
- Conditional rendering (e.g., upvotes) does not change cell ownership.

Any change that violates this grid is a contract violation.


### 10.1 Message Text (Primary Content)

Message text is the **primary perceptual focus** of the message card.

**Rules**
- Font family must use the system UI font stack.
- Typography must feel **inviting and idea-friendly**, encouraging thoughtful reading and writing.
- Message text must not imply:
  - importance
  - correctness
  - urgency
  - hierarchy between messages
- All messages must appear visually equal in status.

**Constraints**
- Font size may vary only within a narrow, readability-focused range.
- Line height must support multi-sentence reading without visual crowding.
- Color adjustments are permitted only to preserve legibility and must remain semantically neutral.

Message text must always dominate badges, votes, and controls perceptually.

---

### 10.2 Badges (Facilitation Signals)

Badges include:
- Off Focus  
- Confusion  
- Clarification / Resolution  

Badges communicate **facilitation-relevant state**, not evaluation or judgment.

**Rules**
- Badge location is fixed and must not change.
- Badge color:
  - must be independent of thread color
  - must be stable per badge type
  - must be muted and non-alerting
- Badges must be noticeable at scan level but remain secondary to message text.

**Prohibitions**
- Badges must not imply correctness, error, authority, or urgency.
- Badge colors must not be reused by votes, thread structure, or controls.
- Badges must not feel clickable or evaluative.

Badges function as **annotations**, not status markers.

---

### 10.3 Votes (Approval / Disapproval Signals)

Votes represent **explicit approval and disapproval** from the audience.

This semantic truth must be acknowledged visually without escalation, gamification, or judgment.

**Shape Language**
- Vote indicators use **filled triangles**.
- Collapse / structural controls use **chevrons**.
- These shape systems must remain visually distinct.

**Color Semantics**
- Votes use **constrained soft polarity**:
  - approval and disapproval may differ subtly in tone
  - tones must be muted and emotionally restrained
- Vote counts must remain **neutral in color**.
- Color must not change based on magnitude.

**Rules**
- Votes must not imply:
  - correctness
  - popularity
  - ranking
  - winning or losing
- Votes must not compete with message text or badges.

**Context**
- TrainerView: votes are read-only indicators.
- AudienceInput: votes are interactive.
- Placement and visual identity must remain consistent across views.

---


#### 10.3.1 Vote Placement & Spacing (Authoritative)

Votes represent **anonymous audience voice** and may be positioned prominently to ensure they are felt, not merely seen.

**Clarifications**
- Votes may be placed symmetrically on either side of message text to:
  - reduce accidental interaction on mobile
  - increase legibility of audience sentiment
  - encourage readers to scan across and read the message content
- Symmetric placement is permitted when it serves attention, comprehension, and voice expression — not evaluation.

**Spacing Rules**
- Votes must not visually enclose, box, or frame the message text.
- A clear visual gutter must exist between vote indicators and the message text block.
- Message text must remain perceptually open and uninterrupted.

**Semantic Constraint**
- Votes function as **reactions to a message**, not as containers of it.
- Placement must preserve causal reading:
  - message → reaction
  - not reaction → message → reaction as a score frame

This rule exists to amplify anonymous voice without redefining messages as scored artifacts.


### 10.4 Reply Affordance (Cross-Domain Action)

Reply is the **only element shared** between Trainer and Audience domains.

**Rules**
- Reply must read as a **neutral, optional action**.
- Visual treatment must be identical across TrainerView and AudienceInput.
- Reply must not feel instructional, encouraging, or authoritative.

**Constraints**
- Text-only affordance.
- Neutral color.
- No button chrome, icons, animation, or call-to-action styling.

Reply must fade during scanning while remaining discoverable when intentionally sought.

---

### 10.5 Global Prohibitions (Message Card)

Within message cards, the following are disallowed:

- Reordering or moving elements between sections
- Visual cues that rank messages or contributors
- Identity cues of any kind
- Gamification or escalation based on activity or volume
- Reuse of thread color outside structural lineage
- Visual treatment that implies judgment, authority, or correctness

Any message-level visual decision that violates anonymity, introduces competition, or redefines meaning must be rejected.

---


**End of Contract**
