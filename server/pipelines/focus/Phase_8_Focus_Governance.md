# Phase 8 — Focus Governance

**Status:** Locked  
**Phase Type:** Governance & Definition  
**Implementation:** Not started (by design)

---

## Purpose

Phase 8 defines **Focus** as a trainer-authored facilitation tool that provides temporal context to a session without influencing participant behavior, room state, or system interpretation.

This phase exists to **lock semantics and authority boundaries** before any code is written.

---

## Core Definition

**Focus is a trainer-authored statement that defines what the room is intentionally focusing on at a given moment.**

Focus is:
- explicit
- human-authored
- changeable
- optional
- time-bound

Focus is **not inferred**, **not calculated**, and **not automated**.

---

## Authority & Roles

- Only users with the **trainer role** may:
  - create focus statements
  - stage multiple focus statements
  - reorder staged focus statements
  - activate a focus
  - clear a focus

- In sessions with co-trainers:
  - any trainer may manage focus
  - focus authority is role-based, not individual-based

Audience members have **no interaction** with Focus.

---

## Focus Lifecycle

### Creation
- Trainers may create focus statements at any time.
- Focus text is free-form and trainer-authored.

### Staging
- Trainers may stage multiple focus statements.
- Staged focus statements are:
  - trainer-only
  - non-semantic
  - not ordered by meaning

### Reordering
- Staged focus statements may be manually reordered.
- **Ordering has no semantic meaning** and is not interpreted by the system.

### Activation
- Only **one focus** may be active at a time.
- Activating a focus:
  - timestamps the activation
  - deactivates any previously active focus

### Editing
- Editing a focus **creates a new focus record**.
- Historical focus records are never mutated.

### Clearing
- Trainers may clear the active focus at any time.
- Clearing focus results in:
  - **no active focus**
  - no substitution or fallback
  - no retained framing

Clearing focus is a **valid and intentional state**.

---

## Temporal Integrity

- All focus activations and clear actions are timestamped.
- Focus timestamps exist to allow **temporal alignment** with messages.
- Messages remain immutable and do **not** contain focus data.

Example (conceptual):
> “This message was posted while Focus A was active.”

This is contextual, not causal.

---

## Session Events (Not Signals)

- Focus changes (activation and clearing) are logged as **session events**.
- Session events are:
  - factual
  - non-interpretive
  - non-reactive

Focus events are **not signals** and have **no runtime effect** on:
- messages
- mood
- pulse
- emotion
- safety
- focus inference

---

## Hard Guardrails (Non-Negotiable)

- Focus is **not embedded** in message objects.
- Focus does **not affect** room mood or emotional state.
- Focus does **not influence** pulse, safety, or scoring pipelines.
- Focus does **not trigger** automation or system nudges.
- Focus is **not required** to be present.
- Focus is **not evaluated**, ranked, or scored.

---

## Reporting (Deferred)

- Focus may be referenced later for **post-session reporting only**.
- Reports may describe:
  - when focus changed
  - which focus was active during messages
- Reports must not:
  - infer causation
  - re-score mood
  - reinterpret participant intent

Reporting is **explicitly out of scope** for Phase 8.

---

## Explicitly Out of Scope

The following are **not addressed** in Phase 8 and must not be implemented:

- Focus visibility to audience
- Audience interaction with focus
- Auto-expiration of focus
- Focus suggestions or inference
- Persistence across sessions
- Analytics tied to focus effectiveness
- Linking focus to moments automatically

---

## Exit Criteria

Phase 8 is complete when:

- Focus semantics are fully defined
- Authority boundaries are locked
- Temporal requirements are explicit
- No implementation has begun

---

## Phase Boundary

> Phase 8 defines **what Focus is allowed to be**.  
> Future phases may implement Focus, but may not reinterpret it.

---

**Next Phase:** Phase 9 — Persistence & Replay (Boundaries First)
