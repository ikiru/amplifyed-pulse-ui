# Pipeline Authority — Audit Frame
*(Restoration-oriented, read-only)*

This document defines the **intended structural model** of pipeline authority in the system.
It exists to support a **read-only audit** of drift and violations.
It does not introduce new rules, rename files, or enforce changes.

This structure predates recent drift and is recorded here to enable accurate comparison.

---

## 1. Core Architectural Invariant

Each domain pipeline has **exactly one authoritative entrypoint**.

That entrypoint is responsible for:
- accepting external signals
- coordinating internal handlers
- owning routing decisions
- mediating access to state and broadcast

All other modules within the pipeline are **internal helpers**.

This invariant applies uniformly across all pipelines.

---

## 2. Canonical Pipeline Shape

For a given domain `<domain>`, the canonical structure is:

server/pipelines/<domain>/
<domain>Pipeline.js ← canonical entrypoint
<domain>.state.js ← internal state store
<domain>.broadcast.js ← internal broadcast helper
<domain>.handle*.js ← internal ingress helpers
<domain>.*.js ← internal domain helpers

yaml
Copy code

Only `<domain>Pipeline.js` is conceptually public.

---

## 3. Authority Flow (Conceptual)

Router
→ <domain>Pipeline
→ ingress handlers (handle*)
→ helpers
→ state mutation
→ broadcast

yaml
Copy code

No other file is intended to:
- accept router-level signals directly
- act as a peer entrypoint
- coordinate cross-domain behavior

---

## 4. Definition of “Internal Helper”

A file is considered an **internal helper** if it:
- lives under `server/pipelines/<domain>/`
- is not named `<domain>Pipeline.js`
- supports the pipeline rather than defining domain boundaries

Internal helpers may:
- export functions
- contain complex logic
- mutate state when called

Internal helpers may **not**:
- be treated as authoritative entrypoints
- be invoked directly by the router
- bypass the pipeline in normal operation

---

## 5. What Constitutes Drift (Audit Criteria)

During audit, the following are considered **potential violations** of pipeline authority:

- Router calling a helper directly instead of the pipeline
- External modules importing helpers instead of the pipeline
- Helpers coordinating routing or broadcast independently
- Multiple files behaving as de facto entrypoints
- Ambiguous naming that plausibly elevates helpers to entrypoints
- Tooling (e.g., Codex) modifying helpers as if they were public APIs

These are **observations**, not automatic errors.

---

## 6. What Is *Not* Considered Drift

The following are explicitly **not violations**:

- Helpers mutating state when invoked by the pipeline
- Multiple helpers sharing similar names (e.g., `handleX`)
- Historical artifacts that are unused but present
- Temporary deviations introduced for experimentation
- Naming that is ambiguous but behaviorally correct

Intent and behavior matter more than aesthetics.

---

## 7. Audit Constraints

This frame supports a **read-only audit only**.

During Phase 2.3:
- No code changes
- No renames
- No comments added
- No lint changes
- No refactors
- No “fixes”

The goal is **truthful diagnosis**, not cleanup.

---

## 8. Outcome of Audit (Deferred)

This document does not prescribe outcomes.

Possible future actions (not part of audit):
- Restore invariant where violated
- Clarify intent where ambiguous
- Tolerate harmless drift
- Defer changes intentionally

Those decisions occur **after** audit, with evidence.

---

## 9. Status

- Phase: 2.3 (Audit Preparation)
- Scope: System-wide
- Nature: Restorative, not evolutionary
- Enforcement: None

# Pipeline Contract Addendum — Self-Report Signal Coexistence  
**Applies to: Confusion & Audience Drift**  
**Status: Binding**

---

## 1. Purpose

This addendum defines how **multiple self-reported audience states** may coexist within the same pipeline **without semantic coupling or behavioral bleed**.

It exists to preserve:
- psychological safety
- system independence
- interpretive clarity

---

## 2. Core Principle

> **Self-report signals may share transport, but never meaning.**

The pipeline is a **carrier**, not an interpreter.

---

## 3. Allowed Architecture

The system may use a **single self-report pipeline** to transport multiple self-reported states, provided all invariants below are enforced.

Sharing is allowed only at the **transport layer**.

---

## 4. Signal Explicitness (Required)

Every self-report event MUST include an explicit declared type.

Canonical types include (but are not limited to):

- `confusion`
- `off_focus`

No default type is permitted.  
No inference is permitted.

If a type is missing or unrecognized, the event MUST be ignored.

---

## 5. No Semantic Translation (Non-Negotiable)

The following are explicitly forbidden:

- Treating confusion as evidence of off-focus
- Treating off-focus as evidence of confusion
- Deriving one signal from the other
- Using one signal as fallback, proxy, or approximation for the other

Signals are **orthogonal** by contract.

---

## 6. Fan-Out Delivery Model

Upon receipt, self-report events MUST fan out to interested subsystems.

Conceptually:

self-report event
|
+--> confusion subsystem (type == confusion)
|
+--> audience drift subsystem (type == off_focus)

yaml
Copy code

No shared conditionals.  
No shared counters.  
No shared state mutation.

Each subsystem evaluates **only** the signals it explicitly recognizes.

---

## 7. Authority Scope

Self-report signals are authoritative **only within the subsystem that consumes them**.

- Confusion trusts confusion self-reports
- Audience Drift trusts off-focus self-reports

No subsystem may:
- inspect another subsystem’s conclusions
- reference another subsystem’s derived state

---

## 8. Downstream Isolation

Even when multiple self-reports occur on the **same message**:

- Confusion affects only confusion-related outputs
- Audience Drift affects only drift aggregation

No UI, metric, or behavior may combine, correlate, or cross-reference these signals.

Any feature that requires combined interpretation constitutes a **new system** and requires a new contract.

---

## 9. Psychological Safety Guarantee

The system guarantees that:

- Self-reports express **only what the audience explicitly declares**
- No hidden interpretation or escalation occurs
- No participant is labeled, tracked, or inferred beyond the declared signal

---

## 10. Violation Clause

If any implementation:
- infers meaning across self-report types
- merges downstream effects
- allows one signal to influence another

Then the pipeline is considered **out of contract**, and dependent features must be disabled.

---

**End of Pipeline Contract Addendum**z