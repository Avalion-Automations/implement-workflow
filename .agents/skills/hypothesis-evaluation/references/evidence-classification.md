# Evidence Classification

## Inputs

Collect or infer these inputs before classifying hypotheses:

- The active hypothesis list.
- The predicted signals or disproof conditions, if available.
- Probe output in the `HYPOTHESIS_PROBE {json}` format defined by `hypothesis-instrumentation`, or a readable file path that contains it.
- Any earlier hypothesis report.
- Constraints on rerunning probes or editing the code.

## Output Contract

Return four sections in this order:

1. `Evidence format check`
2. `Evidence summary`
3. `Updated hypothesis report`
4. `Next checks`

The report must include every hypothesis and use one of these statuses:

- `confirmed`
- `rejected`
- `inconclusive`
- `blocked`
- `not-run`

## Procedure

1. Load and validate the evidence format. If logs do not use `HYPOTHESIS_PROBE {json}` with required keys, stop evaluation and route back through formulation and instrumentation.
2. Normalize the evidence by probe, source, or boundary.
3. Compare evidence to expectations and disproof conditions.
4. Classify every hypothesis.
5. Call out ambiguity where one observation affects multiple hypotheses.
6. Recommend the smallest next check.
7. If the bug persists or the result is unclear, load `bug-finding-review` on the smallest controlling code range and feed its findings back through `hypothesis-formulation`.

## Decision Points

### If the evidence is incomplete

Prefer `inconclusive` or `blocked` over overclaiming.

### If the logs do not match the instrumentation format

Do not evaluate them directly. Route back through `hypothesis-formulation`, then `hypothesis-instrumentation`, and collect properly formatted logs.

### If all current hypotheses are weakened

Say so explicitly and propose at most two replacement hypotheses, each tied to a new anchor.

### If one or more hypotheses are confirmed

Route to fix validation instead of asking whether the bug is fixed. Keep the verification probes active or replace them with a cheaper equivalent, apply the narrowest grounded fix, rerun the focused validation, and collect post-fix logs before any fixed-status checkpoint.

### If one probe covers multiple hypotheses

Evaluate each hypothesis separately against the same observation.

### If the logs are noisy

Summarize only the lines or events that materially affect classification.

## Quality Bar

The response is complete only when:

- every hypothesis receives a status
- the evidence for that status is explicit
- uncertainty is called out honestly
- invalid evidence is rejected instead of interpreted loosely
- the next check is smaller than broad exploration, or it is an explicit fix-validation route justified by confirmed evidence
- failing test evidence remains blocking until repaired or explicitly blocked by a verified external dependency

## Response Template

### Evidence format check

- `Format valid:` yes or no
- `Missing keys or violations:` ...
- `Next route:` evaluate, or return to formulation plus instrumentation

### Evidence summary

| Source | Observation | Relevant hypotheses |
|---|---|---|
| Probe 1 | ... | 1, 3 |

### Updated hypothesis report

| # | Hypothesis | Status | Evidence |
|---|---|---|---|
| 1 | ... | confirmed | ... |

### Next checks

- ...
- ...

Keep the next checks narrow and ordered by expected information gain.