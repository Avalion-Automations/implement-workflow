# Formulation Output Contract

Use this reference after `hypothesis-formulation` is selected and the response needs the full contract.

## Inputs

Collect or infer these inputs before generating hypotheses:

- The concrete symptom or failing behavior.
- Expected behavior versus actual behavior.
- The nearest known file, function, boundary, command, or subsystem.
- Any logs, traces, errors, or prior observations.
- Any currently failing tests and their exact failure messages.
- The language or runtime, if known.
- Constraints on execution, logging, editing, or performance sensitivity.

If the language is unknown and cannot be inferred, keep the hypotheses runtime-neutral and focus on control points, data flow, and state transitions.

## Output Contract

Return four sections in this order:

1. `Problem framing`
2. `Candidate hypotheses`
3. `Selected normalized hypotheses`
4. `Handoff to hypothesis-instrumentation`

Each hypothesis must be stated so it can be tested by instrumentation without further rewriting.

Use this internal shape for every hypothesis:

- `hypothesis`: concise falsifiable claim
- `mechanism`: why it could cause the symptom
- `signal`: what should be observed if true
- `disproof`: what observation would rule it out
- `anchor`: nearest code path, state transition, or boundary to inspect

## Decision Points

### If the anchor is unclear

Step one hop closer to the code that directly computes, mutates, or gates the behavior. Do not map broad surrounding surfaces before proposing hypotheses.

### If the user already supplied hypotheses

Treat them as raw input, normalize them, and still run the user-selection checkpoint before instrumentation when interaction is available.

### If the user adds more hypotheses after selection

Fold them back into the candidate set and renormalize before producing the final handoff.

### If the evidence already rules out a candidate

Drop it or keep it only as a clearly lower-priority fallback.

### If multiple layers are plausible

Keep at most one leading hypothesis per layer unless two hypotheses at the same layer lead to different probes.

### If the context is sparse

Return a starter set with explicit unknowns rather than generic debugging advice.

## Quality Bar

Do not return vague theories. The response is complete only when:

- the symptom framing is concrete enough to anchor probes
- every hypothesis is falsifiable and localized
- every hypothesis has a predicted signal and a disproof condition
- the list is ranked and intentionally small
- the user had a chance to keep, drop, or augment the list when interaction is available
- the handoff can be pasted directly into `hypothesis-instrumentation`
- active failing tests are reflected as primary anchors, not optional context

## Response Template

### Problem framing

- `Symptom:` ...
- `Expected vs actual:` ...
- `Known scope:` ...
- `Best current anchor:` ...
- `Relevant evidence:` ...

### Candidate hypotheses

| # | Hypothesis | Anchor | Expected signal | Disproof | Priority |
|---|---|---|---|---|---|
| 1 | ... | ... | ... | ... | high |

### Selected normalized hypotheses

| # | Hypothesis | Anchor | Expected signal | Disproof | Keep reason |
|---|---|---|---|---|---|
| 1 | ... | ... | ... | ... | user kept |

### Handoff to hypothesis-instrumentation

`Symptom:` ...

`Language/runtime:` ...

`Constraints:` ...

`Hypotheses:`

1. ...
2. ...

Keep this handoff concise and ready for immediate probe design.