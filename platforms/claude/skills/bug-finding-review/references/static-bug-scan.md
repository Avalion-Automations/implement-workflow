---
name: static-bug-scan
description: 'Generate concrete bug candidates from code by scanning for null paths, bounds faults, state gaps, API misuse, config drift, resource leaks, and concurrency hazards.'
argument-hint: 'Provide the files, subsystem, or hotspot list to scan.'
user-invocable: false
---

# Static Bug Scan

Produce candidate bugs with disproof paths, not vague smells.

## Procedure
1. Scan for concrete failure classes tied to runtime behavior.
2. Prefer reachable state and externally triggered faults over aesthetic issues.
3. Attach a trigger, evidence line, and cheapest disproof check to each candidate.
4. Rank by impact and ease of falsification.

## Output
- Candidate bug claims
- Trigger path
- Disproof check