---
name: counterexample-hunt
description: 'Search for guards, normalization, retries, compensating logic, intentional exceptions, or later correction paths that would disprove a bug candidate.'
argument-hint: 'Provide the candidate claim and affected code range.'
user-invocable: false
---

# Counterexample Hunt

Look for the exact code that would make the candidate wrong.

## Procedure
1. Search near the candidate for guards and normalizers.
2. Check later stages for retries, rollbacks, reconciliation, or state repair.
3. Prefer concrete counterexamples over abstract doubt.
4. Return the strongest counterevidence found.

## Output
- Counterevidence
- Surviving failure mode
- Candidate downgrade or rejection note