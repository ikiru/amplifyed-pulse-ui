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