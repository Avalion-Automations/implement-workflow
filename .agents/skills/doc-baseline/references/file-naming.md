# File-naming contract

Use these names and paths for every generated baseline. The contract derives from the DGII Scanner baseline and keeps linked artifacts, manifests, and promotion targets predictable.

## General rules

- Use lowercase ASCII kebab-case for variable names: `[a-z0-9]+(?:-[a-z0-9]+)*`.
- Use `.md` for narrative artifacts and preserve `README.md` as the only uppercase filename.
- Use one concise `<run>` prefix for the whole build record, normally `<initiative>-docs`; reuse it unchanged for request, plan, and scope.
- Use the local calendar date as `<YYYYMMDD>` with no separators. Do not add time, revision, or status suffixes.
- Use topic nouns, not ordinal numbers. Keep names stable after the manifest exists.

## Required fixed paths

| Purpose | Required path |
| --- | --- |
| Build request | `docs/build/<run>-<YYYYMMDD>-request.md` |
| Build plan | `docs/build/<run>-<YYYYMMDD>-plan.md` |
| Build scope | `docs/build/<run>-<YYYYMMDD>-scope.md` |
| Draft registry | `docs/draft/README.md` |
| Tracking guide | `docs/tracking/README.md` |
| Goal template | `docs/tracking/goal-template.md` |
| Result-handoff template | `docs/tracking/result-handoff-template.md` |
| Promotion ledger | `docs/manifest.yaml` |
| Promotion validator | `scripts/validate-docs.mjs` |
| Documentation tests | `tests/docs-validation.test.mjs` |

## Topic and promotion names

- Name each draft `docs/draft/<topic>.md`, where `<topic>` is a kebab-case, self-describing subject such as `product-requirements`, `data-model`, or `architecture-and-security`.
- When a topic covers a named external system, prefix it with that system’s kebab-case name, such as `dgii-integration`; otherwise use the generic subject, such as `integration`.
- Set the canonical target to `docs/<topic>.md`. The `<topic>` filename must match the draft filename exactly.
- Use the same `<topic>` string as the manifest `topic` identifier. Do not use filenames with `draft`, `final`, `v2`, or dates in their topic name.
- Keep the draft registry, manifest, plan, tests, and all relative links synchronized whenever a topic is renamed.

## Tracking records

Keep `docs/tracking/` for the three fixed reusable templates by default. Put filled goal and result-handoff records in the delivery owner’s selected tracker; if that tracker is repository-local, choose a separate agreed location rather than adding ad hoc names beside the templates.
