---
name: observability-capture
description: 'Capture the minimal logs, traces, stack information, payloads, SQL, timings, or diagnostics needed to support or disprove a bug claim.'
argument-hint: 'Provide the candidate bug and the runtime surface where evidence can be captured.'
user-invocable: false
---

# Observability Capture

Collect only the evidence that materially changes confidence.

## Procedure
1. Identify the smallest set of artifacts that can validate the claim.
2. Prefer exact stack traces, payloads, timings, and state snapshots over verbose logs.
3. Tie each artifact to the candidate trigger and observed behavior.
4. Return the evidence bundle and what it proves.

## Output
- Artifacts captured
- What each artifact proves
- Missing observability gaps