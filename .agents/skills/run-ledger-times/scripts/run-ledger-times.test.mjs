import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { duration, main, readLedger, render } from "./run-ledger-times.mjs";

function fixture(root, runId, createdAt, updatedAt, status = "completed") {
  const directory = join(root, runId, "status", "handoffs");
  mkdirSync(directory, { recursive: true });
  const path = join(directory, "run-ledger.json");
  writeFileSync(path, JSON.stringify({ runId, createdAt, updatedAt, stages: { integration: { status } } }));
  return path;
}

test("formats stable durations", () => {
  assert.equal(duration(0), "0s");
  assert.equal(duration(90061000), "1d 1h 1m 1s");
});

test("renders distinct clocks and aggregate timing", () => {
  const root = mkdtempSync(join(tmpdir(), "run-ledger-times-"));
  const first = readLedger(fixture(root, "run-a", "2026-09-01T00:00:00Z", "2026-09-01T01:00:00Z"));
  const second = readLedger(fixture(root, "run-b", "2026-09-01T02:00:00Z", "2026-09-01T02:30:00Z", "blocked"));
  const output = render([second, first], Date.parse("2026-09-01T03:00:00Z"), "UTC");
  assert.match(output, /run-a \| completed/);
  assert.match(output, /run-b \| blocked/);
  assert.match(output, /End-to-end wall elapsed: \*\*3h 0m 0s\*\*/);
  assert.match(output, /Sum of recorded run spans: \*\*1h 30m 0s\*\*/);
  assert.match(output, /Latest run wall elapsed \(run-b\): \*\*1h 0m 0s\*\*/);
  assert.match(output, /not proof of active compute time/);
});

test("discovers ledgers below an explicit root", () => {
  const root = mkdtempSync(join(tmpdir(), "run-ledger-times-cli-"));
  fixture(root, "run-c", "2026-09-01T00:00:00Z", "2026-09-01T00:05:00Z");
  let output = "";
  const write = process.stdout.write;
  process.stdout.write = (value) => { output += value; return true; };
  try { assert.equal(main(["--root", root, "--now", "2026-09-01T00:10:00Z", "--timezone", "UTC"]), 0); }
  finally { process.stdout.write = write; }
  assert.match(output, /run-c/);
  assert.match(output, /10m 0s/);
  assert.match(output, /5m 0s/);
});
