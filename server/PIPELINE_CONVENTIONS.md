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

All socket events must follow the pattern:

namespace:action

3.1 Allowed Event Names (Examples)
audience:pulse
audience:message
message:trainerReply
trainer:command
trainer:nudge
session:join
session:leave
session:reconnect
focus:set
focus:clear
safety:softFlag
safety:pattern
moment:update

3.2 Forbidden Event Patterns

pulse:submit (legacy)

snake_case (e.g., audience_pulse)

camelCase (e.g., audiencePulse)

un-namespaced events (e.g., pulse)

All new events must be documented and registered via eventRouter.js.

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

6. Domain Isolation Rules

Pipelines must be independent and must not import other pipelines directly.

6.1 Forbidden Imports
import pulsePipeline from "../pulse/pulsePipeline.js";      // ❌
import emotionPipeline from "../emotion";                   // ❌
import { participants } from "../session/state.js";         // ❌

6.2 Allowed Interactions

eventRouter → pipelines

Pipelines → shared utilities

Pipelines → moment builder

Trainer Pipeline Exception

The trainer pipeline is:

write-only into momentBuilder

forbidden from reading pulse/emotion/session state

(See PIPELINES.md for behavioral boundaries.)

7. Lint Rules That Enforce These Conventions

To ensure stability, ESLint must enforce:

7.1 Block Forbidden Imports
"no-restricted-imports": [
  "error",
  {
    "patterns": [
      "server/pulse/*",
      "server/emotion/*",
      "server/safety/*",
      "archive/**",
      "server/_legacy_*",
      "*momentBuilder*",
      "*momentEnvelope*"
    ]
  }
]

7.2 Block Socket Listeners Outside the Router

Custom rule:

Error if `socket.on(...)` appears outside `eventRouter.js`.

7.3 Enforce Event Naming Pattern

Allowed: ^[a-z]+:[a-z]+$
Forbidden: snake_case, camelCase, uppercase.

7.4 Enforce One Pipeline Entrypoint Per Domain

Multiple *Pipeline.js files = error.
Missing one = error.

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