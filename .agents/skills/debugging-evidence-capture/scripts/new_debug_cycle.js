#!/usr/bin/env node
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

function slug(value) {
  return String(value ?? "debug")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "debug";
}

const topic = slug(process.argv[2]);
const now = new Date();
const stamp = now.toISOString().replace(/[-:]/g, "").replace(/T/, "-").slice(0, 15);
const trackingId = `bug-${stamp}-${topic}`;
const logDir = process.argv[3] || "debug-logs";
const logPath = join(logDir, `${trackingId}.log`);

mkdirSync(logDir, { recursive: true });
writeFileSync(logPath, "", { flag: "a" });
console.log(JSON.stringify({ tracking_id: trackingId, log_path: logPath }, null, 2));