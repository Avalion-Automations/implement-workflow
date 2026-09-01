---
name: brainstorm
description: Turn an ambiguous product, design, or engineering request into an assumption-checked implementation plan.
---

# Brainstorm

Create a decision-ready plan without implementing the requested work. Treat the prompt and supplied sources as evidence, not permission to invent product choices.

## Team

Use this fixed role structure:

| Role | Model | Effort | Scope |
| --- | --- | --- | --- |
| Orchestrator | `gpt-5.6-sol` | `high` | Reconcile evidence, ask the user, write the plan |
| 2–3 workers | `gpt-5.6-terra` | `medium` | Independent read-only assumption/risk lenses |

Use two workers for a bounded request and three for cross-cutting or high-risk work. Start every worker with `fork_turns: "none"`; pass only the request, source paths, lens, and output contract. Workers return a compact table and never patches, mutations, or user questions. Keep one host slot for the orchestrator; when capacity is tight, run workers sequentially rather than reducing the role count.

When invoked by `$basics:build`, first read [references/orchestration-contract.md](references/orchestration-contract.md). Use its manifest paths, budget warnings, fresh-context receipt, model fallback, and status rules. Otherwise do not create Build telemetry or artifacts.

## Behavior-preservation support

When the request changes an existing product surface, invoke
[$basics:audit-regression-readiness](../audit-regression-readiness/SKILL.md)
to identify observable behavior that lacks adequate protection. When a
behavioral contract must be captured before change, invoke
[$basics:capture-behavioral-baseline](../capture-behavioral-baseline/SKILL.md)
and carry its explicit invariants into the plan. These skills are conditional:
do not manufacture a baseline or regression audit for wholly new, isolated
work with no existing behavior to preserve.

## Workflow

1. **Frame.** Extract outcome, users, constraints, deliverables, evidence, and unknowns. Inspect only in-scope sources; do not browse, install, test, branch, or mutate merely to brainstorm.
2. **Ledger.** Give every material assumption an ID, type (`fact`, `constraint`, `implementation`, `product`, `design`, `personalization`, `risk`, or `scope`), evidence, owner, and disposition.
3. **Independent lenses.** Cover product/journey, engineering/operations, and adversarial constraints as appropriate. Workers return: candidate, evidence/inference, consequence if wrong, confidence, owner, and minimal resolution.
4. **Reconcile.** Deduplicate and resolve from explicit requirements, source facts, or reversible conventions. Escalate only consequential non-derivable choices: product intent, personalization/design, binding risk, scope, budget, or timeline.
5. **Ask.** Use the question tool for every unresolved user-owned decision, at most three per call, with a recommendation and real options. If unavailable, ask the same bounded questions in chat and stop. Never silently choose a subjective preference.
6. **Authorization preflight.** Before declaring the plan ready for unattended execution, inventory every operation that could require user authority or host escalation. Cover destructive or overwriting writes, baseline transitions, worktree/branch cleanup, dependency or version-policy changes, external accounts and credentials, cloud/IAM/database/deploy/cost/teardown actions, and any standalone recovery route the workflow may invoke. Use read-only discovery to resolve exact targets, identities, commands, consequences, and bounds. Batch all currently knowable user-owned authorizations into the planning questions; do not defer a known approval request to an execution agent.
7. **Plan.** Require every material ledger item to be resolved, explicitly deferred, or evidenced irrelevant. Give each decision, criterion, risk, and authorization a stable ID. Every implementation step names a target or discovery command, dependency, observable acceptance, and verification. Under Build, write the complete authorization inventory to `<status-dir>/handoffs/authorizations.json` using the shared contract. A late-discovered authorization is a preflight defect: stop before that action, return to planning, update the plan/scope/authorization artifacts, and obtain a new consolidated approval instead of repeatedly prompting inside the execution loop.

## Handoff

Return concise Markdown with: Outcome, Resolved Decisions, Assumption Coverage, Scope, Implementation Plan, Risks and Mitigations, Handoff Notes, and Remaining Open Decisions. Keep detailed evidence in artifacts rather than chat.

Under Build, write `docs/build/<run-id>-plan.md`, `<status-dir>/handoffs/plan.json`, and `<status-dir>/handoffs/authorizations.json`. The plan manifest must map decision and criterion IDs to evidence and verification and identify blocking decisions. The authorization manifest must prove that every category in the shared preflight checklist was reviewed, list exact bounded operations that require authority, record excluded operations, and contain no unresolved items. Validate it with `build-handoff.mjs validate-authorizations`; return only compact receipts and artifact paths. Do not claim implementation readiness while a material decision or known authorization is unresolved.
