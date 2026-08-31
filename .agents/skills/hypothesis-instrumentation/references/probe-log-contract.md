# Probe Log Contract

All probes must emit log lines using this exact prefix plus a JSON payload:

`HYPOTHESIS_PROBE {json}`

The first emitted line must include the tracking ID to enable log auto-discovery. Every emitted probe line should include it.

## Required Payload Keys

- `tracking_id`: debugging session ID
- `cycle_id`
- `hypothesis_id`
- `probe_id`
- `anchor`
- `expected_signal`
- `observed_value`
- `probe_result`: one of `match`, `mismatch`, `missing`, or `error`
- `bug_state`: one of `present`, `absent`, or `unknown`

## Optional Payload Keys

- `note`
- `timestamp`

## Artifact Location

State where the current run should leave the log artifact: file path, stderr, test output, terminal output, or another concrete source that the agent can inspect next. Prefer naming the log file with the tracking ID, for example `debug-{tracking_id}.log`.

## Example

`HYPOTHESIS_PROBE {"tracking_id":"bug-20260601-143025-a7f2","cycle_id":"cycle-1","hypothesis_id":"H1","probe_id":"P1","anchor":"activationDialog.open","expected_signal":"wrong dialog branch is chosen","observed_value":"licenseExpiredDialog","probe_result":"match","bug_state":"present"}`

## Script Validation

Run `scripts/validate_probe_log.js <log-file>` before passing logs to `hypothesis-evaluation` when a file is available.