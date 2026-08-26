import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { EventEmitter } from "node:events";
import { appendFileSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { browserHost, browserLaunchCommand, createRunExport, discoverRuns, findRun, hookToolOutcome, isReusableDashboard, normalizeState, normalizeTeamId, openDefaultBrowser, pathContains, pipelineTeam, runMatches, runMetadata, sameCommand, serializeBootstrapState, slugFor, subagentFinalStatus, summarizeState, urlHost, validRunSlug } from "./build-status.mjs";

function stateFixture() {
  return {
    schemaVersion: 2,
    run: {
      id: "test-run",
      status: "active",
      progress: 0,
      milestones: [],
    },
    teams: {
      "red-1": { id: "red-1", status: "completed", progress: 100, updatedAt: "2026-01-01T00:00:00Z" },
    },
    agents: {
      reviewer: { id: "reviewer", team: "red-1", role: "reviewer", model: "gpt-5.6-terra", effort: "high", status: "queued" },
      judge: { id: "judge", team: "fixer-2", role: "judge", model: "gpt-5.6-sol", effort: "medium", status: "waiting" },
    },
    tasks: {
      finding: { id: "finding", team: "red-1", kind: "finding", status: "blocked", progress: 50 },
      closed: { id: "closed", team: "fixer-2", kind: "finding", status: "passed", progress: 100 },
    },
    events: [{ id: "event", team: "fixer-2", kind: "task" }],
  };
}

test("schema-v3 normalization canonicalizes numbered stage IDs and derives summaries", () => {
  const state = stateFixture();
  normalizeState(state);
  assert.equal(state.schemaVersion, 3);
  assert.equal(state.teams.red.id, "red");
  assert.equal(state.agents.reviewer.team, "red");
  assert.equal(state.agents.judge.team, "fixer");
  assert.equal(state.tasks.finding.team, "red");
  assert.equal(state.events[0].team, "fixer");
  assert.deepEqual(state.summary, { activeAgents: 0, queuedOrWaitingAgents: 2, openBlockers: 1, openFindings: 1, unknownTeams: [] });
  assert.equal(state.run.progress, 15);
});

test("summary definitions distinguish active, queued/waiting, blockers, and unresolved findings", () => {
  const state = stateFixture();
  state.agents.reviewer.status = "active";
  state.tasks.finding.status = "failed";
  assert.deepEqual(summarizeState(state), {
    activeAgents: 1,
    queuedOrWaitingAgents: 1,
    openBlockers: 1,
    openFindings: 1,
    unknownTeams: ["fixer-2", "red-1"],
  });
  state.tasks.finding.status = "passed";
  assert.equal(summarizeState(state).openFindings, 0);
});

test("progress and completedAt never regress during later normalization", () => {
  const state = stateFixture();
  normalizeState(state);
  const progress = state.run.progress;
  state.teams.red.status = "active";
  state.tasks.later = { id: "later", team: "fixer", kind: "task", status: "active", progress: 90 };
  normalizeState(state);
  assert.equal(state.run.progress, progress);

  state.run.status = "completed";
  state.run.completedAt = "2026-01-02T03:04:05.000Z";
  normalizeState(state);
  state.tasks.later.status = "passed";
  normalizeState(state);
  assert.equal(state.run.completedAt, "2026-01-02T03:04:05.000Z");
});

test("terminal pipeline teams always normalize to complete display progress", () => {
  const state = stateFixture();
  state.teams["seed-tests"] = { id: "seed-tests", status: "completed", progress: 0 };
  state.teams.fixer = { id: "fixer", status: "not-required", progress: 0 };
  state.teams.integration = { id: "integration", status: "completed" };
  state.teams.blue = { id: "blue", status: "active", progress: 42 };

  normalizeState(state);

  assert.equal(state.teams["seed-tests"].progress, 100);
  assert.equal(state.teams.fixer.progress, 100);
  assert.equal(state.teams.integration.progress, 100);
  assert.equal(state.teams.blue.progress, 42);
});

test("pipeline validation accepts numbered aliases and rejects unknown stages", () => {
  assert.equal(normalizeTeamId("RED_team-12-review"), "red");
  assert.equal(pipelineTeam("fixer-2"), "fixer");
  assert.throws(() => pipelineTeam("blu"), /Unknown pipeline team: blu/);
});

test("browser opening uses each platform's default-browser command", async () => {
  const url = "http://127.0.0.1:4173";
  assert.deepEqual(browserLaunchCommand("linux", url), { command: "xdg-open", args: [url] });
  assert.deepEqual(browserLaunchCommand("darwin", url), { command: "open", args: [url] });
  assert.deepEqual(browserLaunchCommand("win32", url), { command: "cmd", args: ["/d", "/s", "/c", "start", "", url] });

  let invocation;
  const result = await openDefaultBrowser(url, (command, args, options) => {
    invocation = { command, args, options };
    const child = new EventEmitter();
    child.unref = () => {};
    queueMicrotask(() => child.emit("exit", 0));
    return child;
  });
  assert.equal(invocation.command, browserLaunchCommand(process.platform, url).command);
  assert.deepEqual(invocation.options, { stdio: "ignore" });
  assert.deepEqual(result, { ok: true, command: invocation.command });
});

test("dashboard origins format IPv4, IPv6 loopback, and wildcard hosts safely", () => {
  assert.equal(urlHost(browserHost("127.0.0.1")), "127.0.0.1");
  assert.equal(urlHost(browserHost("0.0.0.0")), "127.0.0.1");
  assert.equal(urlHost(browserHost("::1")), "[::1]");
  assert.equal(urlHost(browserHost("::")), "[::1]");
});

test("initial status bootstrap cannot terminate its script element", () => {
  const serialized = serializeBootstrapState({ message: "</script><script>alert('x')</script>" });
  assert.doesNotMatch(serialized, /</);
  assert.deepEqual(JSON.parse(serialized), { message: "</script><script>alert('x')</script>" });
});

test("durable run discovery, metadata search, sequencing, and export remain consistent", () => {
  const runsRoot = mkdtempSync(join(tmpdir(), "build-status-history-"));
  const script = fileURLToPath(new URL("./build-status.mjs", import.meta.url));
  const run = (...args) => spawnSync(process.execPath, [script, ...args], { encoding: "utf8" });
  const firstStatusDir = join(runsRoot, "run-one", "status");
  const secondStatusDir = join(runsRoot, "run-two", "status");

  try {
    for (const [statusDir, id, repo] of [[firstStatusDir, "run-one", "alpha-repo"], [secondStatusDir, "run-two", "beta-repo"]]) {
      const initialized = run("init", "--state-dir", statusDir, "--run", id, "--repo", repo, "--base", "abc123", "--branch", "build/test");
      assert.equal(initialized.status, 0, initialized.stderr);
    }
    const updated = run("event", "--state-dir", firstStatusDir, "--kind", "validation", "--message", "suite passed");
    assert.equal(updated.status, 0, updated.stderr);
    const updatedAgain = run("event", "--state-dir", firstStatusDir, "--kind", "validation", "--message", "export passed");
    assert.equal(updatedAgain.status, 0, updatedAgain.stderr);

    const eventLines = readFileSync(join(firstStatusDir, "events.ndjson"), "utf8").trim().split("\n").map(JSON.parse);
    assert.deepEqual(eventLines.map(({ seq }) => seq), [1, 2, 3]);
    writeFileSync(join(firstStatusDir, "events.ndjson"), `${JSON.stringify(eventLines[0])}\n${JSON.stringify(eventLines[2])}\n`);

    const storedStatePath = join(firstStatusDir, "status.json");
    const storedState = JSON.parse(readFileSync(storedStatePath, "utf8"));
    storedState.teams.integration = { id: "integration", status: "completed", progress: 0 };
    writeFileSync(storedStatePath, `${JSON.stringify(storedState, null, 2)}\n`);

    const catalog = discoverRuns(runsRoot);
    assert.deepEqual(catalog.map(({ slug }) => slug).sort(), ["run-one", "run-two"]);
    const first = catalog.find(({ slug }) => slug === "run-one");
    assert.equal(runMatches(first.state, "ALPHA"), true);
    assert.equal(runMatches(first.state, "missing"), false);
    assert.equal(runMetadata(first.state).slug, "run-one");
    assert.equal(first.state.teams.integration.progress, 100);

    const exported = createRunExport(first);
    assert.equal(exported.exportSchemaVersion, 1);
    assert.equal(exported.status.run.id, "run-one");
    assert.equal(exported.status.teams.integration.progress, 100);
    assert.equal(Object.hasOwn(exported.status, "events"), false);
    assert.deepEqual(exported.events.map(({ seq }) => seq), [1, 2, 3]);
    assert.deepEqual(readFileSync(join(firstStatusDir, "events.ndjson"), "utf8").trim().split("\n").map((line) => JSON.parse(line).seq), [1, 2, 3]);
  } finally {
    rmSync(runsRoot, { recursive: true, force: true });
  }
});

test("a crash-truncated final event is preserved and recovered without blocking later updates", () => {
  const statusDir = mkdtempSync(join(tmpdir(), "build-status-truncated-event-"));
  const script = fileURLToPath(new URL("./build-status.mjs", import.meta.url));
  const run = (...args) => spawnSync(process.execPath, [script, ...args], { encoding: "utf8" });
  try {
    const initialized = run("init", "--state-dir", statusDir, "--run", "truncated", "--repo", "fixture", "--base", "abc", "--branch", "test");
    assert.equal(initialized.status, 0, initialized.stderr);
    const corruptTail = '{"id":"partial"';
    appendFileSync(join(statusDir, "events.ndjson"), corruptTail);

    const updated = run("event", "--state-dir", statusDir, "--kind", "validation", "--message", "continued safely");
    assert.equal(updated.status, 0, updated.stderr);
    const events = readFileSync(join(statusDir, "events.ndjson"), "utf8").trim().split("\n").map(JSON.parse);
    assert.deepEqual(events.map(({ seq }) => seq), [1, 2]);
    const sidecars = readdirSync(statusDir).filter((name) => name.startsWith("events.ndjson.corrupt-tail-"));
    assert.equal(sidecars.length, 1);
    assert.equal(readFileSync(join(statusDir, sidecars[0]), "utf8"), corruptTail);
  } finally {
    rmSync(statusDir, { recursive: true, force: true });
  }
});

test("a valid unterminated final event is newline-normalized before appending", () => {
  const statusDir = mkdtempSync(join(tmpdir(), "build-status-unterminated-event-"));
  const script = fileURLToPath(new URL("./build-status.mjs", import.meta.url));
  const run = (...args) => spawnSync(process.execPath, [script, ...args], { encoding: "utf8" });
  try {
    const initialized = run("init", "--state-dir", statusDir, "--run", "unterminated", "--repo", "fixture", "--base", "abc", "--branch", "test");
    assert.equal(initialized.status, 0, initialized.stderr);
    const eventsPath = join(statusDir, "events.ndjson");
    const first = readFileSync(eventsPath, "utf8").trimEnd();
    writeFileSync(eventsPath, first);

    let updated = run("event", "--state-dir", statusDir, "--kind", "validation", "--message", "first append");
    assert.equal(updated.status, 0, updated.stderr);
    updated = run("event", "--state-dir", statusDir, "--kind", "validation", "--message", "second append");
    assert.equal(updated.status, 0, updated.stderr);
    const content = readFileSync(eventsPath, "utf8");
    assert.equal(content.endsWith("\n"), true);
    assert.deepEqual(content.trim().split("\n").map((line) => JSON.parse(line).seq), [1, 2, 3]);
  } finally {
    rmSync(statusDir, { recursive: true, force: true });
  }
});

test("terminated or earlier corrupt event lines remain hard failures", () => {
  const statusDir = mkdtempSync(join(tmpdir(), "build-status-corrupt-event-"));
  const script = fileURLToPath(new URL("./build-status.mjs", import.meta.url));
  const run = (...args) => spawnSync(process.execPath, [script, ...args], { encoding: "utf8" });
  try {
    const initialized = run("init", "--state-dir", statusDir, "--run", "corrupt", "--repo", "fixture", "--base", "abc", "--branch", "test");
    assert.equal(initialized.status, 0, initialized.stderr);
    appendFileSync(join(statusDir, "events.ndjson"), "not-json\n");
    const updated = run("event", "--state-dir", statusDir, "--kind", "validation");
    assert.notEqual(updated.status, 0);
    assert.match(updated.stderr, /Invalid event JSON at line 2/);
    assert.equal(readdirSync(statusDir).some((name) => name.startsWith("events.ndjson.corrupt-tail-")), false);
  } finally {
    rmSync(statusDir, { recursive: true, force: true });
  }
});

test("run slugs are stable, URL safe, and strictly validated", () => {
  assert.equal(slugFor("already-safe-20260810"), "already-safe-20260810");
  assert.match(slugFor("Needs spaces / unsafe"), /^needs-spaces-unsafe-[a-f0-9]{8}$/);
  assert.equal(validRunSlug("valid-run"), "valid-run");
  assert.throws(() => validRunSlug("../escape"), /Invalid run slug/);
});

test("durable catalog rejects embedded slugs that do not match their archive directory", () => {
  const runsRoot = mkdtempSync(join(tmpdir(), "build-status-slug-mismatch-"));
  const statusDir = join(runsRoot, "directory-slug", "status");
  const script = fileURLToPath(new URL("./build-status.mjs", import.meta.url));
  try {
    const initialized = spawnSync(process.execPath, [script, "init", "--state-dir", statusDir, "--run", "display-run", "--slug", "embedded-slug", "--repo", "fixture", "--base", "abc", "--branch", "test"], { encoding: "utf8" });
    assert.equal(initialized.status, 0, initialized.stderr);
    const catalog = discoverRuns(runsRoot);
    assert.match(catalog[0].error, /does not match archive directory/);
    assert.match(findRun(runsRoot, "", "directory-slug").error, /does not match archive directory/);
  } finally {
    rmSync(runsRoot, { recursive: true, force: true });
  }
});

test("dashboard reuse requires the same healthy compatible instance and archive", () => {
  const registry = { instanceId: "instance-one", bindHost: "127.0.0.1" };
  const health = { ok: true, body: { service: "build-dashboard", protocolVersion: 1, instanceId: "instance-one", archiveId: "archive-one", bindHost: "127.0.0.1" } };
  assert.equal(isReusableDashboard(registry, health, "archive-one", "127.0.0.1"), true);
  assert.equal(isReusableDashboard(registry, health, "archive-two", "127.0.0.1"), false);
  assert.equal(isReusableDashboard(registry, health, "archive-one", "0.0.0.0"), false);
  assert.equal(isReusableDashboard(registry, { ...health, ok: false }, "archive-one", "127.0.0.1"), false);
  assert.equal(isReusableDashboard({ ...registry, instanceId: "other" }, health, "archive-one", "127.0.0.1"), false);
});

test("an agent lifecycle event cannot be observable without its canonical agent", () => {
  const statusDir = mkdtempSync(join(tmpdir(), "build-status-agent-event-"));
  const script = fileURLToPath(new URL("./build-status.mjs", import.meta.url));
  const run = (...args) => spawnSync(process.execPath, [script, ...args], { encoding: "utf8" });

  try {
    const initialized = run(
      "init",
      "--state-dir", statusDir,
      "--run", "agent-event-invariant",
      "--repo", "fixture",
      "--base", "reviewed",
      "--branch", "test",
    );
    assert.equal(initialized.status, 0, initialized.stderr);

    const published = run(
      "event",
      "--state-dir", statusDir,
      "--kind", "agent",
      "--team", "fixer",
      "--agent", "fixer-planner",
      "--message", "Planner starting",
    );
    const inheritedNamePublished = run(
      "event",
      "--state-dir", statusDir,
      "--kind", "agent",
      "--team", "fixer",
      "--agent", "toString",
      "--message", "Unregistered inherited agent starting",
    );
    const inheritedNameRegistered = run(
      "agent",
      "--state-dir", statusDir,
      "--id", "__proto__",
      "--team", "fixer",
      "--status", "queued",
    );
    const state = JSON.parse(readFileSync(join(statusDir, "status.json"), "utf8"));
    const inconsistentEvents = state.events.filter((event) => event.agent && !Object.hasOwn(state.agents, event.agent));

    assert.deepEqual(
      inconsistentEvents,
      [],
      `event/agent commands exited ${published.status}/${inheritedNamePublished.status}/${inheritedNameRegistered.status}: an agent event was published without registering its agent`,
    );
  } finally {
    rmSync(statusDir, { recursive: true, force: true });
  }
});

test("event validation preserves unknown pipeline-team errors without mutating status", () => {
  const statusDir = mkdtempSync(join(tmpdir(), "build-status-event-errors-"));
  const script = fileURLToPath(new URL("./build-status.mjs", import.meta.url));
  const run = (...args) => spawnSync(process.execPath, [script, ...args], { encoding: "utf8" });

  try {
    const initialized = run(
      "init",
      "--state-dir", statusDir,
      "--run", "event-error-contract",
      "--repo", "fixture",
      "--base", "reviewed",
      "--branch", "test",
    );
    assert.equal(initialized.status, 0, initialized.stderr);
    const statusBefore = readFileSync(join(statusDir, "status.json"), "utf8");
    const eventsBefore = readFileSync(join(statusDir, "events.ndjson"), "utf8");

    const published = run(
      "event",
      "--state-dir", statusDir,
      "--kind", "agent",
      "--team", "invalid-team",
      "--agent", "unknown",
    );

    assert.notEqual(published.status, 0);
    assert.match(published.stderr, /Unknown pipeline team: invalid-team/);
    assert.equal(readFileSync(join(statusDir, "status.json"), "utf8"), statusBefore);
    assert.equal(readFileSync(join(statusDir, "events.ndjson"), "utf8"), eventsBefore);

    const missingKind = run(
      "event",
      "--state-dir", statusDir,
      "--team", "invalid-team",
      "--agent", "unknown",
    );

    assert.notEqual(missingKind.status, 0);
    assert.match(missingKind.stderr, /Missing --kind/);
    assert.equal(readFileSync(join(statusDir, "status.json"), "utf8"), statusBefore);
    assert.equal(readFileSync(join(statusDir, "events.ndjson"), "utf8"), eventsBefore);
  } finally {
    rmSync(statusDir, { recursive: true, force: true });
  }
});

test("hook helpers match workspaces, exact verification commands, and conservative outcomes", () => {
  assert.equal(pathContains("/workspace/build", "/workspace/build/src"), true);
  assert.equal(pathContains("/workspace/build", "/workspace/other"), false);
  assert.equal(sameCommand("node  --test test.mjs", " node --test test.mjs "), true);
  assert.equal(sameCommand("node --test a.mjs", "node --test b.mjs"), false);
  assert.equal(hookToolOutcome({ exit_code: 0 }), "passed");
  assert.equal(hookToolOutcome({ exitCode: 2 }), "failed");
  assert.equal(hookToolOutcome({ result: { metadata: { exit_code: 0 }, output: "1 failed assertion was expected" } }), "passed");
  assert.equal(hookToolOutcome("Tests: 20 passed, 0 failed"), "passed");
  assert.equal(subagentFinalStatus("Status: blocked\nNeeds user input"), "blocked");
  assert.equal(subagentFinalStatus("Completed the scoped implementation"), "completed");
});

test("bundled hooks cover Build lifecycle events without prompt approval automation", () => {
  const hooksPath = fileURLToPath(new URL("../hooks/hooks.json", import.meta.url));
  const config = JSON.parse(readFileSync(hooksPath, "utf8"));
  assert.deepEqual(Object.keys(config.hooks).sort(), ["PostToolUse", "PreToolUse", "Stop", "SubagentStart", "SubagentStop"]);
  assert.equal(Object.hasOwn(config.hooks, "UserPromptSubmit"), false);
  for (const groups of Object.values(config.hooks)) {
    for (const group of groups) {
      for (const hook of group.hooks) {
        assert.match(hook.command, /build-status\.mjs\" hook$/);
        assert.match(hook.commandWindows, /build-status\.mjs\" hook$/);
      }
    }
  }
});

test("lifecycle hooks update only the selected Build task and never infer approval", () => {
  const runsRoot = mkdtempSync(join(tmpdir(), "build-status-hooks-"));
  const workspace = join(runsRoot, "workspace");
  const statusDir = join(runsRoot, "hook-run", "status");
  const script = fileURLToPath(new URL("./build-status.mjs", import.meta.url));
  const run = (...args) => spawnSync(process.execPath, [script, ...args], { encoding: "utf8" });
  const hook = (input) => spawnSync(process.execPath, [script, "hook", "--runs-dir", runsRoot], { input: JSON.stringify(input), encoding: "utf8" });
  const baseEvent = { session_id: "session-1", cwd: workspace, model: "gpt-5.6-sol", permission_mode: "default", turn_id: "turn-1" };

  try {
    let result = run("init", "--state-dir", statusDir, "--run", "hook-run", "--repo", workspace, "--workspace", workspace, "--base", "abc", "--branch", "build/hook-run");
    assert.equal(result.status, 0, result.stderr);
    result = run("team", "--state-dir", statusDir, "--id", "blue", "--status", "active");
    assert.equal(result.status, 0, result.stderr);
    result = run("agent", "--state-dir", statusDir, "--id", "blue-worker", "--team", "blue", "--role", "worker", "--status", "queued");
    assert.equal(result.status, 0, result.stderr);
    result = run("task", "--state-dir", statusDir, "--id", "blue-verify", "--team", "blue", "--title", "Verify implementation", "--status", "queued", "--verification-command", "node --test focused.test.mjs");
    assert.equal(result.status, 0, result.stderr);
    result = run("context", "--state-dir", statusDir, "--team", "blue", "--task", "blue-verify", "--agent", "blue-worker", "--workspace", workspace);
    assert.equal(result.status, 0, result.stderr);

    result = hook({ ...baseEvent, hook_event_name: "SubagentStart", agent_id: "agent-123", agent_type: "worker" });
    assert.equal(result.status, 0, result.stderr);
    result = hook({ ...baseEvent, hook_event_name: "PreToolUse", tool_name: "Bash", tool_use_id: "tool-1", tool_input: { command: "node --test focused.test.mjs" } });
    assert.equal(result.status, 0, result.stderr);
    result = hook({ ...baseEvent, hook_event_name: "PostToolUse", tool_name: "Bash", tool_use_id: "tool-1", tool_input: { command: "node --test focused.test.mjs" }, tool_response: { exit_code: 1 } });
    assert.equal(result.status, 0, result.stderr);
    let state = JSON.parse(readFileSync(join(statusDir, "status.json"), "utf8"));
    assert.equal(state.tasks["blue-verify"].status, "active");
    assert.equal(state.agents["blue-worker"].status, "active");

    result = hook({ ...baseEvent, hook_event_name: "PostToolUse", tool_name: "Bash", tool_use_id: "tool-2", tool_input: { command: "node --test focused.test.mjs" }, tool_response: { exit_code: 0 } });
    assert.equal(result.status, 0, result.stderr);
    result = hook({ ...baseEvent, hook_event_name: "SubagentStop", agent_id: "agent-123", agent_type: "worker", stop_hook_active: false, last_assistant_message: "Status: blocked\nExternal dependency unavailable" });
    assert.equal(result.status, 0, result.stderr);
    state = JSON.parse(readFileSync(join(statusDir, "status.json"), "utf8"));
    assert.equal(state.tasks["blue-verify"].status, "passed");
    assert.equal(state.agents["blue-worker"].status, "blocked");
    assert.equal(Object.hasOwn(state, "approval"), false);

    result = run("task", "--state-dir", statusDir, "--id", "blue-followup", "--team", "blue", "--status", "active");
    assert.equal(result.status, 0, result.stderr);
    result = run("context", "--state-dir", statusDir, "--team", "blue", "--task", "blue-followup", "--workspace", workspace);
    assert.equal(result.status, 0, result.stderr);
    result = hook({ ...baseEvent, hook_event_name: "Stop", stop_hook_active: false, last_assistant_message: "Pausing" });
    assert.equal(result.status, 0, result.stderr);
    state = JSON.parse(readFileSync(join(statusDir, "status.json"), "utf8"));
    assert.equal(state.tasks["blue-followup"].status, "waiting");
    assert.equal(state.run.status, "active");
    assert.equal(Object.hasOwn(state, "approval"), false);
  } finally {
    rmSync(runsRoot, { recursive: true, force: true });
  }
});
