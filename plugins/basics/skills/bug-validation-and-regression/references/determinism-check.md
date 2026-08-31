---
name: determinism-check
description: 'Rerun and vary narrow checks to separate real bugs from flakes, races, timing noise, and environment-dependent behavior.'
argument-hint: 'Provide the check, repro, or test target to rerun and vary.'
user-invocable: false
---

# Determinism Check

Verify that the observed failure is stable enough to trust.

## Procedure
1. Repeat the narrowest failing or suspicious check.
2. Vary timing, ordering, seed, env, or inputs where relevant.
3. Record whether the behavior is stable, flaky, or irreproducible.
4. Downgrade confidence when the result is noisy.

## Output
- Stable or flaky verdict
- Key variations tried
- Confidence impact