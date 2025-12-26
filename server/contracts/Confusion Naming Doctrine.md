# Phase 2.2 — Confusion Naming Doctrine
*(Intent, not enforcement)*

This document records the **explicit naming decisions** for the Confusion domain in AmplifyEd.  
It does not mandate renames, code changes, or lint rules.  
Its purpose is to make **implicit architecture legible** and to guide future work without fossilizing early patterns.

---

## 1. Domain Authority

### Canonical Entry Point
- **`confusionPipeline.js`** is the **single canonical entrypoint** for the Confusion domain.
- All external confusion-related signals conceptually enter the system **through the pipeline**.
- Other modules in the domain are **internal helpers**, regardless of export visibility.

**Authority flow (conceptual):**

Router
→ Confusion Pipeline
→ Ingress Handlers
→ Helpers
→ State / Broadcast

yaml
Copy code

This establishes a single “door” into the Confusion system for safety, auditability, and explainability.

---

## 2. Handler Semantics

### Meaning of `handleX` in Confusion
- Functions named `handleX` (e.g. `handleConfusionSignal`) are defined as **ingress coordinators**.
- They may:
  - accept external input
  - validate payloads
  - dedupe contributors
  - route to helpers
  - trigger state mutation and broadcast
- They are **not defined as pure mutators**.

Mutation may occur during handling, but mutation is not the semantic meaning of `handleX`.

---

## 3. Signal Grammar

### Unified Signal Identity
- Confusion uses a **single unified ingress signal**:

confusion:signal

markdown
Copy code

- Differences in origin (e.g. self-report vs passive detection) are encoded in the **payload**, not the signal name.

**Rationale:**
- Confusion is a **low-authority signal**.
- Source affects *handling*, not *identity*.
- Maintaining a single semantic door preserves simplicity and avoids premature semantic hardening.

---

## 4. State Naming & Scope

### Canonical State Store
- The canonical in-memory store is named **`confusionState`**.

### Scope Encoding
- Scope (thread-level, session-level) is defined by:
  - data structure
  - access patterns
  - containment within the pipeline
- Scope is **not encoded in the variable name**.

This allows internal scope evolution without forcing renames or semantic drift.

---

## 5. UI Naming Authority

### Trainer-Facing Metaphors
- Trainer-facing UI components may use **metaphorical names** such as:
  - `ConfusionMeter`
  - `ConfusionFootprint`

### Guardrails
UI naming **must not**:
- assert correctness or incorrectness
- diagnose understanding
- imply emotional state
- claim truth or failure

UI names describe **what is surfaced to the trainer**, not what is objectively true.

Semantic authority remains in the pipeline, not the UI.

---

## 6. Relationship to Lint and Enforcement

- This doctrine **does not introduce enforcement**.
- ESLint rules continue to define:
  - forbidden history
  - boundary violations
- This document defines **intent**, not law.

Future enforcement, if any, must be:
- domain-specific
- incremental
- justified by observed drift or maintenance cost.

---

## 7. Status

- **Phase:** 2.2  
- **Domain:** Confusion only  
- **Scope:** Naming intent  
- **Code changes:** None  
- **Lint changes:** None  

This doctrine may be revised as the Confusion domain evolves.
