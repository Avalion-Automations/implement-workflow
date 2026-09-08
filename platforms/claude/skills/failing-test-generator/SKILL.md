---
name: failing-test-generator
description: Derive a behavioral contract and seed focused failing tests in an isolated Git worktree. Use for test-first acceptance coverage before implementation.
---

# Failing Test Generator

Create reviewable tests that demonstrate missing requested behavior. Never implement product code, weaken production behavior, merge branches, or claim a red test proves a defect outside the agreed contract.

Read [the orchestration contract](references/orchestration-contract.md) and [the tracking protocol](references/tracking-protocol.md) before starting.

## Contract first

Inspect repository instructions, existing behavior, relevant tests, test runner, tracking documents, branch state, and changed files. Require a clean source worktree. Do not overwrite or stash user changes.

Extract a contract containing: observable behaviors, inputs, outputs, state transitions, error/edge behavior, explicit non-goals, compatibility constraints, and executable acceptance criteria. Cite the prompt and repository evidence for each criterion.

If any criterion is ambiguous enough to produce materially different tests, use the question tool to ask up to three concise, decision-critical questions per round. Summarize the proposed contract and wait for explicit confirmation before creating a worktree or delegating. Do not guess security, financial, deletion, authorization, external-system, or compatibility semantics.

## Isolated run

Operate only in a new, clean Git worktree and branch named `test-seed/<run-id>`, based on the user-selected target branch or current branch. Check that branch and worktree paths do not already exist. Keep the branch and worktree after delivery; never force-push, reset, rebase, merge, or modify the source worktree.

Create `docs/test-seeds/<run-id>-contract.md` unless the repository has an equivalent tracking convention. Update existing tracking docs/templates when applicable; otherwise create this run record. It must identify the base SHA, target branch, contract criteria, intended test paths, expected initial failures, validation commands, commit SHAs, and ready-to-merge status.

## Delegated test seeding

Act as the orchestrator using `model: "host-selected model"` with `effort setting: "medium"`. Launch variable, domain-specific workers using `model: "host-selected model"` with `effort setting: "high"`; set `fork_turns: "none"` and give each only the contract, relevant source/test paths, test command, and owned output paths.

Select only the workers the confirmed contract needs:

- **Unit/API:** pure logic, validation, service or endpoint contracts.
- **State/data:** persistence, migration, concurrency, lifecycle, and idempotency.
- **UI/flow:** components, accessibility, interaction, and end-to-end behavior.
- **Integration/security:** boundaries, authorization, network failure, and external dependency behavior.

Assign non-overlapping test paths. Workers may inspect code and add/modify test or narrowly required test-fixture/config files only. They may not alter application/source implementation. The orchestrator reconciles overlap, rejects tests that encode unconfirmed assumptions, and preserves a clear one-to-one mapping between criteria and tests.

## Verify and commit

Run the smallest relevant test command after each logical slice and the full relevant suite at the end. Record the exact command, exit status, failure output, and which failures are intentional. A seeded criterion is complete only when its automated test fails for the missing behavior; if existing code already satisfies it, mark that criterion `already-satisfied` and do not manufacture a failure.

Commit logical slices in order: contract/tracking first, then each coherent test area. Use clear commit messages, confirm `git diff --check`, and update the run record with final paths, evidence, remaining ambiguity, base/HEAD SHAs, and target branch.

## Delivery

Report the branch, worktree, base and final commits, contract criteria, changed test paths, expected failures, checks run, and tracking document. State whether the worktree is ready to merge into the requested integration or target branch. Readiness means: a confirmed contract, only allowed changes, intentional failures reproduced, tracking updated, logical commits created, and no uncommitted changes. It does not authorize the merge.
