# Phase 3.1 — Confusion Escalation Contract

## Purpose

The Confusion system exists to make **collective uncertainty impossible to ignore**, not to explain it.

This contract defines when confusion must surface, how it escalates, and what the system is obligated to do once shared confusion is detected.

This contract governs **obligation**, not interpretation.

---

## Core Principle

> **Silence is not allowed once confusion becomes shared.**

When multiple unique participants express confusion about the same thread or concept, the system must surface that fact in a way that cannot be plausibly missed by the trainer.

The system does **not** diagnose, judge, or explain.
It **forces awareness**.

---

## Definitions

### Confusion Signal
A confusion signal is emitted when a participant:
- explicitly self-reports confusion, or
- expresses confusion through validated passive detection

### Unique Participant
A unique participant is defined by a stable participant identifier within a session.
Duplicate signals from the same participant do not increase escalation.

### Thread Scope
Confusion is tracked at the **thread / root message** level.
Escalation is local to that scope.

---

## Escalation Rules

### Rule 1 — First Confusion Must Register
- The **first unique confusion signal** on a thread MUST:
  - make the confusion indicator visible
  - register on the confusion meter at its lowest state
- Confusion may not remain invisible once detected.

### Rule 2 — Shared Confusion Must Accumulate
- Each additional unique participant expressing confusion MUST:
  - increment the confusion meter
  - visibly change the indicator state
- The meter must reflect **growth**, not just presence.

### Rule 3 — Shared Confusion Is Mandatory Attention
When confusion reaches a defined participant threshold (**T**):

- The thread MUST be visually flagged as requiring trainer attention.
- This flag MUST be:
  - persistent while the condition holds
  - unmissable in the TrainerView
- The system may not rely on the trainer “noticing” subtle cues.

This is an obligation, not a suggestion.

---

## Threshold Semantics

- Threshold **T** represents *shared confusion*, not severity.
- Crossing **T** does **not** imply failure, error, or wrongdoing.
- It implies only that **multiple people are not tracking**.

Threshold values are implementation details, but the obligation is not optional.

---

## Non-Suppressible Conditions

Once shared confusion exists:

- Confusion may NOT be suppressed solely because a thread is:
  - labeled off-topic
  - low engagement
  - outside the current focus
- Context may affect **priority**, but not **visibility**.

The system may not hide reality to preserve flow.

---

## Resolution Semantics

- Confusion remains visible until:
  - the trainer explicitly resolves it, or
  - the thread naturally concludes and is cleared
- Resolution is an **explicit act**, not an assumption.

---

## What the Confusion System Does NOT Do

To avoid false authority, the system explicitly does **not**:

- determine correctness
- assign blame
- infer emotional state
- claim learning failure
- explain why confusion exists

Those interpretations belong to humans.

---

## UI Authority Boundaries

- UI elements (meters, flags, indicators) may:
  - show presence
  - show accumulation
  - show escalation
- UI elements may NOT:
  - state conclusions
  - label outcomes
  - imply diagnosis

UI enforces visibility, not meaning.

---

## Failure Conditions (System Bugs)

The following conditions constitute a system failure:

- Multiple participants express confusion and the UI remains quiet
- The confusion meter does not change as participants accumulate
- Shared confusion can be plausibly missed by a trainer
- Confusion is silently ignored due to metadata or heuristics

Any of the above violates this contract.

---

## Phase Status

- Phase 3.1 defines **escalation obligation**
- No implementation is specified here
- Any future implementation must satisfy this contract

---

_End of Phase 3.1_
