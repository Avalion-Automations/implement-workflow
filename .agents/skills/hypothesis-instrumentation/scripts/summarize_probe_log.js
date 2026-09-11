#!/usr/bin/env node
import { readFileSync } from "node:fs";

function usage() {
  console.error("Usage: summarize_probe_log.js <log-file>");
  process.exit(2);
}

const file = process.argv[2];
if (!file) usage();

const summary = new Map();
const lines = readFileSync(file, "utf8").replace(/^\uFEFF/, "").split(/\r?\n/);
for (const line of lines) {
  if (!line.startsWith("HYPOTHESIS_PROBE ")) continue;
  let payload;
  try {
    payload = JSON.parse(line.slice("HYPOTHESIS_PROBE ".length));
  } catch {
    continue;
  }
  const tracking = payload.tracking_id ?? "unknown-tracking";
  const hypothesis = payload.hypothesis_id ?? "unknown-hypothesis";
  const probe = payload.probe_id ?? "unknown-probe";
  const key = `${tracking}\t${hypothesis}\t${probe}`;
  const row = summary.get(key) ?? {
    tracking_id: tracking,
    hypothesis_id: hypothesis,
    probe_id: probe,
    anchor: payload.anchor ?? "",
    counts: { match: 0, mismatch: 0, missing: 0, error: 0 },
    bug_state: { present: 0, absent: 0, unknown: 0 },
  };
  if (payload.probe_result in row.counts) row.counts[payload.probe_result] += 1;
  if (payload.bug_state in row.bug_state) row.bug_state[payload.bug_state] += 1;
  summary.set(key, row);
}

console.log(JSON.stringify([...summary.values()], null, 2));