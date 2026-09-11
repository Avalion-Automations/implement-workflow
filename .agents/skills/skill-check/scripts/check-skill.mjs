#!/usr/bin/env node
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const allowed = new Set(["name", "description", "license", "allowed-tools", "metadata"]);
const resources = ["scripts", "references", "assets"];
const allFiles = (path) => !existsSync(path) ? [] : readdirSync(path, { withFileTypes: true }).flatMap((entry) => entry.isDirectory() ? allFiles(join(path, entry.name)) : entry.isFile() ? [join(path, entry.name)] : []);

export function checkSkill(input) {
  const root = resolve(input); const findings = []; const add = (level, rule, message) => findings.push({ level, rule, message }); const file = join(root, "SKILL.md");
  if (!existsSync(file) || !statSync(file).isFile()) { add("error", "skill-md", "SKILL.md is missing."); return findings; }
  const content = readFileSync(file, "utf8"); const match = content.match(/^---\n([\s\S]*?)\n---(?:\n|$)/);
  if (!match) { add("error", "frontmatter", "Missing or invalid YAML frontmatter."); return findings; }
  const values = {};
  for (const line of match[1].split("\n")) { if (!line.trim() || /^\s/.test(line) || /^\s*#/.test(line)) continue; const entry = line.match(/^([\w-]+):\s*(.*)$/); if (!entry) { add("error", "frontmatter-yaml", `Invalid YAML: ${line}`); return findings; } values[entry[1]] = entry[2].replace(/^['"]|['"]$/g, ""); }
  const body = content.slice(match[0].length); const name = values.name?.trim(); const description = values.description?.trim();
  const unknown = Object.keys(values).filter((key) => !allowed.has(key)); if (unknown.length) add("error", "frontmatter-keys", `Unsupported frontmatter keys: ${unknown.join(", ")}.`);
  if (!name) add("error", "name", "A non-empty skill name is required."); else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name)) add("error", "name-format", "Name must use lowercase hyphen-case."); else if (name.length > 64) add("error", "name-length", "Name exceeds 64 characters.");
  if (!description) add("error", "description", "A non-empty description is required."); else if (description.length > 300) add("warning", "description-length", "Description exceeds the recommended 300 characters.");
  if (!body.trim()) add("error", "body", "Skill instructions are empty."); if (body.split(/\r?\n/).length > 500) add("error", "body-length", "Instructions exceed 500 lines; split optional detail into references."); if (/\b(?:TODO|TBD|FIXME)\b/i.test(body)) add("error", "stale-placeholder", "Instructions contain TODO, TBD, or FIXME placeholders."); if (!/^##\s+\S+/m.test(body)) add("warning", "sectioning", "Use level-two headings to make the workflow scannable.");
  for (const name of resources) { const path = join(root, name); if (existsSync(path) && !statSync(path).isDirectory()) add("error", "resource-type", `${name} exists but is not a directory.`); else if (allFiles(path).length && !body.includes(`${name}/`)) add("warning", "unreferenced-resource", `${name}/ contains files but SKILL.md does not reference that directory.`); }
  const candidates = [...body.matchAll(/\[[^\]]+\]\(([^)]+)\)/g), ...body.matchAll(/(?<![\w/])((?:scripts|references|assets)\/[A-Za-z0-9_.-]+)/g)].map((item) => item[1]);
  for (const candidate of [...new Set(candidates)]) { const target = candidate.split("#", 1)[0].trim(); if (!target || /^(https?:|mailto:)/.test(target)) continue; const destination = resolve(root, target); const rel = relative(root, destination); const sibling = destination.endsWith("/SKILL.md") && resolve(destination, "../..") === resolve(root, ".."); if ((rel.startsWith("..") || rel === "") && !sibling) add("error", "local-reference", `Reference escapes the skill directory: ${candidate}`); else if (!existsSync(destination)) add("error", "local-reference", `Referenced local resource is missing: ${candidate}`); }
  const metadata = join(root, "agents", "openai.yaml"); if (!existsSync(metadata)) add("warning", "ui-metadata", "agents/openai.yaml is absent; create it for skill discovery UI.");
  return findings;
}
function main(argv) { const strict = argv.includes("--strict"); const json = argv.includes("--json"); const path = argv.find((arg) => !arg.startsWith("--")); if (!path) throw new Error("Usage: node check-skill.mjs <skill-dir> [--strict] [--json]"); const findings = checkSkill(path); if (json) console.log(JSON.stringify(findings, null, 2)); else if (!findings.length) console.log("PASS: no structural or heuristic design findings."); else { console.log("| Level | Rule | Finding |\n| --- | --- | --- |"); findings.forEach((item) => console.log(`| ${item.level.toUpperCase()} | ${item.rule} | ${item.message} |`)); } return findings.some((item) => item.level === "error") || (strict && findings.some((item) => item.level === "warning")) ? 1 : 0; }
if (process.argv[1] === new URL(import.meta.url).pathname) { try { process.exitCode = main(process.argv.slice(2)); } catch (error) { console.error(error.message); process.exitCode = 1; } }
