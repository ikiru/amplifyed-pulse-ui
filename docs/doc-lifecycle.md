# Status: Canonical
# Owner: TBD
# Last reviewed: 2026-01-18

# Doc Lifecycle (Preventing Drift)

This repo intentionally treats some documents as **binding contracts** and others as **historical context**.
The failure mode we’re preventing is: *a stale doc gets read as truth*.

## Status Types

Use one of these statuses near the top of a doc (or in a short banner).

- **Canonical**
  - This document is the current source-of-truth.
  - If code disagrees with it, **code must change** (or the doc must be explicitly superseded).

- **Active (Unverified)**
  - The doc is intended to be current, but hasn’t been recently audited.
  - Readers should verify against code/tests before relying on it for guarantees.

- **Draft**
  - Proposed direction; not yet implemented or enforced.

- **Historical (Drifted)**
  - Known to reflect past reality; kept for context.
  - Must link to the replacement canonical doc/code path.

- **Archived**
  - No longer maintained; kept only for record.
  - Prefer moving archived docs into `docs/archive/` once a replacement exists.

## Minimal Header Template

Add a short block near the top of a doc when you touch it:

```text
Status: Active (Unverified)
Owner: <team/person>
Last reviewed: YYYY-MM-DD
Supersedes: <optional>
Superseded by: <optional>
```

## Practical Workflow

- When you notice drift, don’t “quietly edit” large docs.
  - First decide: **update to match reality** or **mark historical + point to reality**.
- Prefer **small, test-backed contracts** over long narrative specs.
- If a guarantee matters, encode it:
  - In code assertions (dev guards)
  - In tests (contract tests)
  - In a short canonical contract doc

