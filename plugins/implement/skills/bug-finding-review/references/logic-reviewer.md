---
name: logic-reviewer
description: 'Review the logic behind a specific code range to surface hidden assumptions, branch gaps, state fallacies, and test angles that can hide bugs. Use when a bug persists, an evaluation is inconclusive, or the logic itself needs critical review across languages.'
argument-hint: 'Provide the code range, the current bug behavior, and any active hypotheses or evidence.'
---

# Logic Reviewer

Inspect the logic behind a bounded range of code and surface the hidden assumptions or reasoning flaws that can produce durable bugs.

This skill is language independent. Focus on the logic itself, not style, formatting, or broad architecture.

## When to Use

- A bug persists after one or more instrumentation cycles.
- `hypothesis-evaluation` is inconclusive or weakens every active hypothesis.
- The controlling code range has complicated branching, gating, state transitions, retries, or dialog selection logic.
- You need new, logic-grounded hypotheses instead of another broad search pass.

## Inputs

- The smallest relevant code range, function, method, handler, or state transition.
- The current symptom or bug behavior.
- The active hypothesis list, if one exists.
- Any probe results or evidence already collected.

## Output Contract

Return four sections in this order:

1. `Logic model`
2. `Hidden assumptions`
3. `Failure candidates`
4. `Test and hypothesis seeds`

## Procedure

1. Model the logic.
   Identify inputs, decisions, outputs, state transitions, and side effects inside the given range.

2. Audit hidden assumptions.
   Look for assumptions about ordering, default values, nullability, timing, caching, retries, state exclusivity, dialog routing, permissions, or impossible states.

3. Check branch completeness.
   Inspect else paths, early returns, default cases, guard conditions, and negated branches for silent fallthrough or missing handling.

4. Identify logic fallacies.
   Call out false dichotomies, conflated states, stale assumptions, broken invariants, circular checks, and condition sequences that appear valid but do not prove the required outcome.

5. Produce failure candidates.
   Translate the strongest issues into concrete bug mechanisms tied to the observed behavior.

6. Produce test and hypothesis seeds.
   Suggest the smallest reads, probes, or tests that could validate the strongest failure candidates, and phrase them so they can be handed into `hypothesis-formulation`.

## Decision Points

### If the code range is too large

Shrink to the nearest control point that directly decides the suspect behavior.

### If the current hypotheses already explain the logic well

Focus on assumptions they do not cover instead of restating the same theory.

### If multiple hidden assumptions exist

Rank them by likelihood and by how cheaply they can be disproved.

## Quality Bar

Do not return a generic code review. The response is complete only when:

- the logic model is tied to a concrete code range
- hidden assumptions are explicit rather than implied
- failure candidates are testable and local
- the final seeds can be fed back into `hypothesis-formulation`
- any failing tests uncovered during review are treated as blocking seeds that must be resolved or explicitly blocked

## Response Template

### Logic model

| Element | Current behavior | Risk |
|---|---|---|
| Branch A | ... | ... |

### Hidden assumptions

| Assumption | Why it may be false | Consequence |
|---|---|---|
| ... | ... | ... |

### Failure candidates

| # | Candidate | Anchor | Why it fits the bug |
|---|---|---|---|
| 1 | ... | ... | ... |

### Test and hypothesis seeds

- ...
- ...

Keep the seeds concise so they can be fed directly into `hypothesis-formulation`.