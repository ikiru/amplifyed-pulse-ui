# Status: Canonical
# Owner: TBD
# Last reviewed: 2026-01-18

# Testing Environments

This project supports multiple **testing environments**, each designed to explore a different class of system behavior under controlled conditions.

A testing environment is **not** a test suite, a QA harness, or a debug mode.

It is a **purpose-built world** with:

* A clearly defined scope
* Explicit interaction boundaries
* A written contract governing what is allowed and forbidden
* Isolation from production assumptions

Each environment exists to surface **truth under specific kinds of stress**, not to prove correctness.

---

## TL;DR (Guarantees)

- Testing environments are **purpose-built worlds**, not “debug mode”.
- Each environment has a **binding contract** with explicit allowed/forbidden boundaries.
- Environments must remain **isolatable and removable** without weakening production guarantees.
- If a test need violates an environment’s contract, that implies **a new environment**, not a shortcut.

## Why Testing Environments Exist

Complex systems fail in different ways depending on *who* is under stress.

Some failures emerge when:

* Humans are overwhelmed
* Meaning collapses
* Attention fragments
* Timing breaks cognition

Other failures emerge when:

* Machines are saturated
* Queues overflow
* Throughput collapses
* Latency compounds

These failure modes **must not be tested in the same environment**.

Blending them creates false confidence and invalid conclusions.

Testing environments enforce separation.

---

## Core Principles (Applies to All Environments)

Every testing environment must:

1. Have a **written contract**
2. Declare what it tests — and what it explicitly does not
3. Define **allowed interaction boundaries**
4. Forbid behaviors that would invalidate results
5. Remain removable without impacting production systems

No testing environment may weaken or bypass the guarantees of another.

---

## Environment Contracts

Each testing environment is governed by its own contract document.

Contracts define:

* Purpose
* Scope
* Ingress rules
* Forbidden behaviors
* Deferred concerns

Contracts are not guidelines.
They are **binding constraints**.

---

## Current Environments

### Human Interaction Stress Testing Environment (HISTE)

**Purpose**
To test **human interaction stress**, not machine overload.

HISTE simulates realistic, time-based audience participation to observe:

* Whether audiences can parse incoming information
* Whether trainers can perceive and prioritize signals
* Where meaning collapses under conversational pressure

**Key Constraint**
HISTE may interact with the system **only as a real audience member would**, via the AudienceInput experience.
No privileged or internal interaction paths are permitted.

📄 Contract
`server/contracts/Human Interaction Stress Testing Environment (HISTE).md`

---

## Implementation Pointers (Code)

**Canonical doc:**
- This doc: `docs/testing-environments.md`

**HISTE implementation:**
- Environment root: `testing/environments/histe/`
- Contracts: `testing/environments/histe/contracts/`
- Engine + actors: `testing/environments/histe/engine/`, `testing/environments/histe/actors/`

**Key integration constraint (enforced by design):**
- HISTE interacts only through public socket events (e.g. `session:join`, `message:audience`, `focus:set`, `focus:clear`)—no privileged pipeline entrypoints.

## Future Environments (Planned, Not Implemented)

The following environments are intentionally deferred and will each require their own contract:

* Machine Stress Testing
  (throughput, saturation, performance collapse)

* UX Validation & Replay
  (tool effectiveness, UI comparison, reflection)

* Security & Abuse Simulation
  (malicious behavior, boundary testing)

* Accessibility Stress Testing
  (cognitive, visual, interaction constraints)

Each will be created **only when needed**, and only with an explicit scope contract.

---

## Structural Intent (Even If It Does Not Exist Yet)

This README assumes the following future structure:

```
/docs
  /testing
    README.md
    /environments
      /histe
        Human Interaction Stress Testing Environment (HISTE).md
      /machine-stress
      /ux-validation
```

This structure is **aspirational by design**.

Folders may not exist yet.
The contract defines where they *should* exist.

---

## One Non-Negotiable Rule

> If a testing need violates the contract of an existing environment,
> it requires a **new testing environment**, not a shortcut.

This rule protects the integrity of all findings.

---

## Final Note

Testing environments are not about catching bugs.

They are about **revealing failure modes that would otherwise remain invisible**.

This document establishes the boundary.
