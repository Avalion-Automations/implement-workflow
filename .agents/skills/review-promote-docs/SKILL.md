---
name: review-promote-docs
description: "Review draft documents one file at a time, create per-file goals and assumption ledgers, resolve decisions in question batches, and promote approved drafts with versioned SHA-256 evidence. Use for fresh or existing projects that need a repeatable draft-to-canonical documentation lifecycle."
---

# Review and Promote Documentation

Turn a directory of draft documents into individually reviewed, explicitly
approved, byte-identical canonical documents. Never equate a clean diff or
passing test with product-owner approval.

## Discover and initialize

1. Read repository instructions and inventory documentation, manifests,
   validators, tests, tracking conventions, and authoritative source material.
2. Identify the draft set and intended canonical target for every document.
   Exclude registries, templates, generated files, and process artifacts unless
   the user explicitly makes them promotable.
3. If the project has no lifecycle, read
   [references/contracts.md](references/contracts.md) and scaffold its default
   draft, canonical, tracking, manifest, and fail-closed validation structure.
   Adapt existing project conventions instead of installing a competing one.
4. Establish a stable review order from upstream intent to downstream detail:
   product/scope, journeys, integrations, data, extraction/business rules, UI,
   exports, architecture/security, then QA. Use dependency evidence to change
   the order when appropriate.

## Review every file

For each promotable draft, finish this loop before moving to its promotion:

1. **Create the goal.** Before substantive review, create a persistent goal
   artifact using the contract reference. If a goal-management tool is
   available, create or activate the same scoped goal there. The goal names the
   one draft, its canonical target, evidence sources, explicit non-goals,
   acceptance checks, and promotion intent.
2. **Build the ledger.** Read the draft, its upstream sources, downstream
   consumers, tests, and any existing decisions. Give every material
   assumption a stable ID, type, evidence and source location, owner,
   consequence if wrong, disposition, and verification. Treat prior user
   decisions as resolved; do not ask them again merely because the draft omits
   them.
3. **Route independent lenses.** Keep these two read-only core passes for
   every document:

   - **Product/journey:** user value, workflows, usability, and scope.
   - **Adversarial consistency/risk:** contradictions, unsafe assumptions,
     failure modes, and cross-document drift.

   Select zero to two additional, document-specific specialist lenses. Record
   each candidate as selected or skipped in the ledger, with the document type,
   evidence-based rationale, distinct review charter, and fallback owner.
   Do not select a lens merely to increase coverage; it must expose a material
   risk that the core passes cannot review deeply without duplicating work.

   | Document type | Specialist lenses |
   | --- | --- |
   | Product requirements | Implementation feasibility; testability |
   | Capture or processing flow | State/recovery; UX/accessibility |
   | External integration | Security; integration resilience/operability |
   | Data model | Data integrity; migration/recovery |
   | Extraction and validation | AI reliability/data integrity; compliance/domain correctness |
   | UI specification | Accessibility/localization; state consistency |
   | Export specification | Data fidelity; interoperability/compliance |
   | Architecture and security | Threat modeling; operability |
   | QA and acceptance | Testability; coverage/traceability |

   Specialist charters may cover implementation/operability,
   security/privacy, data/integrity, testability/acceptance,
   compliance/domain, or UX/accessibility/localization. Tailor the charter to
   the named document rather than running every lens. Examples include state
   transitions, recovery, observability, and deployment behavior;
   authentication, authorization, secrets, retention, consent, trust
   boundaries, and abuse cases; schemas, provenance, normalization, precision,
   lifecycle, migrations, and recovery; measurable requirements,
   deterministic verification, and traceability; or language and locale
   behavior. A user may explicitly request a broader review; otherwise the
   two-specialist cap applies.

   Give every selected worker only scoped source paths and the shared
   ledger-output contract, including resolved IDs that must not be reopened.
   Workers are read-only: they must not edit drafts or canonical documents,
   reopen resolved product-owner decisions, or create a separate finding format. Each output uses
   coordinator-assigned stable finding IDs, source locations, evidence, owner,
   consequence, disposition, and verification. If specialist capacity is
   unavailable, the primary agent performs that pass separately and records
   the fallback rather than silently omitting it.
4. **Reconcile before asking.** Wait for every selected lens to complete.
   Combine their outputs into the one ledger; preserve the contributing lens
   and source evidence, merge duplicate findings into a canonical row, and
   explicitly link genuine conflicts. Resolve facts from authoritative sources,
   derived constraints from repository evidence, and reversible implementation
   details with documented conventions. Distinguish those derivable items from
   consequential, non-derivable product-owner decisions. Only then create the
   complete question queue.
5. **Ask in batches.** Use the question tool in batches of at most three.
   Give meaningful mutually exclusive options, put the recommendation first,
   and record each answer against its ledger ID. If the tool is unavailable,
   say so and ask one concise open question in chat; do not silently select
   subjective preferences.
6. **Update the draft.** Only after the relevant decisions are resolved or
   explicitly deferred, revise the draft and its focused tests. Preserve
   unrelated changes and keep the document internally consistent with its
   consumers. An explicitly deferred material decision blocks promotion.
7. **Review evidence.** Run relevant link, schema, Markdown/Mermaid, test, and
   repository checks. Inspect the final raw draft bytes and confirm every goal
   criterion and ledger item is satisfied, irrelevant with evidence, or
   non-material. Record a result handoff, including lens routing and fallback
   evidence.

## Promote safely

Promotion is a separate mutation requiring explicit user approval for the
named draft, canonical target, and semantic version. Immediately before asking
for approval, report the exact paths, candidate version, SHA-256, checks, and
any information-loss consequence if an existing canonical file would change.

After approval:

1. Use `scripts/promotion.mjs promote` for the approved topic. It copies raw
   bytes, updates the JSON-as-YAML manifest, and refuses unsafe paths, invalid
   semver, hash drift, or unapproved canonical replacement.
2. Run `scripts/promotion.mjs check` plus project-specific validation.
3. Confirm draft and canonical bytes are identical and independently recompute
   SHA-256.
4. Update the registry and per-file result handoff with version, hash, commands,
   and exact status.
5. Continue to the next draft. Do not claim the project-level gate passes until
   every required manifest row passes.

Use `--dry-run` before every promotion. Use `--replace` only when the user has
explicitly approved replacing the named existing canonical file and has been
told that its current bytes will be lost. Never reformat or edit a canonical
file directly.

## Completion

Finish only when every requested document has either:

- a promoted canonical file with byte equality, semantic version, SHA-256,
  passing checks, goal, ledger, and result handoff; or
- an explicit blocked/deferred status naming the unresolved ledger IDs and
  next owner.

Report promoted, blocked, and untouched documents separately. A partially
promoted set is not a passing project gate unless the manifest defines it as
complete.
