import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const skill = readFileSync(new URL("../.agents/skills/plugin-update/SKILL.md", import.meta.url), "utf8");
const codexSync = readFileSync(new URL("../scripts/sync-codex-basics.mjs", import.meta.url), "utf8");
const claudeSync = readFileSync(new URL("../scripts/sync-claude-skills.mjs", import.meta.url), "utf8");

test("GitHub main marketplace refresh and migration are explicit and approval-gated", () => {
  assert.match(skill, /git@github\.com:Avalion-Automations\/implement-workflow\.git/);
  assert.match(skill, /Codex snapshots Git marketplaces/);
  assert.match(skill, /codex plugin marketplace upgrade personal/);
  assert.match(skill, /codex plugin marketplace add git@github\.com:Avalion-Automations\/implement-workflow\.git --ref main/);
  assert.match(skill, /explicit approval\n  that names `personal`/);
  assert.match(skill, /codex plugin marketplace remove personal/);
  assert.match(skill, /codex plugin list --json/);
  assert.match(skill, /explicit approval naming `basics@<marketplace>` and explaining/);
  assert.match(skill, /codex plugin remove basics@<marketplace> --json/);
  assert.match(skill, /node plugins\/basics\/scripts\/install-plugin\.mjs install --marketplace <marketplace>/);
  assert.match(skill, /Stop immediately\nif removal succeeds but reinstallation fails/);
  assert.match(skill, /Never delete a cache directory/);
});

test("package synchronizers ignore volatile dependency and Python cache directories", () => {
  for (const source of [codexSync, claudeSync]) {
    assert.match(source, /entry\.name === "node_modules"/);
    assert.match(source, /entry\.name === "__pycache__"/);
  }
});
