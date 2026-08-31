#!/usr/bin/env node
import { readFileSync } from "node:fs";

const required = [
  "tracking_id",
  "cycle_id",
  "hypothesis_id",
  "probe_id",
  "anchor",
  "expected_signal",
  "observed_value",
  "probe_result",
  "bug_state",
];
const probeResults = new Set(["match", "mismatch", "missing", "error"]);
const bugStates = new Set(["present", "absent", "unknown"]);

function usage() {
  console.error("Usage: validate_probe_log.js <log-file>");
  process.exit(2);
}

const file = process.argv[2];
if (!file) usage();

const lines = readFileSync(file, "utf8").replace(/^\uFEFF/, "").split(/\r?\n/);
const probeLines = lines
  .map((line, index) => ({ line, number: index + 1 }))
  .filter(({ line }) => line.startsWith("HYPOTHESIS_PROBE "));

const errors = [];
if (!probeLines.length) errors.push("No HYPOTHESIS_PROBE lines found.");

for (const { line, number } of probeLines) {
  const raw = line.slice("HYPOTHESIS_PROBE ".length);
  let payload;
  try {
    payload = JSON.parse(raw);
  } catch (error) {
    errors.push(`Line ${number}: invalid JSON: ${error.message}`);
    continue;
  }

  for (const key of required) {
    if (!(key in payload)) errors.push(`Line ${number}: missing ${key}`);
  }
  if ("probe_result" in payload && !probeResults.has(payload.probe_result)) {
    errors.push(`Line ${number}: invalid probe_result ${JSON.stringify(payload.probe_result)}`);
  }
  if ("bug_state" in payload && !bugStates.has(payload.bug_state)) {
    errors.push(`Line ${number}: invalid bug_state ${JSON.stringify(payload.bug_state)}`);
  }
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(`Valid probe log: ${probeLines.length} HYPOTHESIS_PROBE line(s).`);