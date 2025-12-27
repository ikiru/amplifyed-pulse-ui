Authority Audit Closure

## Purpose

This document formally closes Phase 2 (Naming & Authority Restoration) by recording the **pipeline authority invariant** that now governs the system, the domains corrected, and the assumptions tooling (including Codex) must make going forward.

This is not a refactor proposal.
This is not a naming rewrite.
This is a statement of restored reality.

---

## Core Invariant (Now Enforced)

**All socket events route through a single, canonical pipeline per domain.**

The authority chain is:

eventRouter → pipeline → helpers

markdown
Copy code

Rules:

- `eventRouter.js` **must never** import helper modules directly.
- Each domain exposes **exactly one routing surface**: its pipeline.
- Helper files (`*.handle*.js`, `*.broadcast.js`, etc.) are **implementation details**, not entrypoints.
- Pipelines may delegate internally to helpers.
- Helpers may never register socket events.

This invariant is now consistently enforced across the system.

---

## Domains Audited and Restored

### Trainer
- **Before:** Router wired directly to `trainer.handleCommand.js` and `trainer.handleNudge.js`
- **After:** Router delegates exclusively to `trainerPipeline`
- **Result:** Helpers demoted; pipeline restored as sole authority

### Message
- **Before:** Router wired `message:vote:intent` directly to `message.vote.handle.js`
- **After:** Router delegates to `messagePipeline.handleVoteIntent`
- **Result:** Vote handling now flows through the canonical pipeline

### Focus
- **Before:** Router wired directly to `focus.handleSet.js` and `focus.handleClear.js`; pipeline unused
- **After:** Router delegates exclusively to `focusPipeline`
- **Result:** Focus pipeline reinstated as authority without activating dormant logic

### Other Domains (Verified Clean)
- Pulse
- Confusion
- Session
- Safety
- Moment
- Emotion (via moment, not router)

These domains already respected the invariant and required no changes.

---

## Naming Implications (Clarified, Not Changed)

- Files named `*.handle*.js` are **helpers**, not entrypoints.
- The presence of `handleX` in a filename **does not imply routing authority**.
- Pipeline files (`*Pipeline.js`) are the only router-facing surfaces.
- Naming reflects *role*, not *authority*; authority is defined by wiring.

This resolves prior ambiguity where helpers appeared canonical due to router imports.

---

## Tooling Assumptions (Explicit)

Going forward, tools (including Codex) must assume:

- Pipelines are the only valid routing surfaces.
- Helpers are never safe to wire directly to the router.
- If a helper appears to be an entrypoint, that is a bug.
- Restoring authority means **rewiring**, not refactoring logic.

Any future change that violates this invariant is a regression.

---

## Phase Status

- **Phase 2 — COMPLETE**
- Authority is consistent.
- Naming aligns with wiring.
- No behavior changes were introduced.

Future phases may build on this foundation, but this invariant is now fixed.

---

_End of Phase 2.8_