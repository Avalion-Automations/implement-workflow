---
name: dependency-semantics-check
description: 'Verify third-party or runtime API behavior against current docs, installed versions, and repo usage before making a bug claim that depends on external semantics.'
argument-hint: 'Provide the API, dependency, version context, and claim that depends on it.'
user-invocable: false
---

# Dependency Semantics Check

External API assumptions must be verified, not remembered.

## Procedure
1. Identify the exact library, runtime, or framework behavior the claim depends on.
2. Check current repo version and nearest usage pattern first.
3. Use authoritative docs or current references when repo evidence is not enough.
4. Return verified semantics and whether they support or weaken the bug claim.

## Output
- Verified semantics
- Version context
- Impact on candidate confidence