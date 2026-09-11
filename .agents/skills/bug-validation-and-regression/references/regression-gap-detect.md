---
name: regression-gap-detect
description: 'Find where existing tests fail to protect validated or likely bugs, with emphasis on preserved behavior that a prior merge or refactor may have re-broken.'
argument-hint: 'Provide the validated bug and the nearest test surfaces.'
user-invocable: false
---

# Regression Gap Detect

Find the exact hole that let the bug in.

## Procedure
1. Inspect the nearest existing tests and execution surfaces.
2. Check whether the bug path, preserved behavior, and surrounding contract are already covered.
3. Identify the smallest missing assertion or scenario.
4. Return the specific regression gap.

## Output
- Existing coverage
- Missing check
- Best regression target