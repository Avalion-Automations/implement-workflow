#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const suiteRoot = resolve(process.argv[2] || dirname(dirname(dirname(fileURLToPath(import.meta.url)))));
const names = ["build", "brainstorm", "blue-team", "red-team", "fixer-team"];
const limits = { build: 1000, total: 4250 };
const errors = [];
let total = 0;

for (const name of names) {
  const path = join(suiteRoot, name, "SKILL.md");
  if (!existsSync(path)) { errors.push(`Missing ${path}`); continue; }
  const content = readFileSync(path, "utf8");
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  total += words;
  if (name === "build" && words > limits.build) errors.push(`build/SKILL.md has ${words} words (limit ${limits.build})`);
  if (!content.includes('fork_turns: "none"')) errors.push(`${name}/SKILL.md does not enforce fresh-context delegation`);
  if (!content.includes("references/orchestration-contract.md")) errors.push(`${name}/SKILL.md does not link the shared contract`);
  for (const link of content.matchAll(/\[[^\]]+\]\(([^)]+\.md)\)/g)) {
    const target = resolve(dirname(path), link[1]);
    if (!existsSync(target)) errors.push(`${name}/SKILL.md has missing link ${link[1]}`);
  }
}

if (total > limits.total) errors.push(`Combined SKILL.md word count is ${total} (limit ${limits.total})`);
const fixer = readFileSync(join(suiteRoot, "fixer-team", "SKILL.md"), "utf8");
if (/no arbitrary iteration limit/i.test(fixer)) errors.push("Fixer still contains the unbounded-iteration instruction");
const build = readFileSync(join(suiteRoot, "build", "SKILL.md"), "utf8");
if (!build.includes("Invoke `$implement:red-team` once") || !build.includes("At most one scoped Fixer/Judge pass")) errors.push("Build does not enforce the fast single-pass assurance boundary");
if (!build.includes("time-budget") || !build.includes("45 minutes")) errors.push("Build does not enforce the elapsed-time gate");
const hooksPath = join(suiteRoot, "build", "hooks", "hooks.json");
if (!existsSync(hooksPath)) errors.push("Build is missing hooks/hooks.json");
else {
  try {
    const hookConfig = JSON.parse(readFileSync(hooksPath, "utf8"));
    const requiredEvents = ["SubagentStart", "SubagentStop", "PreToolUse", "PostToolUse", "Stop"];
    for (const event of requiredEvents) if (!Array.isArray(hookConfig.hooks?.[event])) errors.push(`Build hooks are missing ${event}`);
    if (hookConfig.hooks?.UserPromptSubmit) errors.push("Build hooks must not automate approval from UserPromptSubmit");
  } catch (error) {
    errors.push(`Build hooks are invalid JSON: ${error.message}`);
  }
}
if (!fixer.includes("Process the complete eligible set in one Planner/Builder/Adversary/Judge batch")) errors.push("Fixer does not define Build's single batch mode");
const red = readFileSync(join(suiteRoot, "red-team", "SKILL.md"), "utf8");
if (!red.includes("as `deferred`") || !red.includes("Return one `red-1.json`")) errors.push("Red does not define Build's scoped deferral mode");
const contract = readFileSync(join(suiteRoot, "build", "references", "orchestration-contract.md"), "utf8");
for (const name of names.filter((name) => name !== "build")) {
  const copy = readFileSync(join(suiteRoot, name, "references", "orchestration-contract.md"), "utf8");
  if (copy !== contract) errors.push(`${name} orchestration contract is stale`);
}

if (errors.length) {
  for (const error of errors) process.stderr.write(`ERROR: ${error}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(`Build suite lint passed: ${total} words across ${names.length} skills.\n`);
}
