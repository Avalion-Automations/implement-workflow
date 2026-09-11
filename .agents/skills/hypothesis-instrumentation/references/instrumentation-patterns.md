# Instrumentation Patterns

## Inputs

Collect or infer these inputs before generating code:

- A normalized numbered list of hypotheses from `hypothesis-formulation`.
- A tracking ID for this debugging session.
- The concrete symptom, failing behavior, or code area.
- The language or runtime, if known.
- Any constraints on editing, execution, logging, or performance sensitivity.

If the incoming hypothesis list is raw, vague, or not yet user-reviewed, send it back through `hypothesis-formulation` before generating probes.

## Probe Types

Prefer probes that answer a single question with minimal code churn:

- entry or exit logging
- value snapshots
- branch markers
- counters
- timing checkpoints
- invariant assertions
- event emission or trace spans

For each probe, provide exact intent, insertion point, snippet or template, captured observation, log format, expected log sink, and removal path.

## Decision Points

### If the anchor is unclear

Step to the nearest code that directly computes, mutates, or gates the behavior. Do not map broad surrounding surfaces before proposing probes.

### If the input list is weak or unnormalized

Do not instrument it directly. Route it back through `hypothesis-formulation` first.

### If multiple hypotheses overlap

Prefer one probe at the shared control point, then add only the extra probes needed to separate the remaining uncertainty.

### If instrumentation could change behavior

Prefer passive observation such as snapshots, counters, or trace markers over expensive logging or blocking assertions.

### If the environment is constrained

Use the simplest native mechanism available in the codebase, such as an existing logger, debug output, trace facility, test assertion, or stderr print.

### If no safe probe exists

Mark the hypothesis as `blocked`, explain the constraint, and propose the least invasive alternative such as a neighboring boundary probe or a test harness probe.

## Quality Bar

The response is complete only when:

- every hypothesis has a concrete predicted signal
- every hypothesis has a discriminating probe or an explicit `blocked` reason
- the code is minimal and localized
- the log format is explicit and mechanically checkable
- the expected log artifact source is explicit
- the removal path is clear
- the report includes every hypothesis with a status and next evidence threshold
- any failing test observed during validation is treated as blocking until fixed or explicitly documented as externally blocked

## Response Template

### Instrumentation plan

| # | Hypothesis | Anchor | Probe | Expected signal |
|---|---|---|---|---|
| 1 | ... | ... | ... | ... |

### Instrumentation code

For each probe, provide:

- `Placement:` function, file, branch, handler, or boundary
- `Goal:` what the probe distinguishes
- `Snippet:` code or pseudocode
- `Log output:` exact `HYPOTHESIS_PROBE {json}` line shape with tracking ID included
- `Expected log artifact:` file path, stream, or output source to inspect first
- `Remove after:` validation is complete

### Instrumentation log format

Point to `references/probe-log-contract.md` and include any task-specific fields.

### Hypothesis report

| # | Hypothesis | Status | Evidence or next check |
|---|---|---|---|
| 1 | ... | not-run | Confirm if X is observed; reject if Y is observed. |