---
name: build
description: Run an approval-gated or bounded-unattended feature workflow with test-first implementation, review, fixes, integration, and merge-readiness reporting.
---

# Build

Deliver a reviewed integration branch while keeping planning, execution, and merge authority separate. Never merge to a protected user branch without explicit current approval.

Read [references/orchestration-contract.md](references/orchestration-contract.md) and [references/status-protocol.md](references/status-protocol.md). Use `scripts/build-handoff.mjs` for manifests, ledger, approvals, receipts, and reporting.

## Source and run setup

Use `model: "host-selected model"` and `effort setting: "xhigh"` when available. Inspect `AGENTS.md`, repository state, and validation commands. Require a clean source worktree.

Before Git mutation, run `scripts/worktree-root.mjs resolve --run <run-id>`. It preflights `BASICS_WORKTREE_ROOT` or the platform temporary fallback. `build-handoff.mjs init` records its absolute paths; every child lane inherits them.

Create only after checking that the recorded path and branch do not exist:

```text
<worktree-root>/build-runs/<run-id>/integration
branch: build/<run-id>-integration
archive: <state-root>/build-runs/<run-slug>/status (set `BASICS_RUNS_DIR` to override)
```

Preserve the integration worktree and branch. Never force-push, reset, implicitly stash, or merge into the base branch.

## Commit-subject policy

All workflow commits must follow [/feat-commit-no-scope](../feat-commit-no-scope/SKILL.md).
Inspect the staged diff and validate a scope-free `type: concrete outcome` subject:

```bash
node <plugin>/skills/feat-commit-no-scope/scripts/validate_commit_subject.js \
  "type: concrete outcome"
```

Use `chore: merge <concrete description>` for merge commits. Never use a scope or `!`.

## Explicit skill routing

Do not infer or substitute workflow methods. Build invokes
[/brainstorm](../brainstorm/SKILL.md),
[/bug-validation-and-regression](../bug-validation-and-regression/SKILL.md),
[/blue-team](../blue-team/SKILL.md),
[/red-team](../red-team/SKILL.md),
[/fixer-team](../fixer-team/SKILL.md), and
[/verify](../verify/SKILL.md) at their named stages. Every commit
uses [/feat-commit-no-scope](../feat-commit-no-scope/SKILL.md).

Their explicit delegated routes are: Brainstorm conditionally uses
[/audit-regression-readiness](../audit-regression-readiness/SKILL.md)
and [/capture-behavioral-baseline](../capture-behavioral-baseline/SKILL.md);
Blue uses [/run](../run/SKILL.md); Red uses
[/bug-finding-review](../bug-finding-review/SKILL.md); and Fixer,
when the finding is not already reproducibly isolated, uses
[/debugging-evidence-capture](../debugging-evidence-capture/SKILL.md),
[/hypothesis-formulation](../hypothesis-formulation/SKILL.md),
[/hypothesis-instrumentation](../hypothesis-instrumentation/SKILL.md),
and [/hypothesis-evaluation](../hypothesis-evaluation/SKILL.md), in
that order. Record a limitation rather than claiming an unsupported skill ran.

Before Brainstorm, initialize the ledger with the commands in the
[status protocol](references/status-protocol.md#commands), then initialize
`build-handoff.mjs`. Use the locked [assets/dashboard](assets/dashboard/)
source. Disclose browser or telemetry failure without weakening gates.

## Fast workflow and time gate

Run stages serially. Every team orchestration and specialist delegation must start with `fork_turns: "none"` and only the bounded artifact paths required by the shared contract.

Aim to finish within 30 minutes. Before every team or specialist launch, run `build-handoff.mjs time-budget`. At `target-exceeded`, stop expanding investigation and defer non-blocking findings. At `hard-stop` (45 minutes), launch no new agents: finish only an already-running deterministic check, then deliver the best preserved candidate as blocked if an approved criterion remains unresolved. Only explicit user direction may extend the run.

1. **Brainstorm and authorization preflight.** Invoke `/brainstorm` in the integration worktree. Route existing behavior through regression-readiness and behavioral-baseline checks. Use two independent Terra/medium workers with the Sol/xhigh Build orchestrator. Store the plan plus `plan.json` and `authorizations.json`; validate both manifests. From explicit intent, choose `interactive` or `bounded-unattended`. For unattended execution, preflight failure branches, capped retries, derived values, required sandbox/network grants, costs, and stops. Do not begin later stages with unresolved authorization.
2. **Consolidated approval and unattended arming.** Present plan, scope, authorization inventory, and mode once. Bind their hashes with `build-handoff.mjs approve --authorizations <authorization-manifest>`. Before declaring unattended readiness, acquire all separately enforced, scoped host capabilities; authorization never bypasses the sandbox. Within approved triggers, validations, targets, consequences, bounds, and attempts, run listed primary, recovery, and derived operations without re-prompting. Record evidence without rewriting the manifest. Listed fallbacks and deterministic substitutions remain approved. Stop for envelope violations, integrity failure, exhausted bounds, unapproved information loss, material scope decisions, or protected-branch merges. Check approval and applicable operation IDs before seeding, external mutation groups, integration, and readiness reporting.
3. **Seed tests.** Use `/bug-validation-and-regression` to translate each observable criterion into the smallest failing automated test; retain manual/legal/visual/external criteria as explicit checks. Do not modify product code or weaken tests. Commit the plan and tests, record exact failures in `seed.json`, and hand off its path.
4. **Blue Team.** Invoke `/blue-team` from the seeded commit. It owns isolated specialist worktrees, explicitly uses `/bug-validation-and-regression` and `/run` where applicable, and returns `blue.json`, its candidate branch/commit, and validation artifacts. Do not let Blue workers edit the Build integration worktree.
5. **One scoped Red Team pass.** Invoke `/red-team` once against the immutable Blue candidate with the approved plan, scope, criteria, and changed paths. Eligible findings must demonstrate and cite an approved-criterion failure or in-scope regression. Record all other findings as visible `deferred` items; they neither enter Fixer nor block readiness. Use `needs-context` only for an in-scope decision that prevents judging a criterion.
6. **At most one scoped Fixer/Judge pass.** If Red has eligible findings, invoke `/fixer-team` once for the complete set. Its Planner, Builder, Adversary, and Judge are one batch; the Judge assesses only approved criteria, repaired IDs, repair diff, and relevant regression suite. Defer new outside-scope observations and launch no further Red/Fixer round. An unresolved approved criterion blocks readiness and is preserved for explicit standalone Fixer/Red work. With no eligible findings, record `fixer-1.json` as `not-required`.
7. **Integrate.** Merge the Blue commit when Fixer is not required, otherwise the Fixer commit accepted by its scoped Judge. Resolve mechanical conflicts only; ask about semantic conflicts. Invoke `/verify` for the complete applicable proof, run the complete relevant suite, and record the final SHA. Do not perform a second Red pass inside Build.

Progress follows stage milestones. Add generic events only for approvals, validation, merges, and telemetry gaps.

## Delivery

Generate `docs/build/<run-id>-report.md`, verify `git diff --check`, and commit it. Return outcome, readiness, dashboard URL, branch/commit, and artifact links. End with exactly `Ready for explicit merge approval` or `Not ready for merge approval`.

Readiness requires current plan, scope, and authorization approval, green relevant validation, a completed scoped Red pass, all eligible Red finding IDs fixed and accepted by the single Fixer/Judge pass (or Fixer explicitly not required), and no in-scope blockers. Deferred findings are reported as residual risk and do not block Build readiness. The report commit never authorizes merging to the protected branch.

Remove only Build-created temporary snapshots and child worktrees whose commits are merged or intentionally retained. Keep the integration branch/worktree, durable status archive, reports, and all blocking or unmerged artifacts.

When changing this skill suite or dashboard, run the status, handoff, suite-lint, dashboard, and strict skill validations named in the shared contract.
