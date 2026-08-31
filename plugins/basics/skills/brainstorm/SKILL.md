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
6. **Plan.** Require every material ledger item to be resolved, explicitly deferred, or evidenced irrelevant. Give each decision, criterion, and risk a stable ID. Every implementation step names a target or discovery command, dependency, observable acceptance, and verification.

## Handoff

Return concise Markdown with: Outcome, Resolved Decisions, Assumption Coverage, Scope, Implementation Plan, Risks and Mitigations, Handoff Notes, and Remaining Open Decisions. Keep detailed evidence in artifacts rather than chat.

Under Build, write `docs/build/<run-id>-plan.md` and `<status-dir>/handoffs/plan.json`. The manifest must map decision and criterion IDs to evidence and verification, identify blocking decisions, and satisfy the shared schema. Record it with `build-handoff.mjs record`; return only its compact receipt and artifact paths. Do not claim implementation readiness while a material decision is unresolved.
