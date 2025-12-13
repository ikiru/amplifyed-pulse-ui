# AmplifyEd — Project Roadmap & Build State (Authoritative)

> **Purpose of this document**  
> This roadmap exists to prevent state drift between *what is designed*, *what is scaffolded*, and *what is actually working*.  
> If reality and this document diverge, reality wins and this document must be updated.

---

## Project Overview

**AmplifyEd** is a real-time, safety-first professional development platform for educators.

Its core function is to:
- Collect live participant signals during training sessions
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

## Phase 6 — Pipeline Activation (NEXT BUILD PHASE)

**Goal:**  
Make non-pulse pipelines *real* for the first time.

This phase activates functionality that has only been scaffolded so far.

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
  - Live rendering replaces “waiting” states

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

## Phase 8 — Adoption & Trust Hardening

**Goal:**  
Make AmplifyEd safe to hand to real trainers and organizations.

### In Scope
- Clear explanations of signal behavior
- Clear explanations of system limits
- Adoption-safe defaults
- Trainer confidence UX
- Participant expectation clarity

### Out of Scope
- Scaling
- Monetization
- Admin dashboards
- Optimization tooling

### Phase 8 Done When
- Trainers are not anxious using it
- Organizations do not fear surveillance
- Participants understand boundaries
- You can walk away from a pilot session

---

## Phase Discipline Rules

- Pipelines are activated before optimized
- No phase introduces new intelligence
- No phase assumes work from a later phase
- If something feels “smart,” it is probably drift
- Quiet, boring reliability is success

---

## Roadmap Summary

- **Phase 0–5:** Foundation, safety, and restraint (complete)
- **Phase 6:** Make messages, focus, and moments real
- **Phase 7:** Make them stable
- **Phase 8:** Make them trustworthy to adopt
