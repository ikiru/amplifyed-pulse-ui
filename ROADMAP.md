# AmplifyEd — Project Roadmap & Build State (Authoritative)

> **Purpose of this document**  
> This roadmap exists to prevent state drift between *what is designed*, *what is scaffolded*, and *what is actually working*.  
> If reality and this document diverge, reality wins and this document must be updated.

---

## Project Overview

**AmplifyEd** is a real-time, safety-first professional development platform.

Its core function is to:
- Collect live audience signals during sessions
- Route them through disciplined server pipelines
- Surface them to a trainer in a psychologically safe way
- Preserve human agency and trainer authority
- Avoid surveillance, profiling, prediction, or post-hoc judgment

This is a **live session operating system**, not an analytics platform.

---

## Project History (Completed Phases)

### Phase 0–1 — Foundations & Layout (COMPLETE)
- Project structure established
- Client/server split defined
- Routing between TrainerView and AudienceInput established
- Initial UI shells created
- No signal intelligence

**Outcome:** A navigable app with clear separation of concerns.

---

### Phase 2 — Pulse Pipeline Stabilization (COMPLETE)
- Pulse pipeline implemented end-to-end
- Live pulse votes flow from audience → server → trainer
- Socket architecture unified
- Event routing stabilized
- Pulse rendering proven live

**Outcome:** One fully working, real-time signal pipeline.

---

### Phase 3 — Emotional Engine (COMPLETE & CLOSED)
- Emotional processing explored and bounded
- Emotional normalization and envelopes defined
- Emotional overreach explicitly prevented
- Emotional engine closed with constraints

**Outcome:** Emotional signals exist conceptually but are constrained to prevent misuse.

---

### Phase 4 — Governance (COMPLETE & LOCKED)
- Safety, voice, and authority rules formalized
- Trainer authority preserved
- System limits explicitly defined
- No surveillance or scoring allowed

**Outcome:** Guardrails are fixed and immutable.

---

### Phase 5 — Discovery & Stewardship (COMPLETE & LOCKED)
- Explored how signals should age, persist, or dissolve
- Defined human signal stewardship
- Explicitly rejected prediction, profiling, and memory misuse
- Governance finalized and locked

**Outcome:** Long-term restraint defined. No build work authorized in Phase 5.

---

## Current Build State (Ground Truth)

### Fully Working
- Pulse pipeline (end-to-end)
- Socket infrastructure
- Server pipeline framework
- TrainerView shell
- AudienceInput shell
- Governance documentation

### Scaffolded Only (NOT FUNCTIONAL YET)
- Message pipeline
- Focus pipeline
- Moment lifecycle
- Trainer insights

These exist as:
- Files
- Placeholders
- UI sections

They **do not yet emit or render live data**.

---

## Phase 6 — Pipeline Activation (AUTHORIZED BUILD PHASE)

**Goal:**  
Make non-pulse pipelines *real* for the first time.

### In Scope
- **Messages**
  - AudienceInput → server → TrainerView
  - Plain delivery
  - No intelligence
- **Moment Lifecycle**
  - Start / hold / release
  - Trainer-initiated
  - Context container only
- **Focus (Minimal)**
  - Low-resolution live signal
  - No scoring, no history
- **TrainerView**
  - Live rendering replaces placeholder states

### Out of Scope
- Automation
- Optimization
- Scoring
- Trend analysis
- Prediction

### Phase 6 Done When
- Messages flow live
- Moments can be created and released
- Focus visibly changes state
- No placeholder text remains during an active session

---

## Phase 7 — Stability & Session Lifecycle

**Goal:**  
Make activated pipelines survive real-world use.

### In Scope
- Reconnect handling
- Session start / end semantics
- Silence as a valid state
- Pipeline coexistence
- Failure transparency

### Out of Scope
- New signals
- UX redesign
- Analytics

### Phase 7 Done When
- Sessions can run repeatedly without corruption
- Reconnects are safe
- Live demos run without explanation

---

## Phase 8 — Live Session UX & Trust Hardening (DESIGN COMPLETE)

**Goal:**  
Ensure live UX creates safety, not pressure.

### Covered
- Session access UX (join code + QR)
- Audience re-entry continuity
- Trainer reboot recovery
- Required participation posture (silent allowed)
- No “waiting” or narrative pressure
- Visual neutrality
- Cognitive load minimization

**Outcome:**  
Live session UX contracts are complete and locked.

---
## Phase 8.5 — Human-in-the-Loop Testing System Design (DEFERRED)

**Goal:**  
Design a non-production testing mechanism that simulates live session conditions in order to evaluate how trainers perceive, interpret, and act on real-time room signals under cognitive load.

**Scope:**  
- Design of the testing environment only (no execution)
- Focus on human comprehension, situational awareness, and misread risk
- Stress-testing trainer perception, not signal accuracy

**Constraints:**  
- No impact on production UX or pipelines  
- No interpretation or recommendation logic  
- No persistence, replay, or organizational reporting  

**Status:**  
Design explicitly deferred until Phase 8 UX semantics are stable and exercised.

## Phase 9 — Replay, Persistence & Memory Limits (DESIGN COMPLETE)

**Goal:**  
Define what the system may remember and what it must forget.

### Covered
- Replay posture
- Non-persistable data list
- Safety exception memory
- Trainer replay limits

**Outcome:**  
Memory is bounded before any persistence is built.

---

## Phase 10 — Interpretation Limits (DESIGN COMPLETE)

**Goal:**  
Prevent post-hoc meaning extraction.

### Covered
- Organizational interpretation limits
- Non-transferability of meaning
- Ban on summaries, conclusions, and evaluations

**Outcome:**  
The system refuses to explain itself.

---

## Phase 11 — UX Translation & Build Rules (DESIGN COMPLETE)

**Goal:**  
Translate contracts into concrete UX rules.

### Covered
- AudienceInput UX rules
- TrainerView UX rules
- Copy lock & blacklist
- Failure and edge-state handling
- Silent collapse rules
- Visual neutrality audits
- Cognitive load audits

**Outcome:**  
UX is build-ready without interpretive drift.

---

## Phase 12 — Evidence, Safety & Forensic Capture (DESIGN COMPLETE)

**Goal:**  
Ensure safety events can be reviewed without surveillance or narrative.

### Covered
- Evidence schema & retention limits
- Incident reconstruction rules
- Post-session evidence access UX
- Misuse prevention safeguards
- Legal survivability across jurisdictions

**Outcome:**  
The system can survive scrutiny without betraying trust.

---

## Phase 13 — External Communication & Claim Discipline (DESIGN COMPLETE)

**Goal:**  
Prevent marketing, sales, or documentation from overselling power.

### Covered
- Allowed and banned claims
- Demo constraints
- Sales refusal language
- Documentation tone rules

**Outcome:**  
The external story cannot contradict the internal truth.

---

## Phase 14 — Build Authorization & Drift Prevention (ACTIVE)

**Goal:**  
Allow engineering velocity without ethical regression.

### Rules
- Build only against locked contracts
- Refusal must exist before features
- Screenshot safety test applies globally
- Silence is always valid
- Any team member may halt drift

**Outcome:**  
Implementation may proceed safely.

---

## Phase Discipline Rules (Global)

- Pipelines activate before they optimize
- UX refuses before it explains
- Memory is bounded before persistence
- No phase introduces new intelligence
- If something feels “smart,” it is probably drift
- Quiet reliability is success

---

## Roadmap Summary

- **Phase 0–5:** Foundations, governance, restraint (complete)
- **Phase 6–7:** Make pipelines real and stable
- **Phase 8–11:** Lock live UX and interpretation limits
- **Phase 12–13:** Bound memory and external narrative
- **Phase 14:** Authorized implementation with drift guards
