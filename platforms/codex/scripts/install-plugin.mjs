#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import {
  existsSync,
  readFileSync,
  renameSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const pluginRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const manifestRelative = ".codex-plugin/plugin.json";
const hooksRelative = "hooks/hooks.json";
const statusScriptRelative = "skills/build/scripts/build-status.mjs";
const posixRootToken = "$PLUGIN_ROOT";
const windowsRootToken = "%PLUGIN_ROOT%";

function fail(message) {
  throw new Error(message);
}

function readJson(file, label) {
  try {
    return JSON.parse(readFileSync(file, "utf8"));
  } catch (error) {
    fail(`${label} must be valid JSON (${file}): ${error.message}`);
  }
}

function pathInside(root, candidate) {
  const segment = relative(root, candidate);
  return segment === "" || (!segment.startsWith("..") && !isAbsolute(segment));
}

function requiredOption(options, name) {
  if (!options[name]) fail(`--${name} is required`);
  return options[name];
}

function parseOptions(tokens) {
  const options = {};
  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (!token.startsWith("--")) fail(`unexpected argument: ${token}`);
    const key = token.slice(2);
    if (key === "dry-run") {
      options[key] = true;
      continue;
    }
    const value = tokens[index + 1];
    if (!value || value.startsWith("--")) fail(`--${key} requires a value`);
    options[key] = value;
    index += 1;
  }
  return options;
}

export function readPlugin(root) {
  const absoluteRoot = resolve(root);
  const manifestPath = join(absoluteRoot, manifestRelative);
  if (!existsSync(manifestPath)) fail(`plugin manifest is missing: ${manifestPath}`);
  const manifest = readJson(manifestPath, "plugin manifest");
  if (!manifest || typeof manifest.name !== "string" || typeof manifest.version !== "string") {
    fail(`plugin manifest must contain string name and version: ${manifestPath}`);
  }
  return { root: absoluteRoot, manifestPath, manifest };
}

function readInstalledPlugin(destination) {
  const absoluteDestination = resolve(destination);
  const manifestPath = join(absoluteDestination, manifestRelative);
  if (!existsSync(manifestPath)) return null;
  return readPlugin(absoluteDestination);
}

function ensureInstalledMatchesSource(source, installed) {
  if (!installed) fail(`installed plugin is missing: ${join(source.root, "..", "<destination>")}`);
  if (source.manifest.name !== installed.manifest.name) {
    fail(`installed plugin name ${installed.manifest.name} does not match source ${source.manifest.name}`);
  }
  if (source.manifest.version !== installed.manifest.version) {
    fail(`installed plugin is stale: source ${source.manifest.version}, installed ${installed.manifest.version}`);
  }
}

function hookEntries(config) {
  if (!config || typeof config !== "object" || !config.hooks || typeof config.hooks !== "object") {
    fail("hook configuration must contain a hooks object");
  }
  const entries = [];
  for (const [event, groups] of Object.entries(config.hooks)) {
    if (!Array.isArray(groups) || groups.length !== 1 || !Array.isArray(groups[0]?.hooks) || groups[0].hooks.length !== 1) {
      fail(`${event} must have exactly one hook handler`);
    }
    entries.push({ event, hook: groups[0].hooks[0] });
  }
  return entries;
}

function scriptPath(destination) {
  const resolvedDestination = resolve(destination);
  const resolvedScript = resolve(resolvedDestination, statusScriptRelative);
  if (!pathInside(resolvedDestination, resolvedScript)) fail("installed status script escapes plugin destination");
  if (!existsSync(resolvedScript)) fail(`installed status script is missing: ${resolvedScript}`);
  if (resolvedScript.includes('"')) fail(`installed status script path cannot contain a double quote: ${resolvedScript}`);
  return resolvedScript;
}

function windowsScriptPath(path) {
  return process.platform === "win32" ? path : path.replaceAll("/", "\\");
}

function materializeCommand(template, token, path, event, field) {
  if (typeof template !== "string" || !template.includes(token)) {
    fail(`${event}.${field} must contain the ${token} installation placeholder`);
  }
  const materialized = template.replaceAll(token, path);
  if (materialized.includes(posixRootToken) || materialized.includes(windowsRootToken)) {
    fail(`${event}.${field} still contains a plugin-root placeholder after materialization`);
  }
  return materialized;
}

export function inspectInstall({ sourceRoot = pluginRoot, destination }) {
  if (!destination) fail("--destination is required to inspect an installed plugin");
  const source = readPlugin(sourceRoot);
  const installed = readInstalledPlugin(destination);
  return {
    source: { root: source.root, name: source.manifest.name, version: source.manifest.version },
    installed: installed
      ? { root: installed.root, name: installed.manifest.name, version: installed.manifest.version }
      : null,
    stale: !installed || source.manifest.name !== installed.manifest.name || source.manifest.version !== installed.manifest.version,
  };
}

export function materializeHooks({ sourceRoot = pluginRoot, destination, dryRun = false }) {
  if (!destination) fail("--destination is required");
  const source = readPlugin(sourceRoot);
  const installed = readInstalledPlugin(destination);
  ensureInstalledMatchesSource(source, installed);
  if (source.root === installed.root) fail("source and installed plugin roots must be distinct");

  const sourceHooksPath = join(source.root, hooksRelative);
  if (!existsSync(sourceHooksPath)) fail(`source hook configuration is missing: ${sourceHooksPath}`);
  const sourceConfig = readJson(sourceHooksPath, "source hook configuration");
  const config = JSON.parse(JSON.stringify(sourceConfig));
  const script = scriptPath(installed.root);
  const windowsRoot = windowsScriptPath(installed.root);
  const commands = {};
  for (const { event, hook } of hookEntries(config)) {
    if (hook.type !== "command") fail(`${event} hook must have type command`);
    hook.command = materializeCommand(hook.command, posixRootToken, installed.root, event, "command");
    hook.commandWindows = materializeCommand(hook.commandWindows, windowsRootToken, windowsRoot, event, "commandWindows");
    commands[event] = hook.command;
  }

  const destinationHooksPath = join(installed.root, hooksRelative);
  const content = `${JSON.stringify(config, null, 2)}\n`;
  const previous = existsSync(destinationHooksPath) ? readFileSync(destinationHooksPath, "utf8") : null;
  const changed = previous !== content;
  if (changed && !dryRun) {
    const temporaryPath = `${destinationHooksPath}.materializing`;
    if (existsSync(temporaryPath)) fail(`stale hook materialization file exists: ${temporaryPath}`);
    writeFileSync(temporaryPath, content, { encoding: "utf8", mode: statSync(sourceHooksPath).mode });
    renameSync(temporaryPath, destinationHooksPath);
  }
  return {
    sourceVersion: source.manifest.version,
    installedVersion: installed.manifest.version,
    destination: installed.root,
    script,
    changed,
    dryRun,
    commands,
  };
}

function runCodexPluginAdd(plugin, marketplace) {
  const result = spawnSync("codex", ["plugin", "add", `${plugin}@${marketplace}`, "--json"], { encoding: "utf8" });
  if (result.error) fail(`could not run codex plugin add: ${result.error.message}`);
  if (result.status !== 0) fail(`codex plugin add failed: ${(result.stderr || result.stdout || "unknown error").trim()}`);
  const installed = readJsonFromText(result.stdout, "codex plugin add output");
  if (typeof installed.installedPath !== "string" || !isAbsolute(installed.installedPath)) {
    fail("codex plugin add did not return an absolute installedPath");
  }
  return { status: result.status, stdout: result.stdout || "", stderr: result.stderr || "", installedPath: resolve(installed.installedPath) };
}

function readJsonFromText(value, label) {
  try {
    return JSON.parse(value);
  } catch (error) {
    fail(`${label} must be valid JSON: ${error.message}`);
  }
}

export function installPlugin({
  sourceRoot = pluginRoot,
  destination,
  marketplace = "personal",
  executePluginAdd = runCodexPluginAdd,
  dryRun = false,
}) {
  const source = readPlugin(sourceRoot);
  const requestedDestination = destination ? resolve(destination) : null;
  const before = requestedDestination ? inspectInstall({ sourceRoot: source.root, destination: requestedDestination }) : null;
  if (dryRun) {
    return { before, action: `codex plugin add ${source.manifest.name}@${marketplace} --json`, requestedDestination, dryRun: true };
  }
  const installed = executePluginAdd(source.manifest.name, marketplace);
  const selectedDestination = installed.installedPath ? resolve(installed.installedPath) : requestedDestination;
  if (!selectedDestination) fail("codex plugin add did not report an installed destination");
  if (requestedDestination && requestedDestination !== selectedDestination) {
    fail(`Codex selected ${selectedDestination}, not the requested installation destination ${requestedDestination}`);
  }
  const materialized = materializeHooks({ sourceRoot: source.root, destination: selectedDestination });
  return { before, installedDestination: selectedDestination, materialized, dryRun: false };
}

function main() {
  const [command, ...tokens] = process.argv.slice(2);
  const options = parseOptions(tokens);
  const sourceRoot = options.source || pluginRoot;
  if (command === "inspect") {
    process.stdout.write(`${JSON.stringify(inspectInstall({ sourceRoot, destination: requiredOption(options, "destination") }))}\n`);
    return;
  }
  if (command === "materialize") {
    process.stdout.write(`${JSON.stringify(materializeHooks({ sourceRoot, destination: requiredOption(options, "destination"), dryRun: options["dry-run"] === true }))}\n`);
    return;
  }
  if (command === "install") {
    process.stdout.write(`${JSON.stringify(installPlugin({
      sourceRoot,
      destination: options.destination,
      marketplace: options.marketplace || "personal",
      dryRun: options["dry-run"] === true,
    }))}\n`);
    return;
  }
  fail("usage: install-plugin.mjs inspect|materialize|install [--source PATH] [--destination PATH] [--marketplace NAME] [--dry-run]");
}

const invoked = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invoked) {
  try {
    main();
  } catch (error) {
    process.stderr.write(`plugin installation failed: ${error.message}\n`);
    process.exitCode = 1;
  }
}
