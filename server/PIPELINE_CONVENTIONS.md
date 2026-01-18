AmplifyEd Server Architecture — Naming, Structure, and Anti-Drift Rules

This document defines the structural, naming, and routing conventions for all server-side pipelines in AmplifyEd.

It complements PIPELINES.md, which defines behavioral boundaries and domain responsibilities.

Together, these two files form the architectural contract of AmplifyEd.

1. Directory Structure (Canonical)

All live pipeline code must exist under:

server/pipelines/<domain>/


Valid domains:

pulse

safety

emotion

message

session

trainer

focus

moment

1.1 Forbidden or Legacy Directories

These directories are non-canonical and must never be imported from:

server/pulse/*
server/emotion/*
server/safety/*
archive/*
archive/emotional_engine/*
server/_legacy_*


Legacy directories may contain thin wrappers, but no business logic.

2. File Naming Conventions

AmplifyEd follows a strict filename pattern for consistency and drift prevention.

2.1 Allowed Filename Patterns

Each pipeline may contain:

<pipeline>.state.js
<pipeline>.broadcast.js
<pipeline>.handle<Something>.js
<pipeline>.config.js
<pipeline>.engine.js
<pipeline>.format.js
<pipeline>.signalExtractor.js
<pipeline>Pipeline.js     (required entrypoint)


Examples:

pulse.state.js
pulse.validate.js
pulse.broadcast.js
pulsePipeline.js

2.2 Special Case: Moment Pipeline

The moment pipeline integrates multiple domains and uses specialized components:

moment.builder.js
moment.envelope.js
momentPipeline.js


CamelCase filenames such as momentBuilder.js are prohibited.

2.3 File Naming Rules

Filenames must be lowercase, except the Pipeline.js suffix.

No snake_case.

No index.js inside pipeline folders.

Each domain must define exactly one `{domain}Pipeline.js` entrypoint.


3. Event Naming Conventions

## 3. Event Naming Conventions (As-Built + Best Practice)

This repo currently contains a mix of event naming styles. Because we are in **Option B (as-built is truth)**, the conventions below distinguish:

- **As-built allowed patterns** (what exists and works today)
- **Preferred patterns** (what we should use going forward)
- **Aspirational tightening** (what we can enforce later, after migrations)

### 3.1 As-built allowed patterns (current reality)

The router and pipelines currently use:

- **Colon namespaced**: `session:join`, `message:audience`, `trainer:action`
- **Multi-segment namespaces**: `trainer:scroll:to:thread`, `focus:trainer:state`
- **Dot-delimited legacy broadcasts**: `message.state.update`, `message.vote.update`
- **Underscore tokens in actions**: `focus:reset_default`, `obs:status_changed`, `obs:capture:not_supported`

### 3.2 Preferred pattern for new events

For new events, prefer:

- **namespaced with colons** (human readable, easy to grep): `namespace:action[:subaction...]`
- avoid dots and underscores in new names unless there is a compatibility reason

### 3.3 Canonical inbound event surface (router)

`server/routers/eventRouter.js` is the canonical list of inbound events. As of this audit, it registers:

- `audience:pulse`
- `session:join`, `session:leave`, `session:reconnect`, `session:request_metadata`
- `focus:set`, `focus:clear`, `focus:entry:add`, `focus:activate`, `focus:reset_default`, `focus:edit_in_place`, `focus:revise_by_new`, `focus:reorder`
- `message:audience`, `message:trainerReply`, `message:vote:intent`
- `confusion:signal`, `confusion:clear`, `trainer:resolve_confusion`
- `trainer:action`, `trainer:command`, `trainer:nudge`, `trainer:scroll:to:thread`
- `obs:capture:request`, `obs:capture:started`, `obs:capture:stopped`, `obs:capture:interrupted`, `obs:capture:permission_denied`, `obs:capture:not_supported`, `obs:capture:error`
- `self-report:signal`
- `message.state.update` and `audience:drift:update` (**debug passthrough; non-prod only**)

### 3.4 Forbidden patterns (aspirational)

These are still good goals, but they are **not fully true today**:

- no un-namespaced events (e.g. `pulse`)
- no camelCase events (e.g. `audiencePulse`)
- avoid snake_case (e.g. `audience_pulse`)

All new events must be documented and registered via `eventRouter.js`.

4. Routing Rules — Event Router as the Authority

The event router is the only file allowed to register socket event listeners.

4.1 Pipelines Must NOT Register Socket Listeners

No file other than eventRouter.js may call:

socket.on(...)


Pipelines expose handler functions; the router calls them.

4.2 registerSocketHandlers.js Must Not Wire Domain Behavior

This file may only:

acknowledge new connections

initialize the router

emit simple lifecycle notifications

Legacy pulse wiring must not exist here.

5. Import Restrictions (Anti-Drift)

To prevent accidental resurrection of legacy code, the following paths are prohibited:

server/pulse/*
server/emotion/*
server/safety/*
archive/*
archive/emotional_engine/*
server/_legacy_*


All live imports must reference:

server/pipelines/<domain>/

6. Domain Isolation Rules (As-Built + Best Practice)

Best practice: pipelines should be independent and should not import other pipeline **entrypoints** (e.g. `*Pipeline.js`) directly.

### 6.1 Forbidden imports (best practice)

Avoid importing pipeline entrypoints or reaching into another pipeline’s private state:

```js
import pulsePipeline from "../pulse/pulsePipeline.js"; // ❌
import emotionPipeline from "../emotion"; // ❌
import { participants } from "../session/state.js"; // ❌
```

### 6.2 Allowed interactions (as-built)

- `eventRouter` → pipelines (router wires socket events)
- pipelines → shared utilities (pure helpers)
- pipelines → MomentBuilder / MomentPipeline (integration point)

### 6.3 As-built shared-module exceptions (documented)

Some domains currently import **shared state/modules** from other domains (not entrypoints). This is allowed **as-built**, but should be treated as a stability boundary:

- Message pipeline reads active focus via `server/pipelines/focus/focus.state.js` (`getActiveFocus`) to stamp messages with focus metadata.
- Message pipeline uses `server/pipelines/audienceDrift/*` to classify/aggregate drift and emit `audience:*` updates.
- Event router imports some focus/audience drift helpers for gating/normalization.

If we want stricter isolation later, the upgrade path is to move these “shared” pieces into an explicit shared module (e.g. `server/shared/`) and/or route reads through injected adapters.

7. Lint/Guardrails (As-Built)

This repo has some enforcement, but not all of the aspirational rules below are currently implemented.

### 7.1 What is enforced today

See `eslint.config.js` for the authoritative rules. As of this audit, ESLint enforces:

- blocking legacy directory imports (e.g. `server/pulse/**`, `server/emotion/**`, `archive/**`)
- blocking legacy Moment filenames (e.g. `momentBuilder.js`, `momentEnvelope.js`)
- some pipeline boundary protections (partial; not a complete “no cross-pipeline imports” system)

### 7.2 What is aspirational (not yet reliably enforced)

- “Error if `socket.on(...)` appears outside `eventRouter.js`”
- strict event-name regex such as `^[a-z]+:[a-z]+$` (this does not match as-built events like `message.state.update`, `obs:status_changed`, `focus:reset_default`)
- “Exactly one Pipeline.js per domain” as a lint-enforced invariant

8. Legacy Quarantine Policy

Deprecated directories must be renamed to:

server/_legacy_<domain>/


Each file must begin with:

// ⚠️ LEGACY FILE — DO NOT IMPORT
// Use server/pipelines/<domain>/ instead.


No runtime logic may execute from these directories.

9. Migration & Rename Protocol (Anti-Drift Procedure)

When renaming, reorganizing, or restructuring pipeline code:

Step 1 — Reference Scan
rg "<oldName>" -n

Step 2 — Update Imports Only in Affected Files

No unrelated edits.

Step 3 — Validate Naming

Ensure conformity with this document.

Step 4 — Run Legacy Detector Script

Fails if old paths or old names appear.

Step 5 — Update This Document

This file is the authoritative record.

Step 6 — Commit & Push
git commit -m "chore(<domain>): apply naming conventions + update imports"
git push

10. “Done” Criteria for Each Pipeline Domain

A domain is considered fully migrated only when:

 All code resides in server/pipelines/<domain>/

 No legacy imports exist

 Filenames follow conventions exactly

 All events are routed via eventRouter.js

 ESLint passes with zero architecture violations

 Moment pipeline receives properly formatted fragments

 This document is up to date

 A GitHub checkpoint has been published

Until all conditions are met, the domain remains “not stable.”

11. Maintenance Rules

All new pipeline-related work must reference this document.

Any new pipeline domain or file type must be added here before code is written.

No refactor is complete until conventions are updated.

When conflicts arise, this document supersedes code.

12. Purpose

This conventions document:

prevents drift

eliminates legacy duplication

enforces naming consistency

preserves domain boundaries

standardizes event pathways

improves onboarding

increases psychological safety through clarity

ensures long-term architectural stability

It is binding for all future AmplifyEd development.