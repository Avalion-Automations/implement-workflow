---
name: hypothesis-evaluation
description: Convert structured probe output from hypothesis-instrumentation into an updated hypothesis report. Use for classifying evidence, confirming or rejecting hypotheses, choosing the next debugging check, and deciding when to loop through logic review across languages.
---

# Hypothesis Evaluation

Convert structured instrumentation output into an updated per-hypothesis report. Evaluate evidence against the stated hypotheses instead of drifting into new speculation unless the current set is exhausted.

## Workflow

1. Load probe output from inline logs or a provided file path.
2. Validate `HYPOTHESIS_PROBE {json}` format before interpreting evidence.
3. Group observations by probe, source, or boundary.
4. Compare each observation to the expected signal and disproof condition.
5. Classify every hypothesis as `confirmed`, `rejected`, `inconclusive`, `blocked`, or `not-run`.
6. Recommend the smallest next check, fix-validation route, or formulation loop.

## References

- For evidence validation, classification rules, decision points, quality bar, and response template, read `references/evidence-classification.md`.

## Scripts

- Use `../hypothesis-instrumentation/scripts/validate_probe_log.js <log-file>` before interpreting probe files.
- Use `../hypothesis-instrumentation/scripts/summarize_probe_log.js <log-file>` for a compact grouped summary.
