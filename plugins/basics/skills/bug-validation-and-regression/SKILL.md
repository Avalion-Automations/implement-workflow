---
name: bug-validation-and-regression
description: Design and run focused checks that validate bugs, fixes, and regression risks with reproducible evidence.
---

# Bug Validation And Regression

Use this skill to turn a suspected issue or fix into concrete evidence.

## Workflow

1. Identify the claim to prove or disprove.
2. Pick the narrowest validation mode from `references/`.
3. Prefer deterministic, reproducible checks with explicit expected outcomes.
4. Run or specify the smallest command, fixture, or probe that answers the claim.
5. Capture the result and decide whether to tighten the fix, add a regression gate, or stop.

## Reference Selection

- For command discovery, read `references/build-test-discovery.md`.
- For runtime checks, read `references/runtime-validation.md`.
- For comparing implementations or versions, read `references/differential-checking.md`.
- For repeatability, read `references/determinism-check.md`.
- For mutation sanity, read `references/mutation-sanity.md`.
- For edge stress, read `references/stress-edge-probing.md`.
- For missing regression coverage, read `references/regression-gap-detect.md`.
- For planning and creating gates, read `references/regression-gate-plan.md` and `references/regression-gate-generation.md`.
## Scripts

- Use `scripts/repeat_check.ps1 -Command '<command>' -Count 3` when checking determinism or flake suspicion.
