---
name: differential-checking
description: 'Compare current behavior against specs, previous releases, alternate code paths, or golden outputs to verify that a bug claim reflects a real divergence.'
argument-hint: 'Provide the candidate behavior and a comparison baseline.'
user-invocable: false
---

# Differential Checking

Use comparison baselines to prove a behavior is wrong, not merely unusual.

## Procedure
1. Pick the best baseline: spec, old release, alternate path, or golden output.
2. Compare current and baseline behavior at the narrowest meaningful level.
3. Note whether the divergence is intentional, ambiguous, or clearly wrong.
4. Return the strongest comparative evidence.

## Output
- Baseline used
- Observed divergence
- Confidence effect