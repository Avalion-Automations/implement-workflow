#!/usr/bin/env node
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sourceRoot = join(root, ".agents", "skills");
const adapterRoot = join(root, "platforms", "claude");
const destinationRoot = join(adapterRoot, "skills");
const checkOnly = process.argv.includes("--check");
const refresh = process.argv.includes("--refresh");

// These are implementation details for Codex lifecycle telemetry. Claude Code
// has no equivalent contract, so the adapter keeps the file-backed workflow
// artifacts and omits this unavailable runtime rather than shipping inert hooks.
const omitted = new Set([
  "build/hooks/hooks.json",
  "build/references/status-protocol.md",
  "build/scripts/build-status.mjs",
  "build/scripts/build-status.test.mjs",
  "build/scripts/check-build-suite.mjs",
]);

function listFiles(directory, base = directory) {
  const result = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const absolute = join(directory, entry.name);
    if (entry.isDirectory()) result.push(...listFiles(absolute, base));
    else if (entry.isFile()) result.push(relative(base, absolute));
  }
  return result.sort();
}

function omit(path) {
  return omitted.has(path) || path.startsWith("build/assets/dashboard/");
}

function adapt(content) {
  const adapted = content
    .replaceAll("\r\n", "\n")
    .replaceAll("$basics:", "/")
    .replaceAll(/gpt-[a-z0-9.-]+/gi, "session configuration")
    .replaceAll("reasoning_effort", "effort setting")
    .replaceAll("openai.yaml", "host-ui-metadata.yaml")
    .replaceAll("SubagentStart", "host lifecycle start")
    .replaceAll("SubagentStop", "host lifecycle stop")
    .replaceAll("PreToolUse", "host tool preflight")
    .replaceAll("PostToolUse", "host tool completion")
    .replaceAll("Codex defaults to `<user-home>/.codex`; ", "")
    .replaceAll("Codex's normal plugin update", "the host's normal plugin update")
    .replaceAll("Codex JSON event", "host event")
    .replaceAll("fork_turns", "fresh-context isolation")
    .replaceAll("<plugin>", ".")
    .replaceAll("Terra", "host")
    .replaceAll("Sol", "host")
    .replaceAll("| Role | Model", "| Role | Guidance");

  // Lifecycle telemetry and its dashboard are intentionally absent from this
  // adapter. Remove instructions that would make those omitted resources an
  // operational dependency rather than leaving a dangling command or link.
  return adapted.split("\n").filter((line) => !(
    /references\/status-protocol\.md|scripts\/build-status(?:\.test)?\.mjs|scripts\/check-build-suite\.mjs|assets\/dashboard/i.test(line)
    // Claude Code supplies model and effort choices through its session. Drop
    // Codex role-selection tables and directives instead of relabeling them.
    || /session configuration|effort setting|\bhost\/(?:xhigh|high|medium|low)\b/i.test(line)
    || /^\|\s*Role\s*\|.*(?:Model|Guidance).*effort/i.test(line)
  )).join("\n");
}

function expectedFiles() {
  return listFiles(sourceRoot).filter((path) => !omit(path));
}

function matches() {
  if (!existsSync(destinationRoot)) return false;
  const expected = expectedFiles();
  const actual = listFiles(destinationRoot);
  if (JSON.stringify(expected) !== JSON.stringify(actual)) return false;
  return expected.every((path) => readFileSync(join(destinationRoot, path), "utf8")
    === adapt(readFileSync(join(sourceRoot, path), "utf8")));
}

if (!existsSync(sourceRoot)) throw new Error(`canonical skills are missing: ${sourceRoot}`);
if (checkOnly) {
  if (!matches()) throw new Error("Claude adapter drift from .agents/skills; run scripts/sync-claude-skills.mjs");
  process.stdout.write("Claude adapter matches the canonical skills with its documented capability exclusions.\n");
  process.exit(0);
}
if (existsSync(destinationRoot) && !refresh) {
  throw new Error(`refusing to overwrite ${destinationRoot}; remove or archive that generated directory explicitly, then rerun`);
}

mkdirSync(destinationRoot, { recursive: true });
for (const path of expectedFiles()) {
  const destination = join(destinationRoot, path);
  mkdirSync(dirname(destination), { recursive: true });
  writeFileSync(destination, adapt(readFileSync(join(sourceRoot, path), "utf8")));
}
process.stdout.write(`Created ${destinationRoot} from .agents/skills.\n`);
