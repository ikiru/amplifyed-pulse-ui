# AMPLIFYED PULSE UI

Front-End Interface for the AmplifyEd Platform

---

## OVERVIEW

AmplifyEd Pulse UI is the trainer-facing interface for the AmplifyEd platform, designed to **surface emotional signals and insights in a psychologically safe, read-only manner**.

This UI focuses on **observation, interpretation, and clarity** — not control, recommendation, or adaptation.

The system intentionally preserves trainer agency by ensuring that nothing reacts, adapts, or intervenes without explicit intent.

---

## DOCUMENTATION

Docs currently live in a few places (root phase/governance files, `docs/`, and `server/contracts/`).
To avoid “drifted docs accidentally read as truth”, start here:

📄 See `docs/README.md`

---

## CORE PRINCIPLES (LOCKED)

AmplifyEd Pulse UI is built on the following non-negotiable principles:

* Psychological safety over automation
* Trainer-first design
* Predictable, non-reactive behavior
* Clear separation between observation and response
* Stability over features
* Minimal, intentional UI surface area

These principles are enforced throughout Phase 3 and beyond.

---

## WHAT THIS UI DOES

The Pulse UI provides:

* Real-time visualization of participant pulse signals
* Emotional state displays and moment snapshots
* Trainer-facing insight surfacing (**pull-only**)
* Calm, readable facilitator views
* Transparent, non-prescriptive signal interpretation

The UI is **read-only** and **trainer-controlled**.

---

## WHAT THIS UI DOES NOT DO

The Pulse UI explicitly does **not** include:

* Recommendations or suggested actions
* Automated alerts or nudges
* Insight prioritization or ranking
* Adaptive behavior
* Trainer feedback loops
* Cross-session learning
* Inference or decision-making logic

Any feature requiring the above belongs to **future phases** and is intentionally excluded here.

---

## PHASE STATUS

**Phase 3 is complete and closed.**

Phase 3 establishes:

* Emotional interpretation pipelines
* Insight generation (server-side)
* Trainer-controlled, pull-only insight surfacing
* Calm, trustworthy consumption surfaces

Phase 3 behavior is **locked** and must not be extended.

📄 See `PHASE_3_CLOSURE.md` for authoritative Phase 3 contracts and boundaries.

---

## TECH STACK

* React 18
* Vite
* Socket.io Client
* ES Modules

The UI avoids unnecessary abstractions and remains intentionally direct and inspectable.

---

## PROJECT STRUCTURE

```text
/
├── src/
│   ├── components/
│   ├── pages/
│   ├── hooks/
│   ├── state/
│   ├── utils/
│   └── socket/
├── server/          (local dev backend; optional but supported)
├── docs/
├── testing/
├── dist/            (build output)
├── scripts/
├── PHASE_3_CLOSURE.md
├── index.html
├── package.json
└── vite.config.js
```

This structure is designed to remain stable across phases.

---

## GETTING STARTED

Install dependencies:

```bash
npm install
```

Start development server:

```bash
npm run dev
```

Open in browser:

```text
http://localhost:5173/
```

---

## BACKEND INTEGRATION

The UI connects to the backend via **Socket.IO**.

In development, the client connects to the current origin and Vite proxies Socket.IO:

```text
Vite dev server (UI):  http://localhost:5173
Socket.IO proxy path:  /socket.io  →  http://localhost:3000
Backend (default):     http://localhost:3000  (set PORT to override)
```

If the backend is unavailable, the UI may display connection warnings.
This is expected during UI-only or inspection-focused work.

Backend logic lives separately and is governed by its own phase contracts.

---

## PROJECT INTENT

This project exists to:

* Preserve trust between trainers and the system
* Make emotional signals understandable without judgment
* Provide a stable foundation for future adaptive phases
* Avoid premature intelligence or automation

Observation comes first.
Response comes later — with guardrails.

---

## LICENSE

Private / All rights reserved.

---

*End of README*
