import assert from "node:assert/strict";
import test from "node:test";

import { FILTERS, filterDashboard, formatAgentMetadata, getCompletion, getSummary, getTeamProgress, isOpenFinding, runExportPath, runPath, runSearchPath, runStatusPath, shouldAcceptStatusSnapshot, slugFromPath, summarizeAgents } from "../src/dashboardState.js";

const data = {
  run: { progress: 40 },
  summary: { activeAgents: 1, queuedOrWaitingAgents: 2, openBlockers: 1, openFindings: 1 },
  teams: {
    blue: { id: "blue" },
    red: { id: "red" },
    fixer: { id: "fixer" },
  },
  agents: {
    blueActive: { id: "blue-active", team: "blue", status: "active" },
    redQueued: { id: "red-queued", team: "red", status: "queued" },
    fixerWaiting: { id: "fixer-waiting", team: "fixer", status: "waiting" },
  },
  tasks: {
    blueTask: { id: "blue-task", team: "blue", kind: "task", status: "active", updatedAt: "2026-01-01T00:00:00Z" },
    redFinding: { id: "red-finding", team: "red", kind: "finding", status: "blocked", updatedAt: "2026-01-01T00:00:02Z" },
    closedFinding: { id: "closed-finding", team: "red", kind: "finding", status: "passed", updatedAt: "2026-01-01T00:00:01Z" },
    fixerFailure: { id: "fixer-failure", team: "fixer", kind: "task", status: "failed", updatedAt: "2026-01-01T00:00:03Z" },
  },
};

test("task and milestone completion remain separate", () => {
  const summary = getSummary({ ...data, agents: {}, tasks: {} });
  assert.deepEqual(summary, data.summary);
  assert.deepEqual(getCompletion(data), { total: 4, complete: 1, taskPercent: 25, milestonePercent: 40 });
  assert.deepEqual(getCompletion({ run: { progress: 25 }, tasks: {
    completedButUnrelated: { status: "completed" },
    activeButUnrelated: { status: "active" },
  } }), { total: 2, complete: 1, taskPercent: 50, milestonePercent: 25 });
});

test("legacy summary fallback counts queued and waiting agents and unresolved findings", () => {
  const summary = getSummary({ ...data, summary: undefined });
  assert.deepEqual(summary, { activeAgents: 1, queuedOrWaitingAgents: 2, openBlockers: 2, openFindings: 1 });
  assert.equal(isOpenFinding(data.tasks.redFinding), true);
  assert.equal(isOpenFinding(data.tasks.closedFinding), false);
});

test("terminal team progress stays complete for legacy and stale server snapshots", () => {
  assert.equal(getTeamProgress({ status: "completed", progress: 0 }), 100);
  assert.equal(getTeamProgress({ status: "not-required", progress: 0 }), 100);
  assert.equal(getTeamProgress({ status: "active", progress: 42 }), 42);
  assert.equal(getTeamProgress({ status: "active", progress: 140 }), 100);
  assert.equal(getTeamProgress({ status: "queued", progress: -5 }), 0);
  assert.equal(getTeamProgress({ status: "queued", progress: "unknown" }), 0);
});

test("each summary filter narrows tasks, teams, and agents to relevant entities", () => {
  const active = filterDashboard(data, [FILTERS.activeAgents]);
  assert.deepEqual(active.tasks.map(({ id }) => id), ["blue-task"]);
  assert.deepEqual(active.stageIds, ["blue"]);
  assert.deepEqual(active.agents.map(({ id }) => id), ["blue-active"]);

  const blockers = filterDashboard(data, [FILTERS.openBlockers]);
  assert.deepEqual(blockers.tasks.map(({ id }) => id), ["fixer-failure", "red-finding"]);
  assert.deepEqual(blockers.stageIds, ["red", "fixer"]);
  assert.deepEqual(blockers.agents.map(({ id }) => id), ["red-queued", "fixer-waiting"]);

  const findings = filterDashboard(data, [FILTERS.openFindings]);
  assert.deepEqual(findings.tasks.map(({ id }) => id), ["red-finding"]);
  assert.deepEqual(findings.stageIds, ["red"]);
  assert.deepEqual(findings.agents.map(({ id }) => id), ["red-queued"]);
});

test("multiple active summary filters form a deterministic union", () => {
  const view = filterDashboard(data, [FILTERS.activeAgents, FILTERS.openFindings]);
  assert.deepEqual(view.tasks.map(({ id }) => id), ["red-finding", "blue-task"]);
  assert.deepEqual(view.stageIds, ["blue", "red"]);
  assert.deepEqual(view.agents.map(({ id }) => id), ["blue-active", "red-queued"]);
});

test("team cards summarize agents without exposing the individual roster", () => {
  assert.deepEqual(summarizeAgents([]), {
    total: 0,
    active: 0,
    queuedOrWaiting: 0,
    completed: 0,
  });
  assert.deepEqual(summarizeAgents([
    { status: "active" },
    { status: "queued" },
    { status: "waiting" },
    { status: "completed" },
    { status: "failed" },
  ]), {
    total: 5,
    active: 1,
    queuedOrWaiting: 2,
    completed: 1,
  });
});

test("agent metadata includes model, effort, and status", () => {
  assert.equal(formatAgentMetadata({
    model: "gpt-5.6-terra",
    effort: "high",
    status: "active",
  }), "gpt-5.6-terra · high · active");
});

test("run URLs are encoded, parsed, and mapped to same-origin API routes", () => {
  const slug = "build-history-20260810";
  assert.equal(runPath(slug), "/runs/build-history-20260810");
  assert.equal(slugFromPath(runPath(slug)), slug);
  assert.equal(slugFromPath("/not-a-run"), "");
  assert.equal(runStatusPath(slug), "/api/runs/build-history-20260810/status");
  assert.equal(runExportPath(slug), "/api/runs/build-history-20260810/export");
  assert.equal(runSearchPath("  dashboard history  "), "/api/runs?q=dashboard+history");
  assert.equal(runSearchPath(""), "/api/runs");
});

test("status snapshots never move the dashboard backward", () => {
  const current = { run: { updatedAt: "2026-08-08T06:34:58.298Z" } };
  assert.equal(shouldAcceptStatusSnapshot(current, { run: { updatedAt: "2026-08-08T06:34:59.000Z" } }), true);
  assert.equal(shouldAcceptStatusSnapshot(current, { run: { updatedAt: "2026-08-08T06:34:58.298Z" } }), true);
  assert.equal(shouldAcceptStatusSnapshot(current, { run: { updatedAt: "2026-08-08T06:34:57.000Z" } }), false);

  const sequenced = { run: { lastEventSeq: 100, updatedAt: "2026-08-08T06:35:00.000Z" } };
  assert.equal(shouldAcceptStatusSnapshot(sequenced, { run: { lastEventSeq: 101, updatedAt: "2026-08-08T06:34:00.000Z" } }), true);
  assert.equal(shouldAcceptStatusSnapshot(sequenced, { run: { lastEventSeq: 99, updatedAt: "2026-08-08T06:36:00.000Z" } }), false);
});
