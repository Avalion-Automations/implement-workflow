---
name: runtime-validation
description: 'Run the cheapest executable checks, traces, or probes that can confirm or disprove a bug candidate in the current repository.'
argument-hint: 'Provide the candidate, its expected behavior, and any known commands or tests.'
user-invocable: false
---

# Runtime Validation

Prefer execution over argument when the environment allows it.

## Procedure
1. Choose the narrowest executable check for the claim.
2. Run targeted tests, probes, or commands before broad suites.
2a. Before final sign-off, run the full relevant suite for the changed surface.
3. Capture exact observed behavior, errors, and traces.
4. Treat any failing test as blocking until fixed or explicitly blocked by an external dependency with evidence.
5. Return confirmed, contradicted, or blocked.

## Output
- Command or target used
- Observed result
- Validation verdict