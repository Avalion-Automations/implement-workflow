---
name: file-backed-debug-probe
description: Run debugging with temporary file-backed probes, stable bug IDs, and minimal reversible instrumentation. Use when reproducing a bug, attaching IDs to emitters, collecting probe logs, or managing temporary diagnostics.
argument-hint: Bug or symptom to probe
---

# File-Backed Debug Probe

Use this reference when debugging with temporary file-backed probes.

## What This Produces

- A stable bug ID for the current debugging cycle
- Probe logs written to a bug-specific log file
- Minimal temporary emitters added only where needed for the active hypothesis
- Validation that proves probes load and emit, then broader regression checks after real fixes

## Workflow

1. Choose a bug ID before adding or running probes.
2. Add the smallest reversible emitters needed for the active hypothesis.
3. Attach the bug ID directly to those emitters or to the active debug call path.
4. Prefer an existing shared debug helper over ad hoc file logging code when available.
5. Run the cheapest focused validation that proves the probe loads and emits.
6. Reproduce the bug and read the log for the active bug ID.
7. Evaluate the evidence, then either narrow the fix or refine the probes.
8. After any real code fix, rerun focused validation and then the relevant broader regression checks for the touched surface.
9. Remove or disable transient probes when the session ends unless they remain intentionally useful.

## Bug ID Rules

- The agent sets the bug ID; do not require manual user config edits for probe wiring.
- Prefer an existing debugging session tracking ID when one exists.
- Otherwise use a deterministic ID such as `bug-YYYYMMDD-HHMMSS-shorttopic`.
- Keep the same bug ID across pre-fix and post-fix runs for the same debugging cycle.

## Emitter Rules

- When logging to file, route through a shared debug helper if one exists in the codebase.
- The emitter should tolerate a missing logs directory and create it as needed.
- Append to the active bug log; do not overwrite prior entries for the same cycle.
- Keep payloads compact and structured enough to compare pre-fix and post-fix runs.
- Log only controlling state, branch decisions, and failure messages needed to disconfirm the active hypothesis.

## Validation Rules

- After probe edits, run the cheapest focused validation first.
- Before finishing substantive code changes, run the relevant full regression checks for the touched area.
- If the stack has an escape or path-literal audit requirement, run it before finishing and treat findings as blocking unless explicitly intentional.

## Completion Checks

- The current bug log exists and can be read for the active bug ID.
- Probe evidence is sufficient to confirm, reject, or narrow the active hypothesis.
- Focused validation and required regression checks pass after any substantive fix.