#!/usr/bin/env node
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { homedir } from "node:os";
import { resolve } from "node:path";

const protectedBranches = new Set(["devel", "main", "master"]);
const git = (...args) => { try { return { ok: true, output: execFileSync("git", args, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim() }; } catch { return { ok: false, output: "" }; } };
const owner = (path) => { const result = git("-C", path, "rev-parse", "--show-toplevel"); return result.ok ? result.output : "unknown"; };
export function discoverNoteHints(notesDir, registered = new Set(), ownerResolver = owner) {
  if (!existsSync(notesDir)) return [];
  const hints = new Map();
  for (const file of readdirSync(notesDir).filter((name) => name.endsWith(".md")).sort()) for (const match of readFileSync(`${notesDir}/${file}`, "utf8").matchAll(/`(\/[^`\r\n]+)`|(?<![\w.-])(\/[^\s`|)]+)/g)) {
    const path = resolve((match[1] || match[2]).replace(/[.,:;\]]+$/, "")); if (!registered.has(path) && !hints.has(path)) hints.set(path, { path, note: `${notesDir}/${file}`, owner: ownerResolver(path), exists: existsSync(path) });
  }
  return [...hints.values()];
}
function entries() { const result = git("worktree", "list", "--porcelain"); if (!result.ok) throw new Error("not a Git repository or git worktree list failed"); return result.output.split("\n\n").filter(Boolean).map((block) => { const value = {}; for (const line of block.split("\n")) { const [key, ...rest] = line.split(" "); value[key] = rest.join(" ") || true; } return { path: value.worktree, head: value.HEAD || "", branch: String(value.branch || "").replace("refs/heads/", ""), locked: Boolean(value.locked), detached: Boolean(value.detached), prunable: Boolean(value.prunable) }; }); }
function main(args) { const report = args.includes("--report"); const base = args[args.indexOf("--base") + 1]; const list = entries(); const registered = new Set(list.map((entry) => resolve(entry.path))); console.log(report ? "| Worktree/path | Branch or HEAD | Current state | Merge evidence |\n| --- | --- | --- | --- |" : "| Worktree/path | Branch or HEAD | State | Merge evidence | Proposed action | Requires approval |\n| --- | --- | --- | --- | --- | --- |"); for (const entry of list) { const state = git("-C", entry.path, "status", "--porcelain").output ? "dirty" : "clean"; const merge = entry.branch && base ? (git("merge-base", "--is-ancestor", entry.branch, base).ok ? "merged" : "not merged") : "not evaluated"; const action = protectedBranches.has(entry.branch) ? "keep / protected branch" : merge === "merged" && state === "clean" ? "candidate: remove worktree" : "keep / needs investigation"; console.log(report ? `| ${entry.path} | ${entry.branch || entry.head.slice(0, 12)} | ${state} | ${merge} |` : `| ${entry.path} | ${entry.branch || entry.head.slice(0, 12)} | ${state} | ${merge} | ${action} | ${action.startsWith("keep / protected") ? "not applicable" : "yes for any removal"} |`); } for (const hint of discoverNoteHints(args[args.indexOf("--notes-dir") + 1] || `${homedir()}/.codex/notes/work-cleanup`, registered)) console.log(`| ${hint.path} | note hint | registry hint, ${hint.exists ? "exists" : "missing"}, owner: ${hint.owner} | not evaluated${report ? " |" : " | needs investigation | yes for any removal |"}`); }
if (process.argv[1] === new URL(import.meta.url).pathname) { try { main(process.argv.slice(2)); } catch (error) { console.error(`error: ${error.message}`); process.exitCode = 2; } }
