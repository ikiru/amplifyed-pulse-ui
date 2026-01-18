# Audience Drift Contract v1.0  
**Room-Level Audience Attention Drift Scoring**

---

## 1. Purpose

The Audience Drift system exists to estimate **room-level audience attention distribution** relative to a **declared focus**, in order to provide situational awareness to a human trainer.

The system:
- observes behavior
- aggregates signals
- produces a single drift score

The system does **not** instruct, correct, evaluate, or intervene.

---

## 2. Scope & Constraints (Non-Negotiable)

- Audience Drift is **room-level only**
- Audience members are **anonymous**
- No tracking of individuals
- The authoritative output is a **single aggregate audience drift score**
- Optional message-level **on/off-focus labels** may exist as **transient, non-authoritative annotations**
  - They are not required for the system to function
  - They must not be interpreted as evaluation, correctness, or behavioral enforcement
- The system is **allowed to be imperfect**
- Audience Drift can be **generative, neutral, or integrative**

---

## 3. Definition of Drift

**Audience Drift** is defined as:

> The degree to which collective attention diverges from the currently declared focus.

Drift:
- is **relative**, not absolute
- reflects **distance**, not value
- does not imply success or failure

Both **total convergence** and **total divergence** are undesirable extremes.  
A middle range represents adaptive balance.

---

## 4. What Is Judged (Strictly Limited)

The system makes **one internal binary judgment only**:

> Is a contribution **on-focus** or **off-focus**, relative to the *current focus statement*?

There is:
- no quality judgment
- no correctness judgment
- no attribution
- no permanence

Judgments are **transient** and used only to update the aggregate drift score.

---

## 5. Focus as Reference Frame

- The **focus statement** is the sole semantic anchor.
- Trainer intent, tone, or verbal explanation is not inferred.
- A focus change updates the reference frame **immediately**.
- A focus change does **not** erase prior momentum.

### 5.1 Default Focus (“Open Conversation”)

The system may maintain a default focus (e.g., “Open Conversation”) to preserve the invariant that a session always has an active focus.

When the active focus is the default “Open Conversation”, **semantic on/off-focus judgment is undefined** and Audience Drift is considered **paused**:
- No on/off-focus classification is applied
- No aggregate drift score is updated (prior score may be retained but is not advanced)
- The UI may display an explicit “drift paused / no focus set” state

---

## 6. Focus Proximity Weighting

Off-focus influence is weighted by proximity to focus history for Audience Drift:

1. **Current focus**
   - Fully on-focus
   - Strong stabilizing influence

2. **Previous focus**
   - Off-focus relative to current focus
   - Conceptually adjacent
   - Represents inertial or integrative drift
   - **Weak drift influence**

3. **Distant (older) focus**
   - Off-focus and non-adjacent
   - Represents true divergence
   - **Stronger drift influence**

This weighting affects **influence strength only**, not classification.

---

## 7. Filters / Signals (Conceptual Order)

Filters are evaluated conceptually from **cheapest to most expensive**.  
No single filter (except self-report) is authoritative.

### 7.1 Deterministic / Structural Filters

1. **Self-reported off-focus**
   - Explicit participant signal
   - Always authoritative

2. **Short / minimal responses ignored**
   - e.g. yes, no, ?, 👍
   - Excluded from drift influence

3. **Focus keyword presence**
   - Literal keyword match only
   - Indicates on-focus signal

4. **Thread inheritance**
   - On-focus thread head → replies inherit on-focus
   - If a message self-reports off-focus, that message and all replies below it are off-focus

5. **Explicit off-focus language**
   - Literal phrases (e.g. “off topic”, “side note”)

6. **Focus-anchor interaction**
   - Structural engagement with focus-linked threads

7. **Focus-thread abandonment (B-only)**
   - Triggered only when:
     - a focus-linked thread becomes inactive **and**
     - other threads receive sustained activity
   - Silence alone does not count

8. **Sustained lateral branching**
   - Parallel growth of multiple sibling threads
   - Indicates dispersion of attention
   - Neutral and non-judgmental

9. **Temporal decay**
   - Older signals lose influence over time
   - Drift reflects recent attention, not session history

---

## 8. AI Binary Judgment (Last Resort Only)

AI may be used **only** to resolve Audience Drift ambiguity when:
- Cheaper filters cannot resolve sustained ambiguity
- Structural signals conflict
- Room-level state remains unclear

AI characteristics:
- Binary output only: on-focus / off-focus
- No explanations
- No persistence
- Weak influence
- Session-scoped
- Fully optional (system functions without AI)

AI is **never authoritative**.

---

## 9. Signal Interaction Rules

- Self-report overrides all other signals
- No single structural signal is decisive
- Audience Drift responds to **patterns**, not blips
- Aggregation always outweighs individual events

---

## 10. Time Behavior

- Audience Drift responds to **sustained behavior**
- Silence does not imply alignment or drift
- Low-activity rooms may yield indeterminate drift
- Old signals fade; new behavior dominates

---

## 11. Score Behavior Contract

- Audience Drift score is continuous
- Extremes are approached, not slammed
- The score:
  - does not alert
  - does not prescribe
  - does not evaluate
- Interpretation belongs entirely to the trainer

Indeterminate / ambiguous contributions may contribute mild “uncertainty pressure” (i.e., a small nudge toward drift) to reflect a lack of clear alignment signals. This is a modeling choice, not a judgment.

---

## 12. Explicit Non-Goals

The Drift system will **not**:
- identify participants
- evaluate message quality
- recommend trainer actions
- enforce alignment
- explain its reasoning
- be used for assessment or compliance

---

## 13. Failure Is Acceptable

- False positives are acceptable
- Drift may lag reality
- Some sessions may never resolve clearly
- Some drift may be intentionally ignored by trainers

Drift is an **estimate**, not a measurement.

---

## 14. Minimal Success Criteria (v1)

The system is considered working if:
- The score moves plausibly
- AI calls are rare for Audience Drift resolution
- Performance is stable
- Any message-level artifacts remain optional, transient, and non-authoritative
- Trainers feel informed, not directed

---

## 15. Drift Meter — Conceptual Wireframe

The Audience Drift Meter is a **single horizontal continuum** representing room-level audience attention distribution.

It visualizes **degree of audience drift**, not correctness or quality.

---

### 15.1 Orientation

- **Left**: Low audience drift (high convergence)
- **Center**: Adaptive / generative zone
- **Right**: High audience drift (strong divergence)

This directionality is fixed.

---

### 15.2 Structure (ASCII wireframe)

LOW DRIFT HIGH DRIFT
┌────────────────────────────────────────────────────┐
│ │
│ |────────|──────── SAFE ZONE ────────|────────|│
│ │
│ ▲ │
│ │ │
│ Drift Indicator │
│ │
└────────────────────────────────────────────────────┘


---

### 15.3 Safe Zone

- The **safe zone** occupies the middle portion of the meter
- It represents:
  - healthy exploration
  - productive divergence
  - integrative discussion
- Being inside the safe zone implies **neither alarm nor resolution**

The safe zone is **not labeled as “good”**.

---

### 15.4 Drift Indicator

- A single marker indicates current room drift position
- The marker:
  - moves smoothly
  - responds to sustained patterns
  - does not jump abruptly
- The indicator reflects the **aggregate drift score only**

No secondary markers, trends, or annotations are required in v1.

---

### 15.5 Behavioral Invariants

The meter:
- does not flash
- does not change color meaningfully
- does not alert
- does not prescribe action
- does not explain causality

It is **descriptive only**.

---

### 15.6 Interpretation Contract

- Far left does **not** mean “success”
- Far right does **not** mean “failure”
- Center does **not** mean “ideal”

The meter communicates **where the audience is**, not **what should happen next**.

Trainer interpretation is always final.

---

### 15.7 Explicit Non-Features (v1)

The drift meter will **not** include:
- thresholds
- warnings
- recommendations
- labels such as “good” or “bad”
- required message-level indicators in the drift meter (message labels, if present, are optional and non-authoritative)
- participant-level indicators

---

**End of Audience Drift Contract v1.0**
