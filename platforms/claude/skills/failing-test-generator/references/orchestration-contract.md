# Orchestration contract

## Roles


Never launch a worker before the contract is confirmed. Use fresh context (`fresh-context isolation: "none"`) and pass only task-local material:

- contract criteria and explicit non-goals;
- source and existing-test paths needed for the assignment;
- test command and expected test location;
- allowed paths: tests, fixtures, and narrowly necessary test configuration.

## Test contract format

| ID | Behavior | Setup/input | Observable assertion | Non-goal | Evidence |
| --- | --- | --- | --- | --- | --- |
| TEST-001 | | | | | Prompt/repository path |

Use test names that include the criterion ID. Prefer black-box behavior over implementation details. Cover unhappy paths only when contractually specified or required to preserve an explicit invariant. Do not write snapshot-only tests for a behavior that needs an assertion.

## Worker completion receipt

Each worker returns changed paths, criteria covered, test command and result, expected failure explanation, uncovered criteria, and any conflict with the contract. The orchestrator must independently run the received tests before committing.

## Expected failure rules

A failure is intentional only if it fails because the current implementation does not meet a confirmed criterion. Compilation errors, missing test tooling, broken imports, flaky assertions, unrelated failures, and incorrectly configured fixtures are blockers—not expected failures. Repair test infrastructure only when it is strictly necessary to execute the tests and stays inside the test-only scope.
