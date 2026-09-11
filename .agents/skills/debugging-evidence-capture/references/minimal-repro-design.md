---
name: minimal-repro-design
description: 'Design the smallest input, request, file, command, or call sequence that can reproduce a validated bug candidate.'
argument-hint: 'Provide the candidate bug and the current best trigger path.'
user-invocable: false
---

# Minimal Repro Design

Shrink the failure to the smallest credible reproducer.

## Procedure
1. Strip the trigger path to essential inputs and steps.
2. Remove unrelated setup until the claim stops reproducing.
3. Capture the smallest still-failing case.
4. Return the repro recipe and the blockers if it cannot be minimized.

## Output
- Minimal repro steps
- Required fixtures or env
- Blockers