CONFUSION CONTRACT

AmplifyEd TrainerView — Tier-1 Signal (Authoritative)

This document defines what Confusion is, what it is not, how it behaves, and how it must be surfaced.
If implementation diverges from this document, the implementation is wrong.

1. Purpose

The Confusion system exists to surface where understanding may be breaking down, so a trainer can decide what to address next.

Confusion:

Guides attention

Preserves psychological safety

Supports real-time learning adjustment

Confusion does not:

Judge correctness

Diagnose causes

Evaluate participants

Replace trainer judgment

Assert failure

Confusion points to threads and moments, not answers.

2. Core Principles (Locked)

Psychological Safety First
Expressing confusion must feel safe, reversible, and worthwhile.

Agency Over State
Participants control their own confusion state.

Temporary by Nature
Confusion is expected to arise and resolve during learning.

Thread-Level Meaning
Trainer decisions are made at the thread or concept level.

Actionable, Not Diagnostic
Confusion says where to look, not what to say.

3. Scope & Definition
3.1 What Confusion Measures

Confusion is a thread-level signal representing possible misunderstanding related to the current instructional focus.

It may reflect:

Explicit self-reported confusion

Peer-affirmed uncertainty

Sustained hesitation patterns

It does not reflect:

Engagement level

Emotional tone

Discussion quality

Participation breadth

Alignment or drift

Those signals live elsewhere.

3.2 What Confusion Is Not

Confusion is not:

An assessment tool

A performance metric

A behavioral judgment

A permanent label

A silent background statistic

False positives are acceptable.
Silent failures are not.

4. Scored Unit

Unit of meaning: Thread / concept

Never scored: Individuals

The system may maintain ephemeral internal state to support aggregation, but individual confusion is never displayed, ranked, or preserved beyond active participation.

5. Confusion Lifecycle (Human-Centered)

Confusion follows a reversible lifecycle.

5.1 Self-Reported Confusion (Entry)

Participants may explicitly self-report confusion tied to a thread or concept.

This action represents:

A declaration of uncertainty

A request for clarification or pacing adjustment

Active participation, not disengagement

Self-reported confusion is:

Intentional

Temporally relevant

Psychologically significant

The system must treat this as a human signal, not passive telemetry.

5.2 Resolution (Exit)

A participant who previously self-reported confusion may later clear or uncheck that state when:

A trainer explanation resolves the issue

Another participant provides clarification

Understanding is regained through discussion or reflection

This action represents resolution, not negation.

Confusion must be allowed to enter and exit freely.

6. System Obligations (Behavioral)

When confusion is self-reported or resolved, the system must:

Respect participant agency over their confusion state

Allow confusion to be both asserted and cleared without penalty

Reflect resolution by reducing active confusion weight for the related thread

Avoid persisting confusion after a participant clears it

The system must not:

Treat confusion as sticky or permanent

Require trainer intervention to resolve confusion

Preserve individual confusion states beyond resolution

Silence or ignore explicit confusion signals

7. Trainer-Facing Meaning

For trainers, Confusion answers one question only:

“Which thread may need attention right now?”

It does not:

Explain why confusion exists

Suggest instructional fixes

Rank severity across people

Trainer judgment remains primary.

8. Visualization Contract (Authoritative)
8.1 Canonical Location (Primary)

Left Column → Participation / Signals Component

Confusion is surfaced at the thread level, alongside other Tier-1 signals.

Each row corresponds to a thread, not a message.

Wireframe (Conceptual)
TrainerView — Left Column
────────────────────────

Participation & Signals
────────────────────────

▸ Exit tickets vs formative checks
Participation:  █ █ █ █ ░ ░ ░ ░
Confusion:      ░ ░ ░ ░ ░ ░ ░ ░

▸ Assessment timing
Participation:  █ █ ░ ░ ░ ░ ░ ░
Confusion:      █ █ ░ ░ ░ ░ ░ ░

Rules

Visualized as presence / intensity, not numbers

No thresholds labeled as good or bad

No individual attribution

Threads are the unit of meaning

8.2 Optional Secondary Cue (Very Light)

TrainerView → Thread Header Only

A compressed, glance-only indicator.

Wireframe (Conceptual)
Thread: Assessment timing
[ Confusion ▓▓░░░░ ]

Rules

Appears once per thread

Low contrast

No animation

No numbers

Never interactive

Never inside message bubbles

This cue mirrors the canonical signal and introduces no new meaning.

9. Explicit Non-Goals (Hard No)

The following are forbidden:

❌ Confusion indicators on individual messages

❌ Per-participant confusion displays

❌ Timeline graphs inside message streams

❌ Heatmaps or density overlays

❌ “This person is confused” signaling

The message stream remains readability-first at all times.

10. Principle (Locked)

Confusion is not a failure state.
It is a temporary learning signal that participants may both assert and resolve.

Any design or behavior that:

Discourages self-reporting

Ignores resolution

Traps participants in confusion

Or hides confusion to avoid intervention

Violates this contract.