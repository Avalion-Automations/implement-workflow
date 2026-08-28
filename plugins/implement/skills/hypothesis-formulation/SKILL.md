---
name: hypothesis-formulation
description: Turn symptoms, raw suspicions, weak hypothesis bullets, or vague failures into a reviewed list of falsifiable debugging hypotheses that can be passed directly to hypothesis-instrumentation. Use for triage, root-cause analysis, hypothesis normalization, and debugging across languages.
---

# Hypothesis Formulation

Translate a debugging problem statement into a small, ranked, user-reviewed set of falsifiable hypotheses that can be handed directly to `hypothesis-instrumentation`.

## Workflow

1. Frame the symptom, expected versus actual behavior, known scope, and best current anchor.
2. Generate 3 to 7 localized hypotheses unless the evidence strongly supports fewer.
3. For each hypothesis, define the mechanism, expected signal, disproof condition, and nearest anchor.
4. Rank by locality, discriminating value, and testing cost.
5. Ask the user which hypotheses to keep and whether to add any missing ones when interaction is available.
6. Deduplicate and renormalize the kept set into a concise handoff.

## References

- For the exact output contract, decision points, quality bar, and response template, read `references/formulation-output-contract.md`.
