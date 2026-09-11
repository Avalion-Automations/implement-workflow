import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const root = new URL("../", import.meta.url);
const readJson = (path) => JSON.parse(readFileSync(new URL(path, root), "utf8"));
const plainSemver = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
const adapterVersion = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)\+(codex|claude)\.(\d{14})$/;

test("product generation uses plain semantic versioning", () => {
  const product = readJson("product.json");
  assert.equal(product.schemaVersion, 1);
  assert.equal(product.name, "basics");
  assert.match(product.version, plainSemver);
});

test("Codex manifests share one adapter-qualified version", () => {
  const canonical = readJson("platforms/codex/plugin.json");
  const packaged = readJson("plugins/basics/.codex-plugin/plugin.json");
  assert.equal(packaged.version, canonical.version);
  assert.equal(canonical.version.match(adapterVersion)?.[4], "codex");
});

test("Claude plugin and marketplace share one adapter-qualified version", () => {
  const plugin = readJson("platforms/claude/.claude-plugin/plugin.json");
  const marketplace = readJson(".claude-plugin/marketplace.json");
  const listed = marketplace.plugins.find(({ name }) => name === plugin.name);
  assert.ok(listed, "Claude marketplace is missing the Basics plugin");
  assert.equal(listed.version, plugin.version);
  assert.equal(plugin.version.match(adapterVersion)?.[4], "claude");
});
