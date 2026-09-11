---
name: regression-gate-plan
description: 'Design language-appropriate acceptance tests and regression gates for a planned feature, preferring VS Code-runnable test surfaces when the repo and language tooling support them. Use when a workflow needs executable guards before implementation.'
argument-hint: 'Provide the feature packet, touched code areas, and current test setup.'
user-invocable: false
---

# Regression Gate Plan

Design the smallest regression net that protects both the new feature and the old behavior that must not break.

## When to Use

- Feature work before implementation.
- Test planning for a narrow code slice.
- Regression protection for future edits.
- VS Code-friendly test selection.

## Constraints

- Do not invent a new test framework when the repo already has one.
- Prefer the nearest existing test pattern.
- Prefer tests that can run from VS Code when that path is supported.
- Keep the gate set small but sufficient.
- If runner choice is ambiguous and blocks execution, use `vscode_askQuestions` through the caller.

## Procedure

1. Inspect the nearby test harness, test commands, and language tooling.
2. Map the feature packet to coverage needs:
   - one concrete executable acceptance test for each acceptance criterion before source edits begin
   - new behavior happy path
   - preserved legacy behavior
   - edge cases and contract failures
   - integration seams most likely to regress
3. Pick the preferred execution surface:
   - VS Code test explorer or code lens when supported
   - otherwise the narrowest repo-native CLI command
4. Identify the regression tests that must be added or updated immediately after the feature first passes the acceptance tests.
5. Build step-scoped gates for each planned commit-sized step.
6. Build a final regression gate set that must pass before merge.
7. Note missing fixtures, seed data, mocks, or env prerequisites.

## Output Contract

Return these sections in order:

1. `Test surfaces`
2. `Acceptance tests`
3. `Regression tests to add`
4. `Regression risks covered`
5. `Step gates`
6. `Final gates`
7. `VS Code preference`
8. `Blockers`

## Gate Rules

- `Step gates` must map to the numbered commit plan steps.
- `Acceptance tests` must map each acceptance criterion to a concrete executable test, test target, or repo-native command that exists before implementation edits begin.
- `Regression tests to add` must identify the preserved-behavior coverage to add or update immediately after the first passing acceptance run.
- `Final gates` must be executable commands or explicit VS Code test targets.
- Always include at least one gate that protects existing behavior, not just the new feature.