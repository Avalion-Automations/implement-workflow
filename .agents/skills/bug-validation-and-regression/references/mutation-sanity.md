---
name: mutation-sanity
description: 'Check that a proposed regression gate would actually fail without the fix or under a plausible mutation, so the test is not a false pass.'
argument-hint: 'Provide the regression gate and the bug behavior it should catch.'
user-invocable: false
---

# Mutation Sanity

Do not trust a new regression gate until it proves it can fail.

## Procedure
1. Identify the smallest counterfactual that should break the gate.
2. Use the current bug behavior, a known failing input, or a simple mutation when feasible.
3. Verify the gate distinguishes good from bad behavior.
4. Return whether the gate is trustworthy.

## Output
- Sanity method used
- Would-fail verdict
- Remaining weakness