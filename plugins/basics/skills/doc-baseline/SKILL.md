---
name: doc-baseline
description: Conduct a question-led discovery and scaffold draft-only documentation baselines for software or product initiatives. Use to interview users before producing tracked, promotable Markdown specifications.
---

# Doc Baseline

Turn an agreed product brief into a reviewable documentation baseline. Preserve the lifecycle: build record → tracked authoring → draft topic registry → explicit promotion gate. Do not generate application code.

## Run modes

- **Discovery (default):** Gather and summarize decisions without changing files.
- **Scaffold:** Generate the complete baseline only after the user explicitly says `scaffold`, `produce docs`, or `generate`. Treat those tokens as commands only in the active doc-baseline conversation. Offer `scaffold` as the default keyword.
- **Revise:** Update the decision summary or generated drafts after the user supplies corrections.

If the user invokes the skill with a clear, complete brief and asks to scaffold immediately, confirm the inferred decisions and generate in the same turn. Otherwise begin discovery.

## Discovery

Use the question tool for every information-gathering round when it is available. Ask at most three short, related questions per round; otherwise ask one concise plain-text question and wait. Adapt later questions to earlier answers. Do not ask questions already answered by project files or the user.

First inspect the repository for an existing `docs/`, planning material, architecture, data schemas, and contributor instructions. Report any existing baseline and never overwrite it without explicit approval.

Read [the discovery guide](references/discovery-guide.md). Progress through its six groups until the user has answered every applicable decision or explicitly delegated a decision. Distinguish:

- **Decided:** user-confirmed behavior or constraint.
- **Proposed default:** reversible assumption requiring confirmation before scaffold.
- **Open risk:** decision that cannot safely be assumed; leave it visibly unresolved in the plan and relevant draft.

After each round, return a compact decision ledger plus the next questions. Before generating, present a final readiness summary: outcome, in/out of scope, users/workflows, data and provenance, integrations/security, UI, exports, acceptance checks, documentation topic set, promotion policy, and unresolved risks. Ask the user to correct it or say `scaffold`.

## Scaffold

When the trigger arrives, create a goal report before substantive authoring and a result handoff at completion. Use [the artifact map](references/artifact-map.md) and the bundled [baseline templates](assets/baseline/).

Follow [the file-naming contract](references/file-naming.md). Do not invent alternate directory names, title case, underscores, or date formats.

1. Create `docs/build/<run>-<YYYYMMDD>-request.md`, `<run>-<YYYYMMDD>-plan.md`, and `<run>-<YYYYMMDD>-scope.md`, populated from the confirmed ledger. Do not label scope approved unless the user approved it.
2. Create `docs/tracking/README.md`, `goal-template.md`, and `result-handoff-template.md`. Keep `docs/tracking/` reusable and template-only unless the delivery owner explicitly selects it as the work tracker; otherwise store filled goal and handoff reports in the owner-selected tracker and link or identify them from the build record.
3. Create `docs/draft/README.md` and one individual, self-contained Markdown draft per confirmed topic. Replace every template token; do not leave a skeleton or reproduce generic wording when user decisions are available.
4. Create `docs/manifest.yaml`, the [bundled validator template](assets/baseline/scripts/validate-docs.mjs) at its corresponding project `scripts/` path, and `tests/docs-validation.test.mjs`. Derive the manifest topic entries from the actual draft topics. Initial draft topics are unpromoted unless the user explicitly authorizes a promotion.
5. Link related drafts with relative Markdown links. Add Mermaid diagrams where they clarify a multi-lane workflow, source precedence, state lifecycle, system boundary, or promotion flow.
6. Run the generated test suite and promotion validator. An initial unpromoted baseline is expected to fail the promotion validator; report that exact result as intentional, never as production-ready.

Use the default nine topics only when they fit: product requirements, capture/processing flow, integration, data model, extraction/validation, UI, export, architecture/security, and QA/acceptance. Rename, add, or omit topics to match the confirmed scope; reflect the final list everywhere (README, manifest, test, plan).

## Promotion contract

Default to a fail-closed, copy-only promotion flow. An approved `docs/draft/<topic>.md` becomes `docs/<topic>.md` only through a byte-identical copy. Record valid semantic version and canonical SHA-256 in the manifest, then run the validator. Never promote drafts, mark a build scope approved, or claim production readiness without explicit user authorization.

## Quality bar

Make each topic concrete, internally consistent, and independently useful. Preserve hard constraints and source-of-truth rules across all documents. Define handling for invalid input, failed integrations, missing data, edits/deletes, privacy/security boundaries, and verification. Keep internal data such as provenance, status, identifiers, hashes, and logs out of business exports unless the user says otherwise.

Finish with changed paths, validation evidence, promotion status, and remaining decisions. If discovery only, finish with the latest decision ledger and the exact `scaffold` trigger.
