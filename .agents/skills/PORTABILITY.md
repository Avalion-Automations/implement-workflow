# Skill portability

Every skill in this directory is canonical source. A host may package all of
them, but it must disclose missing capabilities before it runs a
capability-dependent workflow.

- **Portable:** audit-regression-readiness, bug-finding-review,
  bug-list-generator, bug-validation-and-regression,
  capture-behavioral-baseline, debugging-evidence-capture, doc-baseline,
  feat-commit-no-scope, hypothesis-evaluation, hypothesis-formulation,
  hypothesis-instrumentation, review-promote-docs, run, run-ledger-times,
  skill-check, verify, and work-cleanup.
- **Capability-dependent:** brainstorm, build, blue-team,
  failing-test-generator, fixer-team, and red-team. These need one or more of
  fresh-context delegation, worktrees, lifecycle hooks, or status telemetry.

See `../adapter-contract.md` for the capability contract and fallbacks.
