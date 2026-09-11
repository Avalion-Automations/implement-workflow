---
name: reachability-analysis
description: 'Prove whether a suspicious state or branch is actually reachable from real inputs, active callers, and current control flow.'
argument-hint: 'Provide the suspect branch, state, or failure location.'
user-invocable: false
---

# Reachability Analysis

Do not treat dead or impossible paths as bugs.

## Procedure
1. Trace backwards from the suspicious site to real callers or entrypoints.
2. Verify guards, defaults, early returns, and impossible-state eliminations.
3. Check whether current call sites can supply the required triggering values.
4. Return reachable, unreachable, or blocked.

## Output
- Reachability verdict
- Required trigger path
- Blocking guards if any