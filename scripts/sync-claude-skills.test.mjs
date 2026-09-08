import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const canonical = join(root, ".agents", "skills");
const adapter = join(root, "platforms", "claude");
const packaged = join(adapter, "skills");

function directories(path) {
  return readdirSync(path, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

function files(path) {
  if (!existsSync(path)) return [];
  const result = [];
  for (const entry of readdirSync(path, { withFileTypes: true })) {
    const absolute = join(path, entry.name);
    if (entry.isDirectory()) result.push(...files(absolute));
    else if (entry.isFile()) result.push(absolute);
  }
  return result;
}

test("Claude adapter exposes every canonical skill and required contract", () => {
  assert.ok(existsSync(join(root, "CLAUDE.md")), "missing repository CLAUDE.md");
  assert.ok(existsSync(join(adapter, ".claude-plugin", "plugin.json")), "missing Claude plugin manifest");
  assert.ok(existsSync(join(adapter, "README.md")), "missing Claude adapter README");
  assert.deepEqual(directories(packaged), directories(canonical));
});

test("Claude package excludes Codex-only runtime identifiers", () => {
  assert.ok(existsSync(adapter), "missing Claude adapter package");
  const forbidden = [
    [/gpt-5(?:\.|-)/i, "Codex model ID"],
    [/reasoning_effort/, "Codex reasoning_effort field"],
    [/openai\.yaml/, "OpenAI metadata"],
    [/(?:PreToolUse|PostToolUse|SubagentStart|SubagentStop)/, "Codex lifecycle hook event"]
  ];
  for (const file of files(adapter)) {
    const content = readFileSync(file, "utf8");
    for (const [pattern, label] of forbidden) {
      assert.doesNotMatch(content, pattern, `${label} leaked into ${file}`);
    }
  }
});

test("Claude adapter documents model and capability fallbacks", () => {
  const contract = readFileSync(join(adapter, "README.md"), "utf8");
  for (const phrase of ["Model mapping", "Effort", "Fresh-context delegation", "Lifecycle hooks", "BASICS_RUNS_DIR"]) {
    assert.match(contract, new RegExp(phrase, "i"), `missing ${phrase} contract`);
  }
});
