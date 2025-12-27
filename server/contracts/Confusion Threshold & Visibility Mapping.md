# Phase 3.2 — Threshold & Visibility Mapping

## Purpose

This document maps the **Confusion Escalation Contract (Phase 3.1)** into explicit, observable visibility states.

It defines:
- when confusion must be visible
- how visibility escalates
- when attention becomes mandatory

This is not a UI design spec.
This is a **visibility obligation map**.

---

## Core Rule (Inherited)

> **The system may not remain visually quiet once confusion becomes shared.**

All mappings below exist to enforce that rule.

---

## Confusion Levels (By Unique Participant Count)

Let **N** = number of unique participants expressing confusion in the same thread.

### Level 0 — No Confusion (N = 0)
**State**
- No confusion indicator rendered

**System Status**
- Silence is allowed

---

### Level 1 — Initial Confusion (N = 1)
**State**
- Confusion indicator MUST appear
- Meter visible at lowest value

**Visibility Requirements**
- Indicator is visible inside the thread card
- Presence is explicit, not implied

**Notes**
- Confusion may not remain hidden once detected
- This is a registration event, not escalation

---

### Level 2 — Emerging Shared Confusion (N = 2 to T−1)
**State**
- Confusion meter MUST increment per unique participant
- Visual state MUST change as N increases

**Visibility Requirements**
- Meter progression must be perceptible
- Growth must be visually obvious, not subtle

**Notes**
- This state communicates accumulation
- The system is building evidence, not yet demanding interruption

---

### Level 3 — Shared Confusion (N ≥ T)
**State**
- Thread MUST be flagged as requiring trainer attention

**Visibility Requirements**
- Flag MUST be unmissable in TrainerView
- Indicator MUST persist while N ≥ T
- Visibility MUST not rely on scrolling, hovering, or discovery

**Notes**
- This is mandatory attention, not optional awareness
- The system is no longer advisory at this level

---

## Threshold Semantics

- Threshold **T** represents **shared confusion**, not severity
- T is a product decision, but **crossing it is a hard boundary**
- Once crossed, escalation is mandatory

The system may tune **T**, but may not weaken the obligation tied to it.

---

## Non-Suppressible Visibility

Once N ≥ 1:
- Confusion indicators may not be hidden

Once N ≥ T:
- Confusion flags may not be suppressed by:
  - off-topic classification
  - focus changes
  - engagement heuristics
  - UI decluttering logic

Context may affect *ordering*, never *visibility*.

---

## Persistence Rules

- Confusion indicators persist until:
  - explicitly resolved by the trainer, or
  - the thread is formally cleared
- Indicators may not auto-dismiss based on time alone

Silence must be earned, not assumed.

---

## Resolution Visibility

When a trainer resolves confusion:
- The action must be explicit
- The indicator may change state (e.g., resolved)
- Resolution must be visible to the trainer

Resolution does not erase history; it closes the loop.

---

## Failure Conditions (Hard)

The following conditions are violations of this contract:

- N ≥ 1 and no confusion indicator is visible
- N increases but the meter does not change
- N ≥ T and the thread is not visually flagged
- A trainer can plausibly miss shared confusion

Any of the above is a system failure.

---

## Scope of This Document

This document:
- does NOT define UI styling
- does NOT define animations
- does NOT define colors or icons
- does NOT define emotional language

It defines **when visibility is mandatory**.

---

## Phase Status

- Phase 3.2 defines **visibility thresholds**
- Implementation must satisfy these mappings exactly
- Any deviation is a contract violation

---

_End of Phase 3.2_
