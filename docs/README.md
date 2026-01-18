# Documentation (Source-of-Truth Map)

This repo has documentation in multiple places. That’s OK **as long as trust is explicit**:

- Some docs are **canonical contracts** (must match behavior).
- Some docs are **historical artifacts** (useful context, but may drift).

If you are unsure whether a document is current, treat it as **unverified** and confirm against code and tests.

## Canonical Docs (Start Here)

The `docs/` directory is the **canonical home** for current documentation.

- [Session Contract](./session-contract.md)
- [Message Contract](./message-contract.md)
- [LiveView Contract](./liveview-contract.md)
- [Confusion UI Contract](./confusion-ui-contract.md)
- [Focus Box Contract](./focus-box-contract.md)
- [Thread Tools Contract](./thread-tools-contract.md)
- [OBS Pipeline Contract](./obs-pipeline-contract.md)
- [Visual Meaning & Anonymity Contract](./visual-meaning-and-anonymity-contract.md)
- [Testing Environments](./testing-environments.md)
- [Doc Lifecycle (Preventing Drift)](./doc-lifecycle.md)

## How to Read This Repo

- **Server architecture + pipeline boundaries**
  - `server/PIPELINES.md` (pipeline responsibilities/boundaries)
  - `server/PIPELINE_CONVENTIONS.md` (pipeline conventions)
  - `server/contracts/` (server-side contracts and guarantees)

- **UI-facing contracts (trainer view semantics, panels, non-semantic guarantees)**
  - `docs/` (canonical UI contracts; verify against code/tests when in doubt)

- **Testing environments**
  - `docs/testing-environments.md` (testing philosophy + pointers)
  - `testing/environments/` (environment implementations + contracts)

- **Phase / governance / readiness**
  - Root-level phase docs (e.g. `PHASE_3_CLOSURE.md`, `PHASE_4_*`, `PHASE_5_*`)
  - `PRODUCTION_READINESS.md`
  - `ROADMAP.md`

## Drift Handling (Policy)

Docs drift happens. We handle it by **labeling and triaging** instead of guessing.

- Read: `docs/doc-lifecycle.md`
- When a doc is discovered to be stale:
  - Add a short banner at the top: **“Status: Historical (drifted)”** and link to the new canonical doc/code
  - Or move it into `docs/archive/` (preferred once we have a replacement)

