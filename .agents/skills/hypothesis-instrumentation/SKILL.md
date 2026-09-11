---
name: hypothesis-instrumentation
description: Turn debugging hypotheses into minimal instrumentation, structured probes, validation steps, and a status report.
---

# Hypothesis Instrumentation

Generate the smallest useful instrumentation needed to test each hypothesis, apply the minimal reversible probe edit when the workspace is writable, and return a per-hypothesis status report.

## Workflow

1. Confirm the hypotheses are normalized, falsifiable, and anchored. If not, route back through `hypothesis-formulation`.
2. Choose the cheapest discriminating probe for each hypothesis.
3. Consolidate shared probes when one observation can distinguish multiple hypotheses.
4. Apply minimal reversible instrumentation when editing is allowed.
5. Make every probe emit the required `HYPOTHESIS_PROBE {json}` format.
6. State where the log artifact should be found and how to remove or disable probes.
7. Mark every hypothesis as `not-run`, `blocked`, or evidence-based when results are already available.

## References

- For the required probe log schema and validation rules, read `references/probe-log-contract.md`.
- For instrumentation patterns, decision points, quality bar, and response template, read `references/instrumentation-patterns.md`.

## Scripts

- Use `scripts/validate_probe_log.js <log-file>` to validate probe output before evaluation.
- Use `scripts/summarize_probe_log.js <log-file>` to group probe output by tracking ID, hypothesis, and probe.
