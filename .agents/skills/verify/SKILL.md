---
name: verify
description: Verify a code change by building, launching, and observing the real behavior or user flow end to end.
---

# Verify

Prove the change works in the running system. Tests and type checks can support verification, but they are not enough by themselves when runtime observation is possible.

## Workflow

1. Identify the claim to verify in one sentence.
2. Inspect the diff or changed files and map the claim to observable behavior.
3. Run `scripts/verify_plan.js --claim "<claim>" --root <project>` for a checklist scaffold.
4. Build or test the smallest prerequisite needed to launch confidently.
5. Launch using the `run` skill workflow or an existing project run recipe.
6. Exercise the behavior directly and capture evidence before and after when practical.
7. Report pass/fail with exact evidence, commands, logs, URLs, screenshots, or remaining gaps.

## Claim And Evidence

Write the claim as `<actor> can/cannot <behavior> under <condition>`.

Prefer evidence in this order:

1. Direct runtime observation of the target flow
2. Browser, API, or CLI automation with assertions
3. Focused integration test exercising the same path
4. Unit test plus code inspection
5. Static analysis, clearly labeled partial

Use this final report shape:

```text
Claim: <claim>
Result: pass/fail/partial
Evidence: <commands and observations>
Residual risk: <what was not exercised>
```

## Guardrails

- Do not mark verified when only static checks passed unless launch is impossible; call that out as partial verification.
- Prefer one high-signal user flow over many shallow checks.
- Include negative checks for bug fixes when the old failure mode is known.
- Stop and report blockers when environment, credentials, data, or approvals prevent runtime proof.
