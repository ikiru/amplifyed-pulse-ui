Confusion UI Contract

TrainerView — UI Surface Only

Version v1.1

Revision: Clarifies that the left-column Confusion section persists while entries appear only when confusion exists; no behavioral change.

1. Purpose

This contract defines how confusion is surfaced to a human trainer within the TrainerView user interface.

It governs presentation, placement, and interaction boundaries only.

This contract does not define how confusion is detected, scored, escalated, resolved, or persisted. Those behaviors are governed by existing Confusion pipeline contracts.

2. Scope

Applies only to:

TrainerView.jsx

Does not apply to:

AudienceView

LiveView (projected view)

Backend pipelines

Signal computation

Threshold logic

Escalation rules

This contract is UI-only.

3. Authority & Precedence

This contract is subordinate to all existing Confusion contracts

In the event of conflict:

Confusion pipeline contracts take precedence over this document

This contract may not reinterpret or override confusion semantics

4. Unit of Meaning

Confusion is represented only at the thread level

Confusion is never:

message-level

reply-level

participant-level

UI must never imply:

“this message is confusing”

“this person is confused”

Confusion represents aggregate uncertainty around a thread’s topic, not individual expression.

5. Confusion Meter Placement

Confusion meters:

do not appear inside message cards

do not appear inline with threads

do not appear in replies

Confusion meters appear only inside a dedicated Confusion section in the left column of TrainerView

This rule is strict.

6. Confusion Section (Left Column)

TrainerView includes a dedicated Confusion section in the left column.

6.1 Visibility

The Confusion section is always present as an ambient observational surface.

Confusion entries appear only when confusion exists.

It remains visible regardless of message scrolling

Note: The persistent container keeps the trainer’s context stable and avoids implying that the absence of entries is a resolved state.

6.2 Contents

Each item in the Confusion section represents one thread and includes:

a non-numeric confusion meter

a preview of the thread’s anchor (top-level) message

6.3 Interaction

Selecting a Confusion item:

navigates the trainer to the associated thread in the message pane

Selection does not:

reorder messages

collapse or expand threads

resolve confusion

mark the thread as active

Navigation is assistive only.

7. Ordering Rules

Items within the Confusion section may be ordered by:

relative confusion accumulation (highest first)

This ordering:

applies only within the Confusion section

does not affect message or thread ordering elsewhere

does not imply urgency, priority, or severity

8. Message Stream Indicators

Threads may indicate the presence of confusion

This indicator:

is non-metric

is binary (present / not present)

does not quantify confusion

does not explain cause

The indicator exists for orientation only

The specific visual form of this indicator is intentionally unspecified.

9. Resolution Effects

When confusion clears for a thread:

its Confusion section item disappears

its message-stream indicator disappears

If confusion reappears:

both reappear

The UI does not display historical confusion states.

10. Non-Goals

The Confusion UI does not:

rank threads globally

auto-sort the message stream

pin threads

collapse or expand threads

explain confusion

suggest actions

judge correctness or performance

replace trainer judgment

11. Thread Collapse Independence

Confusion visibility and navigation are independent of thread collapse or expansion state.

A thread may be collapsed or expanded without affecting:

its presence in the Confusion section

its eligibility to surface confusion

Collapsing a thread does not resolve, suppress, or hide confusion

Expanding a thread does not introduce or amplify confusion

Thread collapse is a purely navigational affordance and carries no semantic meaning.

12. Multi-Thread Confusion Coexistence

Multiple threads may simultaneously surface confusion

No thread is implicitly treated as:

primary

active

most important

Ordering within the Confusion section does not establish priority or required action

Confusion signals are parallel, not queued.

13. Intentional Omissions

This contract intentionally does not specify:

colors

iconography

pixel dimensions

animation

labels or copy

audience-facing behavior

LiveView behavior

These decisions belong to design and implementation documents, not contracts.

14. Design Philosophy (Non-Normative)

The Confusion UI is designed to:

preserve psychological safety

avoid semantic bleed

prevent misattribution

remain readable in large rooms

support human judgment rather than replace it
