import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const skill = readFileSync(new URL("../.agents/skills/plugin-update/SKILL.md", import.meta.url), "utf8");
const codexSync = readFileSync(new URL("../scripts/sync-codex-basics.mjs", import.meta.url), "utf8");
const claudeSync = readFileSync(new URL("../scripts/sync-claude-skills.mjs", import.meta.url), "utf8");

test("local marketplace stale-cache recovery is explicit and approval-gated", () => {
  assert.match(skill, /codex plugin list --json/);
  assert.match(skill, /local marketplace/);
  assert.match(skill, /explicit approval naming `basics@<marketplace>` and the\ninformation-loss consequence/);
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
