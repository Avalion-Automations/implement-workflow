---
name: stress-edge-probing
description: 'Probe boundaries, invalid inputs, size extremes, timing windows, and resource pressure to test whether a candidate bug generalizes or collapses at the edges.'
argument-hint: 'Provide the candidate bug and the edge dimensions worth probing.'
user-invocable: false
---

# Stress Edge Probing

Push the bug claim through edge conditions that often reveal its true shape.

## Procedure
1. Enumerate boundary and extreme inputs relevant to the claim.
2. Probe invalid, empty, huge, and timing-sensitive cases when safe.
3. Note which variations reproduce, weaken, or disprove the claim.
4. Return the tightest edge-behavior summary.

## Output
- Edge cases tried
- Reproduction matrix
- Strongest edge evidence