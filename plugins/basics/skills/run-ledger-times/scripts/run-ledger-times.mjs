#!/usr/bin/env node
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const LEDGER_NAME = "run-ledger.json";

export function duration(milliseconds) {
  const seconds = Math.max(0, Math.floor(milliseconds / 1000));
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainder = seconds % 60;
  const parts = [];
  if (days) parts.push(`${days}d`);
  if (days || hours) parts.push(`${hours}h`);
  if (days || hours || minutes) parts.push(`${minutes}m`);
  parts.push(`${remainder}s`);
  return parts.join(" ");
}

function instant(value, label) {
  const milliseconds = Date.parse(value);
  if (!Number.isFinite(milliseconds)) throw new Error(`${label} is not an ISO timestamp`);
  return milliseconds;
}

function markdown(value) {
  return String(value).replaceAll("|", "\\|").replaceAll("\n", " ");
}

function formatTime(milliseconds, timezone) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    hourCycle: "h23", timeZoneName: "shortOffset",
  }).format(new Date(milliseconds));
}

function terminalStatus(ledger) {
  const integration = ledger?.stages?.integration?.status;
  if (integration) return integration;
  const stages = Object.values(ledger?.stages ?? {});
  return stages.at(-1)?.status ?? "unknown";
}

export function readLedger(path) {
  const value = JSON.parse(readFileSync(path, "utf8"));
  if (!value || typeof value !== "object" || !value.runId) throw new Error("missing runId");
  const created = instant(value.createdAt, "createdAt");
  const updated = instant(value.updatedAt, "updatedAt");
  if (updated < created) throw new Error("updatedAt precedes createdAt");
  return { path: resolve(path), runId: value.runId, created, updated, status: terminalStatus(value) };
}

function discover(root, maximumDepth = 7) {
  const found = [];
  const visit = (path, depth) => {
    if (depth > maximumDepth) return;
    let entries;
    try { entries = readdirSync(path, { withFileTypes: true }); } catch { return; }
    for (const entry of entries) {
      const child = join(path, entry.name);
      if (entry.isFile() && entry.name === LEDGER_NAME) found.push(resolve(child));
      else if (entry.isDirectory() && !entry.isSymbolicLink()) visit(child, depth + 1);
    }
  };
  if (existsSync(root) && statSync(root).isDirectory()) visit(resolve(root), 0);
  return found;
}

function argumentsFor(tokens) {
  const options = { ledgers: [], roots: [], now: new Date().toISOString(), timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC" };
  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (["--ledger", "--root", "--now", "--timezone"].includes(token) && !tokens[index + 1]) throw new Error(`${token} requires a value`);
    if (token === "--ledger") options.ledgers.push(resolve(tokens[++index]));
    else if (token === "--root") options.roots.push(resolve(tokens[++index]));
    else if (token === "--now") options.now = tokens[++index];
    else if (token === "--timezone") options.timezone = tokens[++index];
    else if (token === "--help" || token === "-h") options.help = true;
    else throw new Error(`unknown option: ${token}`);
  }
  return options;
}

export function render(ledgers, now, timezone) {
  const ordered = [...ledgers].sort((left, right) => left.created - right.created);
  const earliest = ordered[0].created;
  const latest = ordered.at(-1);
  const recordedTotal = ordered.reduce((sum, ledger) => sum + ledger.updated - ledger.created, 0);
  const wall = now - earliest;
  const indicator = wall - recordedTotal;
  const lines = [
    "# Run Ledger Timing", "",
    `Generated: ${formatTime(now, timezone)} (${markdown(timezone)})`, "",
    "| Run | Status | Started | Last update | Recorded span | Wall elapsed | Idle since update | Ledger |",
    "| --- | --- | --- | --- | ---: | ---: | ---: | --- |",
    ...ordered.map((ledger) => `| ${markdown(ledger.runId)} | ${markdown(ledger.status)} | ${formatTime(ledger.created, timezone)} | ${formatTime(ledger.updated, timezone)} | ${duration(ledger.updated - ledger.created)} | ${duration(now - ledger.created)} | ${duration(now - ledger.updated)} | ${markdown(ledger.path)} |`),
    "", "## Aggregate", "",
    `- End-to-end wall elapsed: **${duration(wall)}**`,
    `- Sum of recorded run spans: **${duration(recordedTotal)}**`,
    `- Latest run wall elapsed (${markdown(latest.runId)}): **${duration(now - latest.created)}**`,
    `- Gap/overlap indicator: **${duration(Math.abs(indicator))}** ${indicator >= 0 ? "not covered by recorded spans" : "of overlapping recorded spans"}`,
    "", "> Recorded spans are ledger update windows, not proof of active compute time. Summed spans may overlap.", "",
  ];
  return lines.join("\n");
}

export function main(tokens = process.argv.slice(2)) {
  const options = argumentsFor(tokens);
  if (options.help) {
    process.stdout.write("Usage: run-ledger-times.mjs [--ledger PATH] [--root PATH] [--now ISO] [--timezone IANA]\n");
    return 0;
  }
  const now = instant(options.now, "--now");
  try { new Intl.DateTimeFormat("en", { timeZone: options.timezone }); } catch { throw new Error(`invalid timezone: ${options.timezone}`); }
  if (!options.ledgers.length && !options.roots.length) {
    options.roots.push(...[process.env.BASICS_RUNS_DIR, join(homedir(), ".codex", "build-runs"), resolve(".codex", "build-runs")].filter(Boolean));
  }
  const paths = [...new Set([...options.ledgers, ...options.roots.flatMap((root) => discover(root))])];
  const ledgers = [];
  for (const path of paths) {
    try { ledgers.push(readLedger(path)); }
    catch (error) { process.stderr.write(`Skipping ${path}: ${error.message}\n`); }
  }
  if (!ledgers.length) throw new Error("no valid run ledgers found");
  process.stdout.write(render(ledgers, now, options.timezone));
  return 0;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { process.exitCode = main(); }
  catch (error) { process.stderr.write(`${error.message}\n`); process.exitCode = 1; }
}
