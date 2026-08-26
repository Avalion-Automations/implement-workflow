---
name: build
description: "Run a fast, approval-gated feature workflow with planning, test-first Blue implementation, one scope-bound Red review, one Fixer/Judge pass, controlled integration, a dashboard, and merge-readiness reporting. Use for practical 0-to-90% delivery that must await explicit merge approval."
---

# Build

Deliver a reviewed integration branch while keeping planning, implementation, review, repair, and merge authority separate. Never merge to `devel` or another protected user branch without explicit current approval.

Read [references/orchestration-contract.md](references/orchestration-contract.md) and [references/status-protocol.md](references/status-protocol.md) before starting. They define the shared fresh-context handoff, models, budgets, and telemetry rules. Use `scripts/build-handoff.mjs` for manifests, the run ledger, approval provenance, receipts, and the final report.

## Source and run setup

Use the primary agent as Build orchestrator with `model: "gpt-5.6-sol"` and `reasoning_effort: "xhigh"` when available. Inspect applicable `AGENTS.md`, the repository, base commit, branch, `git status --short`, and validation commands. Require a clean source worktree; ask how to handle user changes and never overwrite them.

Create only after checking that the paths and branch do not exist:

```text
/tmp/build-runs/<run-id>/integration
branch: build/<run-id>-integration
archive: <user-home>/.codex/build-runs/<run-slug>/status
```

Preserve the integration worktree and branch as the delivery artifact. Never force-push, reset, implicitly stash, or merge into the base branch.

Initialize status and the handoff ledger immediately. Start the bundled dashboard before Brainstorm:

Use the locked dashboard source in [assets/dashboard](assets/dashboard/); do not recreate its client or add another updater.

```bash
node <skill>/scripts/build-status.mjs init --state-dir <status-dir> \
  --run <run-id> --repo <repo> --base <sha> --branch <integration-branch> --workspace <integration-worktree>
node <skill>/scripts/build-status.mjs serve --state-dir <status-dir> \
  --runs-dir <user-home>/.codex/build-runs --host 127.0.0.1 --port 4173 --open
node <skill>/scripts/build-handoff.mjs init --status-dir <status-dir> \
  --run <run-id> --repo <repo> --base <sha> --branch <integration-branch>
```

`serve` reuses a healthy compatible singleton and opens `/runs/<slug>`; retain a new server session without waiting for it. A live unhealthy/incompatible registration is a blocker to another server. Browser or telemetry failure must be disclosed but never weakens source-control gates.

Put `hooks/hooks.json` at plugin root when packaging; copied skills do not load it. Before tools, set `--verification-command`, then select via `context --state-dir ... --team ... --task ...`. Hooks never approve/merge. See the status protocol.

## Fast workflow and time gate

Run stages serially. Every team orchestration and specialist delegation must start with `fork_turns: "none"` and only the bounded artifact paths required by the shared contract.

Aim to finish within 30 minutes. Before every team or specialist launch, run `build-handoff.mjs time-budget`. At `target-exceeded`, stop expanding investigation and defer non-blocking findings. At `hard-stop` (45 minutes), launch no new agents: finish only an already-running deterministic check, then deliver the best preserved candidate as blocked if an approved criterion remains unresolved. Only explicit user direction may extend the run.

1. **Brainstorm.** Invoke `$implement:brainstorm` in the integration worktree. Use exactly two independent Terra/medium workers and keep the Build orchestrator as the Sol/xhigh planner. Store `docs/build/<run-id>-plan.md` and `<status-dir>/handoffs/plan.json`; record both. Present the plan and stop for explicit approval.
2. **Approval.** Record the approved plan and scope hashes with `build-handoff.mjs approve`. Any material scope or plan change invalidates approval and returns to Brainstorm. Check approval before seeding, integration, and merge-readiness reporting.
3. **Seed tests.** Translate each observable criterion into the smallest failing automated test; retain manual/legal/visual/external criteria as explicit checks. Do not modify product code or weaken tests. Commit the plan and tests, record exact failures in `seed.json`, and hand off its path.
4. **Blue Team.** Invoke `$implement:blue-team` from the seeded commit. It owns isolated specialist worktrees and returns `blue.json`, its candidate branch/commit, and validation artifacts. Do not let Blue workers edit the Build integration worktree.
5. **One scoped Red Team pass.** Invoke `$implement:red-team` once against the immutable Blue candidate. Give it the approved plan, scope, criterion IDs, and changed paths. A finding is `eligible` only when it demonstrably prevents an approved criterion or regresses behavior within the approved change scope; it must cite those criterion IDs. Record unrelated, uncommon, speculative, hardening, portability, or pre-existing issues as `deferred` with a reason. Deferred findings stay visible in the report but do not enter Fixer or block readiness. `needs-context` is reserved for an in-scope decision that prevents determining criterion success.
6. **At most one scoped Fixer/Judge pass.** If Red has eligible findings, invoke `$implement:fixer-team` once for the complete eligible set. Its Planner, Builder, Adversary, and Judge operate as one batch. The Judge is the post-fix assurance gate and may assess only the approved criteria, repaired finding IDs, repair diff, and relevant regression suite. New outside-scope observations are deferred; do not launch another Red or Fixer round. If the single pass leaves an approved criterion unresolved, preserve the best candidate, block readiness, and recommend explicit standalone `$implement:fixer-team` or `$implement:red-team` work. When Red has no eligible findings, record `fixer-1.json` as `not-required` without launching Fixer.
7. **Integrate.** Merge the Blue commit when Fixer is not required, otherwise the Fixer commit accepted by its scoped Judge. Resolve mechanical conflicts only; ask about semantic conflicts. Run the complete relevant suite and record the final SHA. Do not perform a second Red pass inside Build.

Progress follows recorded stage milestones, never finding volume. Entity status commands already emit lifecycle events; add generic events only for approvals, validation, merges, and telemetry gaps.

## Delivery

Generate `docs/build/<run-id>-report.md` with `build-handoff.mjs report`, then verify `git diff --check` and commit the report on the integration branch. Return only a concise outcome, readiness state, dashboard URL, branch/commit, and links to the plan/report/manifests. End with exactly `Ready for explicit merge approval` or `Not ready for merge approval`.

Readiness requires current approval, green relevant validation, a completed scoped Red pass, all eligible Red finding IDs fixed and accepted by the single Fixer/Judge pass (or Fixer explicitly not required), and no in-scope blockers. Deferred findings are reported as residual risk and do not block Build readiness. The report commit never authorizes merging to the protected branch.

Remove only Build-created temporary snapshots and child worktrees whose commits are merged or intentionally retained. Keep the integration branch/worktree, durable status archive, reports, and all blocking or unmerged artifacts.

When changing this skill suite or dashboard, run the status, handoff, suite-lint, dashboard, and strict skill validations named in the shared contract.
