---
name: regression-gate-generation
description: 'Generate the smallest executable regression gate for a validated bug, and when explicitly allowed, write narrow tests in the existing harness rather than broad new scaffolding.'
argument-hint: 'Provide the validated bug, target harness, and whether writing tests is allowed.'
user-invocable: false
---

# Regression Gate Generation

Create the narrowest future guard that would catch the bug again.

## Procedure
1. Prefer the nearest existing test harness or executable check.
2. Design the smallest gate that fails on the bug and passes on the intended behavior.
3. If explicit write permission exists, add only narrow tests in the existing harness.
4. Return the gate plan and write actions, if any.

## Output
- Gate definition
- Execution target
- Write actions if approved