# Artifact map

Generate only the artifacts supported by the confirmed scope. Follow [the file-naming contract](file-naming.md) and keep all paths synchronized.

| Location | Purpose |
| --- | --- |
| `docs/build/<run>-<YYYYMMDD>-request.md` | Original confirmed request and hard constraints. |
| `docs/build/<run>-<YYYYMMDD>-plan.md` | Outcome, decisions, scope, execution plan, criteria, risks, and handoff notes. |
| `docs/build/<run>-<YYYYMMDD>-scope.md` | Allowed and excluded paths/actions. |
| `docs/tracking/` | Reusable goal and result-handoff process. |
| `docs/draft/README.md` | Draft registry and promotion contract. |
| `docs/draft/<topic>.md` | One self-contained, promotable product/design topic. |
| `docs/manifest.yaml` | Topic ledger: draft/canonical paths, version, SHA-256. |
| `scripts/validate-docs.mjs` | Fail-closed promotion validator. |
| `tests/docs-validation.test.mjs` | Repository-local static/contract checks. |

Use `assets/baseline/` as source material. Populate `{{TOKENS}}`, adjust topic names and the manifest, and remove any topic template that does not belong to the agreed scope.
