# Documentation promotion contracts

Read this reference when a project lacks a complete review, tracking, or
promotion lifecycle. Prefer compatible project conventions when they already
provide the same invariants.

## Default paths

```text
docs/
|-- draft/<topic>.md
|-- <topic>.md
|-- manifest.yaml
`-- tracking/
    |-- <run-id>-<topic>-goal.md
    |-- <run-id>-<topic>-ledger.md
    `-- <run-id>-<topic>-result.md
scripts/
`-- validate-docs.*
```

`manifest.yaml` may contain JSON because JSON is a YAML 1.2 subset. This keeps
the deterministic helper dependency-free.

## Per-file goal

```markdown
# Documentation promotion goal: <topic>

- Owner / date:
- Draft: docs/draft/<topic>.md
- Canonical target: docs/<topic>.md
- Goal: Observable, single-document outcome.
- In scope: Paths and decisions allowed to change.
- Out of scope: Explicit exclusions.
- Sources: Authoritative requirements and dependent documents.
- Acceptance criteria: Stable IDs and observable conditions.
- Verification plan: Exact commands and inspections.
- Promotion intent: Draft-only until explicit approval; candidate semver if known.
```

## Assumption ledger

Use one row for each material item. Stable IDs survive edits and question
batches.

| ID | Type | Candidate decision or fact | Evidence and source location | Owner | Consequence if wrong | Disposition | Verification |
| --- | --- | --- | --- | --- | --- | --- | --- |

Allowed dispositions are `resolved-evidence`, `resolved-user`,
`resolved-convention`, `deferred-blocking`, `irrelevant-evidence`, and
`superseded`. Every user answer records its exact wording or selected option.

Before dispatching reviews, add a routing record for every specialist lens
considered: document type, lens, selected or skipped status, evidence-based
rationale, and fallback owner when applicable. Every lens output uses the same
ledger row schema and coordinator-assigned stable finding IDs; it must include
source locations and its lens name. Reconciliation preserves provenance,
merges duplicates into one canonical row, and links rather than silently
collapsing conflicting findings.

The promotion checklist requires:

- all material rows resolved or evidenced irrelevant;
- no `deferred-blocking` rows;
- no contradiction with an authoritative source or linked consumer;
- explicit owner approval for the final draft bytes and version;
- focused checks passing from a cleanly identified working state.

## Result handoff

```markdown
# Documentation promotion result: <topic>

- Goal reference:
- Outcome: promoted, draft-only, partial, or blocked.
- Review routing: Selected and skipped lenses, rationale, and any fallback.
- Decisions applied: Ledger IDs.
- Changed paths:
- Verification evidence: Command plus result.
- Approval evidence: Approver and timestamp.
- Promotion: Canonical path, semver, SHA-256, and byte-equality result.
- Remaining blockers or risks:
- Next owner / action:
```

## Manifest schema

```json
{
  "schemaVersion": 1,
  "requiredTopics": [
    {
      "topic": "product-requirements",
      "draft": "docs/draft/product-requirements.md",
      "canonical": "docs/product-requirements.md",
      "version": null,
      "sha256": null
    }
  ]
}
```

Use repository-relative paths beneath `docs/`. Unpromoted rows have null
version/hash and no canonical file. A promoted row requires valid semantic
versioning, byte-identical draft/canonical content, and the SHA-256 of the raw
canonical bytes.

## Version policy

- First stable contract: `1.0.0`, unless the owner chooses a prerelease.
- Compatible clarification/addition: increment patch.
- Backward-compatible capability expansion: increment minor.
- Breaking contract change: increment major.

Every canonical change requires a new review, approval, version, and hash.
