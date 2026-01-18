# Documentation Review Progress (Docs-First Canonical Pass)

This file tracks the **one-by-one review** of canonical docs in `docs/`.

## Review Rules

- `docs/` is the **canonical home**.
- Files outside `docs/` are treated as **Historical (Drifted)** unless explicitly promoted.
- Each canonical doc should maintain a clear **Status / Owner / Last reviewed** header.

## Current Pass Order

1. `session-contract.md`
2. `message-contract.md`
3. `liveview-contract.md`
4. `confusion-ui-contract.md`
5. `focus-box-contract.md`
6. `thread-tools-contract.md`
7. `obs-pipeline-contract.md`
8. `visual-meaning-and-anonymity-contract.md`
9. `testing-environments.md`
10. `doc-lifecycle.md` (keep in sync with how we actually work)

## Checklist (per doc)

- **Scope is explicit** (what it governs / does not govern)
- **Guarantees are enumerated** (Must / Never / Allowed)
- **Payload shapes & event names** are explicit (if applicable)
- **Enforcement is identified** (tests, guards, or “not enforced yet” note)
- **Links to related canonical docs** are present
- **Known drift risks** are called out

## Status

| Doc | Status | Notes |
| --- | --- | --- |
| `session-contract.md` | reviewed (pass 1) | Added TL;DR + implementation pointers to reduce drift. |
| `message-contract.md` | reviewed (pass 1) | Added TL;DR + implementation pointers (socket events + code map). |
| `liveview-contract.md` | reviewed (pass 1) | Added TL;DR + implementation pointers (route + subscriptions). |
| `confusion-ui-contract.md` | reviewed (pass 1) | Added TL;DR + implementation pointers (UI component + confusion:update shape). |
| `focus-box-contract.md` | reviewed (pass 1) | Added title + TL;DR + implementation pointers (events + server/client map). |
| `thread-tools-contract.md` | reviewed (pass 1) | Added TL;DR + implementation pointers (TrainerView lens + utils/tests). |
| `obs-pipeline-contract.md` | reviewed (pass 1) | Added TL;DR + implementation pointers (events + client/server map). |
| `visual-meaning-and-anonymity-contract.md` | reviewed (pass 1) | Added TL;DR + implementation pointers (thread visuals → code + CSS). |
| `testing-environments.md` | reviewed (pass 1) | Added TL;DR + implementation pointers (HISTE mapping + constraints). |
| `doc-lifecycle.md` | reviewed (pass 1) | Lifecycle statuses + workflow match current process; linked from docs index. |

