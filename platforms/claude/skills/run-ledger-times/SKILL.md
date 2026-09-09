---
name: run-ledger-times
description: Read durable Basics Build run ledgers and summarize wall elapsed, recorded run span, and idle time as a Markdown table. Use when TUI timers reset, multiple continuation runs need one timeline, or a user asks how long a workflow has been running.
---

# Run Ledger Times

## Generate the Report

Use the bundled read-only script to report timing from authoritative
`run-ledger.json` files:

```bash
node scripts/run-ledger-times.mjs [--ledger PATH] [--root PATH] [--now ISO] [--timezone IANA]
```

- Repeat `--ledger` for known files or `--root` for bounded discovery below a
  run archive. With no arguments, the script checks `BASICS_RUNS_DIR`,
  `~/.codex/build-runs`, and `./.codex/build-runs` when they exist.
- Use `--now` only for reproducible checks or historical reporting.
- Use an IANA timezone such as `America/Santo_Domingo`; the default is the
  host timezone.

## Interpret the Clocks

Return the generated Markdown without reinterpreting the clocks:

- **Wall elapsed** is `now - createdAt` and includes pauses or gaps.
- **Recorded span** is `updatedAt - createdAt`; it is not active compute time.
- **Idle since update** is `now - updatedAt`.
- Summed recorded spans may overlap and must not be called active time.

If the user asks for true active compute time, state that ledgers do not prove
it unless explicit start/stop telemetry exists. Never infer activity from a
lock file, TUI timer, or conversation state alone.

## Safety

The skill is read-only: do not rewrite ledgers, repair timestamps, or delete
run artifacts while producing the report.
