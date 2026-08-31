export const PIPELINE = ["brainstorm", "seed-tests", "blue", "red", "fixer", "integration"];
export const FILTERS = {
  activeAgents: "active-agents",
  openBlockers: "open-blockers",
  openFindings: "open-findings",
};

const TERMINAL = new Set(["completed", "passed", "not-required"]);
const BLOCKING = new Set(["blocked", "failed"]);

export function getSummary(data) {
  const recorded = data?.summary;
  if (recorded && Number.isFinite(Number(recorded.activeAgents))) {
    return {
      activeAgents: nonNegative(recorded.activeAgents),
      queuedOrWaitingAgents: nonNegative(recorded.queuedOrWaitingAgents),
      openBlockers: nonNegative(recorded.openBlockers),
      openFindings: nonNegative(recorded.openFindings),
    };
  }
  const agents = Object.values(data?.agents || {});
  const tasks = Object.values(data?.tasks || {});
  return {
    activeAgents: agents.filter(({ status }) => status === "active").length,
    queuedOrWaitingAgents: agents.filter(({ status }) => status === "queued" || status === "waiting").length,
    openBlockers: tasks.filter(({ status }) => BLOCKING.has(status)).length,
    openFindings: tasks.filter(isOpenFinding).length,
  };
}

export function getCompletion(data) {
  return {
    percent: nonNegative(data?.run?.progress),
  };
}

export function getTeamProgress(team) {
  if (team && TERMINAL.has(team.status)) return 100;
  const progress = Number(team?.progress);
  return Number.isFinite(progress) ? Math.max(0, Math.min(100, progress)) : 0;
}

export function summarizeAgents(agents = []) {
  return {
    total: agents.length,
    active: agents.filter(({ status }) => status === "active").length,
    queuedOrWaiting: agents.filter(({ status }) => status === "queued" || status === "waiting").length,
    completed: agents.filter(({ status }) => TERMINAL.has(status)).length,
  };
}

export function formatAgentMetadata(agent) {
  return [agent?.model, agent?.effort, agent?.status].filter(Boolean).join(" · ");
}

export function slugFromPath(pathname) {
  const match = String(pathname || "").match(/^\/runs\/([^/]+)\/?$/);
  if (!match) return "";
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return "";
  }
}

export function runPath(slug) {
  return `/runs/${encodeURIComponent(slug)}`;
}

export function runStatusPath(slug) {
  return `/api/runs/${encodeURIComponent(slug)}/status`;
}

export function runExportPath(slug) {
  return `/api/runs/${encodeURIComponent(slug)}/export`;
}

export function runSearchPath(query = "") {
  const parameters = new URLSearchParams();
  if (query.trim()) parameters.set("q", query.trim());
  const suffix = parameters.toString();
  return `/api/runs${suffix ? `?${suffix}` : ""}`;
}

export function shouldAcceptStatusSnapshot(current, candidate) {
  if (!candidate) return false;
  if (!current) return true;
  const currentSequence = Number(current.run?.lastEventSeq);
  const candidateSequence = Number(candidate.run?.lastEventSeq);
  if (Number.isFinite(currentSequence) && Number.isFinite(candidateSequence) && candidateSequence !== currentSequence) {
    return candidateSequence > currentSequence;
  }
  const currentUpdatedAt = current.run?.updatedAt;
  const candidateUpdatedAt = candidate.run?.updatedAt;
  if (!currentUpdatedAt || !candidateUpdatedAt) return true;
  return String(candidateUpdatedAt).localeCompare(String(currentUpdatedAt)) >= 0;
}

export function filterDashboard(data, activeFilters) {
  const filters = new Set(activeFilters);
  const tasks = Object.values(data?.tasks || {}).sort(byUpdated);
  const teams = Object.values(data?.teams || {});
  const agents = Object.values(data?.agents || {});
  if (filters.size === 0) {
    return { tasks, teams, agents, stageIds: PIPELINE };
  }

  const activeTeamIds = new Set(agents.filter(({ status }) => status === "active").map(({ team }) => team));
  const taskMatches = (task) => (
    (filters.has(FILTERS.activeAgents) && activeTeamIds.has(task.team))
    || (filters.has(FILTERS.openBlockers) && BLOCKING.has(task.status))
    || (filters.has(FILTERS.openFindings) && isOpenFinding(task))
  );
  const visibleTasks = tasks.filter(taskMatches);
  const taskTeamIds = new Set(visibleTasks.map(({ team }) => team));
  const visibleTeamIds = new Set(taskTeamIds);
  if (filters.has(FILTERS.activeAgents)) {
    for (const id of activeTeamIds) visibleTeamIds.add(id);
  }
  const visibleAgents = agents.filter((agent) => (
    (filters.has(FILTERS.activeAgents) && agent.status === "active")
    || taskTeamIds.has(agent.team)
  ));
  return {
    tasks: visibleTasks,
    teams: teams.filter(({ id }) => visibleTeamIds.has(id)),
    agents: visibleAgents,
    stageIds: PIPELINE.filter((id) => visibleTeamIds.has(id)),
  };
}

export function isOpenFinding(task) {
  return task?.kind === "finding" && !TERMINAL.has(task.status);
}

export function byUpdated(first, second) {
  const timestampOrder = String(second.updatedAt || "").localeCompare(String(first.updatedAt || ""));
  return timestampOrder || String(first.id || "").localeCompare(String(second.id || ""));
}

function nonNegative(value) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, number) : 0;
}
