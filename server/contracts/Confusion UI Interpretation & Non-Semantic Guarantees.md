# Phase 3.3 — UI Interpretation & Non-Semantic Guarantees

## Purpose

This document defines the **interpretation limits** of the UI when rendering confusion escalation.

Its role is not to reduce visibility or urgency.
Its role is to ensure the UI **never claims meaning it does not own**.

Escalation is mandatory.
Interpretation is human.

---

## Core Principle

> **The UI may force attention, but it may not assert conclusions.**

The system guarantees visibility.
Humans retain judgment.

These are not in conflict.

---

## What the UI Is Allowed to Do

When rendering confusion indicators, meters, or flags, the UI MAY:

- Make confusion **visible**
- Show **accumulation** over time
- Signal **shared confusion**
- Flag a thread as **requiring attention**
- Persist indicators until explicit resolution
- Visually distinguish between:
  - initial confusion
  - accumulating confusion
  - shared confusion (mandatory attention)

These actions are **obligations**, not suggestions.

---

## What the UI Must Never Do

The UI must never:

- Declare correctness or incorrectness
- Assign blame to participants or trainers
- Infer emotional states (e.g., frustration, anxiety)
- Claim learning failure
- Explain *why* confusion exists
- Suggest what action the trainer should take
- Downplay or contextualize away shared confusion

The UI surfaces reality.
It does not interpret it.

---

## Language Constraints

Any text, labels, or microcopy associated with confusion indicators must:

- Describe **state**, not **cause**
- Avoid evaluative language
- Avoid emotional framing
- Avoid outcome framing

### Allowed examples
- “Confusion reported”
- “Multiple participants confused”
- “Shared confusion requires attention”

### Forbidden examples
- “Participants don’t understand”
- “This topic failed”
- “Trainer explanation unclear”
- “Audience is frustrated”

---

## Visual Semantics vs. Meaning

Visual strength (size, contrast, prominence) is allowed to increase with escalation.

Semantic strength (claims, conclusions) is not.

The UI may become **louder**.
It may not become **smarter**.

---

## Mandatory vs. Advisory States

- **Before threshold (N < T):**
  - UI is advisory but visible
  - Trainer discretion applies

- **After threshold (N ≥ T):**
  - UI is mandatory and unmissable
  - Discretion to ignore is removed
  - Discretion to interpret remains

This distinction is critical.

---

## Resolution Semantics

When a trainer resolves confusion:

- The UI may indicate that resolution occurred
- The UI must not imply success, failure, or correctness
- Resolution is an action acknowledgment, not a judgment

---

## Non-Semantic Guarantee

The system guarantees:

- If shared confusion exists, it will be seen
- If it is seen, it will not be mischaracterized by the UI
- If it is resolved, that act will be visible

The system does **not** guarantee understanding, agreement, or learning.

---

## Failure Conditions (UI Bugs)

Any of the following constitute a violation:

- UI text that explains confusion
- UI elements that imply blame or failure
- UI hiding or muting shared confusion
- UI adding emotional or evaluative framing

These are semantic overreaches and must be treated as bugs.

---

## Relationship to Prior Phases

- Phase 3.1 defines **when escalation is mandatory**
- Phase 3.2 defines **how visibility escalates**
- Phase 3.3 defines **what the UI is not allowed to claim**

All three are required for system integrity.

---

## Phase Status

- Phase 3.3 locks UI interpretation boundaries
- No implementation details are specified
- Any UI change must comply with this contract

---

_End of Phase 3.3_
