---
name: error-recovery-loop
description: 'Recover from tool errors, shell failures, validation breaks, and workaround-driven detours with a short, explicit loop that records the failure, applies the smallest fix, reruns the narrow check, and captures the lesson.'
argument-hint: 'Provide the failing step, observed error, latest attempted fix, and the next narrow validation you can run.'
user-invocable: true
disable-model-invocation: false
---

# Error Recovery Loop

Use this skill after tool failure, shell issue, validation break, or workaround.

## Goal
- Recover without widening scope.
- Preserve evidence.
- Retry the narrowest discriminating check.
- Record the failure and reusable lesson.

## Procedure
1. Restate the failing action in one line.
2. Capture the concrete error text, exit code, or missing file/path.
3. Classify the failure source: command bug, path bug, environment gap, quoting issue, validation defect, or wrong assumption.
4. Choose the smallest direct fix for the classified cause.
5. Rerun the narrowest validation that proves the fix.
6. If the rerun still fails, update the classification before making a second fix.
7. Record the failure, fix, and residual risk in session memory when the task is non-trivial.

## Guardrails
- Do not silently continue past a failed command that matters to the task.
- Prefer fixing the failing invocation over adding fallback complexity.
- Do not reopen broad exploration between a fix and its first rerun.
- If the environment is missing a required file or tool, repair the missing dependency at the source when safe.

## Output Checklist
- What failed.
- Why it failed.
- What changed.
- What check passed after the fix.
- What remains blocked, if anything.
