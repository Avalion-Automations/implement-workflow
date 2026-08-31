---
name: debugging-evidence-capture
description: Capture actionable debugging evidence and recovery state. Use for minimal reproductions, observability probes, file-backed debug probes, error-recovery loops, failure logs, and deciding the next narrow diagnostic step after a tool, shell, validation, or runtime failure.
---

# Debugging Evidence Capture

Use this skill when the main problem is not yet enough evidence.

## Workflow

1. Record the symptom, command or action, observed output, and expected behavior.
2. Choose whether the next artifact should be a minimal repro, observability capture, file-backed probe, or recovery loop.
3. Keep probes small and reversible.
4. Preserve raw evidence before summarizing it.
5. End with the next falsifiable hypothesis or validation step.

## Reference Selection

- For minimal reproduction design, read `references/minimal-repro-design.md`.
- For logging, traces, screenshots, or probe capture, read `references/observability-capture.md`.
- For temporary file-backed probes with stable bug IDs, read `references/file-backed-debug-probe.md`.
- For failed tools, commands, tests, or validation loops, read `references/error-recovery-loop.md`.
## Scripts

- Use `scripts/new_debug_cycle.js <topic> [log-dir]` to create a stable bug ID and initialize a log file.