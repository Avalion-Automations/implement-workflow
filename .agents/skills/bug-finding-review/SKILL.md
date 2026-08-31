---
name: bug-finding-review
description: Review code, designs, or bug reports to find likely defects before or during debugging. Use for static bug scans, logic review, assumption audits, counterexample hunting, reachability and blast-radius analysis, dependency semantics checks, skeptical review, AHK shadowing checks, or domain-specific bug probes.
---

# Bug Finding Review

Use this skill to find plausible defects and sharpen debugging hypotheses before changing code.

## Workflow

1. State the reviewed behavior, contract, and files or traces under review.
2. Choose the smallest relevant review lenses from `references/`.
3. Report findings by severity with concrete evidence, file or code references, and the failing condition.
4. Convert uncertain findings into falsifiable hypotheses or narrow validation steps.
5. Avoid broad refactors unless the evidence shows the bug is structural.

## Reference Selection

- For static scans, read `references/static-bug-scan.md`.
- For branch, state, and invariant issues, read `references/logic-reviewer.md`.
- For hidden assumptions, read `references/assumption-audit.md`.
- For examples that should break the logic, read `references/counterexample-hunt.md`.
- For reachability and impacted callers, read `references/reachability-analysis.md` and `references/blast-radius-analysis.md`.
- For dependency contracts, read `references/dependency-semantics-check.md`.
- For skeptical second-pass review, read `references/skeptical-review.md`.
- For AutoHotkey shadowing, read `references/ahk-no-shadow.md`.