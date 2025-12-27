# Phase 3.4 — Cross-Pipeline Non-Interference Guarantees

## Purpose

This document defines **hard boundaries between pipelines** to prevent semantic bleed, override, or reinterpretation of signals.

Its goal is to ensure that:
- No pipeline explains another
- No pipeline suppresses another
- No pipeline retroactively reinterprets another

Signals may coexist.
They may not overrule.

---

## Core Principle

> **Pipelines may observe each other’s outputs, but may not modify, explain, or negate them.**

Each pipeline owns its own meaning.
No pipeline is allowed to “correct” another.

---

## Confusion Pipeline Guarantees

The Confusion pipeline:

- Emits signals indicating **possible breakdown of understanding**
- Tracks accumulation at the thread level
- Escalates visibility when shared confusion exists

It must never:
- Read Pulse state to validate confusion
- Read Emotion state to explain confusion
- Read Focus state to suppress confusion
- Be muted by other pipelines’ heuristics

Confusion stands on its own evidence.

---

## Pulse Pipeline Guarantees

The Pulse pipeline:

- Represents momentary self-reported engagement or status
- Aggregates room-level sentiment signals

It must never:
- Explain or validate confusion
- Reduce confusion visibility due to positive pulse
- Override confusion escalation due to “room health”

Pulse may coexist with confusion.
Pulse may not cancel it.

---

## Emotion Pipeline Guarantees

The Emotion pipeline:

- Performs pattern analysis and smoothing
- Operates on derived signals

It must never:
- Infer emotional cause for confusion
- Reclassify confusion as emotion
- Backfill meaning into confusion signals

Emotion is descriptive, not interpretive.

---

## Focus Pipeline Guarantees

The Focus pipeline:

- Indicates relevance to current instructional focus
- Helps prioritize attention

It must never:
- Suppress confusion visibility
- Downgrade confusion because a thread is “off focus”
- Prevent escalation once confusion is shared

Focus may reorder.
Focus may not silence.

---

## Message Pipeline Guarantees

The Message pipeline:

- Handles content flow and voting
- Tracks conversation structure

It must never:
- Aggregate confusion into message quality judgments
- Collapse confusion into vote counts
- Substitute popularity for understanding

Confusion is orthogonal to engagement.

---

## Trainer Pipeline Guarantees

The Trainer pipeline:

- Surfaces synthesized views
- Enables trainer actions

It must never:
- Auto-resolve confusion
- Dismiss confusion due to other signals
- Convert confusion into recommendations without trainer action

Trainer tools support judgment.
They do not replace it.

---

## UI-Level Non-Interference

At the UI layer:

- Confusion indicators must remain visible regardless of:
  - Pulse positivity
  - Focus changes
  - Emotion trends
- Combined views may display multiple signals simultaneously
- No composite score may erase a single signal’s obligation

Silence through aggregation is forbidden.

---

## Prohibited Interference Patterns

The following patterns are explicitly forbidden:

- “Pulse is high, so confusion is probably fine”
- “This is off-topic, so confusion doesn’t matter”
- “Emotion trend suggests frustration, so confusion explains itself”
- “Votes are positive, so confusion can be ignored”

These are semantic violations.

---

## Failure Conditions (System Bugs)

Any of the following constitute a system failure:

- Confusion visibility reduced due to another pipeline
- Confusion escalation blocked by focus or engagement
- One pipeline mutating another’s state
- Composite metrics suppressing individual signals

These failures must be treated as regressions.

---

## Relationship to Phase 3

- Phase 3.1 defines **when confusion must escalate**
- Phase 3.2 defines **how escalation becomes visible**
- Phase 3.3 defines **what the UI may not claim**
- Phase 3.4 defines **what other pipelines may not do**

All four are required for signal integrity.

---

## Phase Status

- Phase 3.4 locks cross-pipeline boundaries
- No implementation details are specified
- Any future pipeline interaction must respect these guarantees

---

_End of Phase 3.4_
