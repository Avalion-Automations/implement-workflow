import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FILTERS, filterDashboard, getCompletion, getSummary, getTeamProgress, runExportPath, runPath, runSearchPath, runStatusPath, shouldAcceptStatusSnapshot, slugFromPath, summarizeAgents } from "./dashboardState.js";

export function App() {
  const bootstrap = globalThis.__BUILD_STATUS__ || null;
  const dashboard = globalThis.__BUILD_DASHBOARD__ || {};
  const initialSlug = slugFromPath(window.location.pathname) || dashboard.currentSlug || bootstrap?.run?.slug || "";
  const [selectedSlug, setSelectedSlug] = useState(initialSlug);
  const [data, setData] = useState(() => bootstrap?.run?.slug === initialSlug ? bootstrap : null);
  const [error, setError] = useState("");
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [selectedTeamId, setSelectedTeamId] = useState(null);
  const [activeFilters, setActiveFilters] = useState([]);
  const [runQuery, setRunQuery] = useState("");
  const [runResults, setRunResults] = useState([]);
  const [runSearchOpen, setRunSearchOpen] = useState(false);
  const [runSearchError, setRunSearchError] = useState("");

  useEffect(() => {
    if (!slugFromPath(window.location.pathname) && initialSlug) window.history.replaceState({}, "", runPath(initialSlug));
    function restoreRunFromHistory() {
      const slug = slugFromPath(window.location.pathname) || dashboard.currentSlug || bootstrap?.run?.slug || "";
      setSelectedSlug(slug);
      setData(bootstrap?.run?.slug === slug ? bootstrap : null);
      setError("");
      setSelectedTaskId(null);
      setSelectedTeamId(null);
      setActiveFilters([]);
    }
    window.addEventListener("popstate", restoreRunFromHistory);
    return () => window.removeEventListener("popstate", restoreRunFromHistory);
  }, []);

  useEffect(() => {
    let cancelled = false;
    let inFlight = false;
    async function poll() {
      if (cancelled || inFlight || !selectedSlug) return;
      inFlight = true;
      try {
        const response = await fetch(runStatusPath(selectedSlug), { cache: "no-store" });
        if (!response.ok) throw new Error(`Status API returned ${response.status}`);
        const next = await response.json();
        if (!cancelled) {
          setData((current) => current?.run?.slug !== next.run?.slug || shouldAcceptStatusSnapshot(current, next) ? next : current);
          setError("");
        }
      } catch (nextError) {
        if (!cancelled) setError(nextError.message);
      } finally {
        inFlight = false;
      }
    }
    poll();
    const timer = window.setInterval(poll, 1000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [selectedSlug]);

  useEffect(() => {
    if (!runSearchOpen) return undefined;
    let cancelled = false;
    async function loadRuns() {
      try {
        const response = await fetch(runSearchPath(runQuery), { cache: "no-store" });
        if (!response.ok) throw new Error(`Run search returned ${response.status}`);
        const result = await response.json();
        if (!cancelled) {
          setRunResults(result.runs || []);
          setRunSearchError("");
        }
      } catch (nextError) {
        if (!cancelled) setRunSearchError(nextError.message);
      }
    }
    const delay = window.setTimeout(loadRuns, runQuery ? 150 : 0);
    const refresh = window.setInterval(loadRuns, 5000);
    return () => {
      cancelled = true;
      window.clearTimeout(delay);
      window.clearInterval(refresh);
    };
  }, [runQuery, runSearchOpen]);

  const tasks = useMemo(() => Object.values(data?.tasks || {}), [data]);
  const summary = useMemo(() => getSummary(data), [data]);
  const completion = useMemo(() => getCompletion(data), [data]);
  const view = useMemo(() => filterDashboard(data, activeFilters), [data, activeFilters]);
  const recentEvents = useMemo(() => [...(data?.events || [])].slice(-8).reverse(), [data]);
  const selectedTask = selectedTaskId === null
    ? view.tasks[0]
    : view.tasks.find((task) => task.id === selectedTaskId);
  const selectedTaskFilteredOut = selectedTaskId !== null
    && tasks.some((task) => task.id === selectedTaskId)
    && !selectedTask;

  function toggleFilter(filter) {
    setActiveFilters((current) => current.includes(filter)
      ? current.filter((item) => item !== filter)
      : [...current, filter]);
  }

  function openRun(slug) {
    if (!slug || slug === selectedSlug) {
      setRunSearchOpen(false);
      return;
    }
    window.history.pushState({}, "", runPath(slug));
    setSelectedSlug(slug);
    setData(null);
    setError("");
    setSelectedTaskId(null);
    setSelectedTeamId(null);
    setActiveFilters([]);
    setRunSearchOpen(false);
    setRunQuery("");
  }

  const closeTeamDialog = useCallback(() => setSelectedTeamId(null), []);

  const runControls = <RunSearch query={runQuery} results={runResults} open={runSearchOpen} error={runSearchError} onQuery={setRunQuery} onOpen={setRunSearchOpen} onSelect={openRun} />;
  const selectedTeam = selectedTeamId
    ? Object.values(data?.teams || {}).find((team) => team.id === selectedTeamId)
      || { id: selectedTeamId, status: "queued", progress: 0, message: "No team status recorded" }
    : null;
  const selectedTeamAgents = selectedTeamId
    ? Object.values(data?.agents || {}).filter((agent) => agent.team === selectedTeamId)
    : [];

  if (!data) return <main className="shell"><header className="topbar"><div className="run-heading"><p className="eyebrow">DYNAMIC DELIVERY WORKFLOW</p><h1>{selectedSlug || "Build runs"}</h1></div><div className="topbar-actions loading-actions"><div className="run-tools">{runControls}<button className="export-button" type="button" disabled>Export JSON</button></div></div></header><section className={error ? "alert loading-state" : "loading-state"}>{error || "Waiting for Build status…"}</section></main>;

  return (
    <main className="shell">
      <header className="topbar">
        <div className="run-heading">
          <p className="eyebrow">DYNAMIC DELIVERY WORKFLOW</p>
          <h1>{data.run.id}</h1>
          <p className="muted">{data.run.repo} · {data.run.branch.slice(0, 32)} · base {shortSha(data.run.base)}</p>
        </div>
        <div className="topbar-actions">
          <div className="run-state" aria-label="Run status and duration"><StatePill value={data.run.status} /><span className="duration">{formatDuration(data.run.startedAt, data.run.completedAt)}</span></div>
          <div className="run-tools">
            {runControls}
            <div className="export-control"><a className="export-button" href={runExportPath(selectedSlug)} download>Export JSON</a></div>
          </div>
        </div>
      </header>

      {error && <p className="alert" role="alert">Live status unavailable: {error}</p>}

      <section className="kpis" aria-label="Workflow summary">
        <Metric label="Task completion" value={`${completion.complete}/${completion.total}`} detail={`${completion.percent}% milestone progress`} />
        <Metric label="Active agents" value={summary.activeAgents} detail={`${summary.queuedOrWaitingAgents} queued / waiting`} filter={FILTERS.activeAgents} activeFilters={activeFilters} onToggle={toggleFilter} />
        <Metric label="Open blockers" value={summary.openBlockers} detail="blocked or failed tasks" filter={FILTERS.openBlockers} activeFilters={activeFilters} onToggle={toggleFilter} />
        <Metric label="Open review findings" value={summary.openFindings} detail="unresolved findings" filter={FILTERS.openFindings} activeFilters={activeFilters} onToggle={toggleFilter} />
      </section>

      {activeFilters.length > 0 && <p className="filter-status" role="status">Showing: {activeFilters.map(filterLabel).join(" + ")}. Select an active summary card to clear it.</p>}

      <section className="board">
        <aside className="queue-panel">
          <div className="section-heading"><h2>Task / error queue</h2><span>{view.tasks.length} / {tasks.length}</span></div>
          <div className="task-list">
            {view.tasks.length === 0 && <p className="empty">{activeFilters.length ? "No tasks match the selected summary filters." : "No task has been registered yet."}</p>}
            {view.tasks.map((task) => (
              <button key={task.id} className={`task-card ${selectedTask?.id === task.id ? "selected" : ""}`} aria-current={selectedTask?.id === task.id ? "true" : undefined} onClick={() => setSelectedTaskId(task.id)}>
                <span className="task-id">{task.id}</span>
                <span className="task-title">{task.title}</span>
                <span className="task-meta"><StatePill value={task.status} /><span>{task.progress}%</span></span>
                <ProgressBar value={task.progress} />
              </button>
            ))}
          </div>
        </aside>

        <div className="detail-stack">
          <aside className="detail-panel" aria-label="Selected task">
            <div className="section-heading"><h2>Selected item</h2><span>{selectedTask ? shortState(selectedTask.status) : "—"}</span></div>
            {selectedTask
              ? <TaskDetail task={selectedTask} />
              : <p className="empty filtered-selection">{selectedTaskFilteredOut ? "The selected item is outside the active filters. Clear a filter or select a visible task." : "Select a task to inspect its recorded evidence."}</p>}
          </aside>

          <section className="events-panel" aria-label="Recent run events">
            <div className="section-heading"><h2>Recent events</h2><span>{recentEvents.length}</span></div>
            {recentEvents.length === 0 && <p className="empty events-empty">No events have been recorded yet.</p>}
            <ol className="events">
              {recentEvents.map((event) => <li key={event.id}><time>{formatTime(event.at)}</time><span>{event.kind}</span><p>{event.message || event.status || "State updated"}</p></li>)}
            </ol>
          </section>
        </div>

        <section className="workflow-panel" aria-label="Workflow teams">
          <div className="section-heading"><h2>Teams</h2><span>{view.stageIds.length} stages</span></div>
          <div className="pipeline" role="list">
            {view.stageIds.length === 0 && <p className="empty">No teams match the selected summary filters.</p>}
            {view.stageIds.map((id) => {
              const team = view.teams.find((item) => item.id === id) || { id, status: "queued", progress: 0, message: "Awaiting prior stage" };
              const members = view.agents.filter((agent) => agent.team === id);
              return <PipelineStage key={id} team={team} agents={members} onOpen={() => setSelectedTeamId(id)} />;
            })}
          </div>
        </section>
      </section>

      <TeamDialog team={selectedTeam} agents={selectedTeamAgents} onClose={closeTeamDialog} />
    </main>
  );
}

function RunSearch({ query, results, open, error, onQuery, onOpen, onSelect }) {
  const [activeIndex, setActiveIndex] = useState(0);
  useEffect(() => setActiveIndex(0), [query, results.length]);
  const activeResult = results[activeIndex];

  function onKeyDown(event) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      onOpen(true);
      if (results.length) setActiveIndex((current) => Math.min(results.length - 1, current + 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current) => Math.max(0, current - 1));
    } else if (event.key === "Enter" && open && activeResult) {
      event.preventDefault();
      onSelect(activeResult.slug);
    } else if (event.key === "Escape") {
      event.preventDefault();
      onOpen(false);
    }
  }

  return <div className="run-search">
    <label className="sr-only" htmlFor="run-search-input">Search Build runs</label>
    <input
      id="run-search-input"
      type="search"
      value={query}
      placeholder="Search runs…"
      role="combobox"
      aria-expanded={open}
      aria-controls="run-search-results"
      aria-activedescendant={open && activeResult ? `run-result-${activeResult.slug}` : undefined}
      onChange={(event) => { onQuery(event.target.value); onOpen(true); }}
      onFocus={() => onOpen(true)}
      onKeyDown={onKeyDown}
    />
    <span className="sr-only" role="status">{open ? `${results.length} runs found` : ""}</span>
    {open && <div className="run-search-popover">
      {error && <p className="run-search-message" role="alert">{error}</p>}
      {!error && results.length === 0 && <p className="run-search-message">No matching runs</p>}
      {!error && results.length > 0 && <ul id="run-search-results" role="listbox">
        {results.map((run, index) => <li key={run.slug}>
          <button
            id={`run-result-${run.slug}`}
            type="button"
            role="option"
            aria-selected={index === activeIndex}
            className={index === activeIndex ? "active" : ""}
            onMouseEnter={() => setActiveIndex(index)}
            onClick={() => onSelect(run.slug)}
          >
            <strong>{run.id}</strong>
            <span>{run.repo} · {run.branch}</span>
            <small>{shortState(run.status)} · {formatDateTime(run.updatedAt)}</small>
          </button>
        </li>)}
      </ul>}
    </div>}
  </div>;
}

function PipelineStage({ team, agents, onOpen }) {
  const summary = summarizeAgents(agents);
  return <div className="pipeline-row" role="listitem">
    <button type="button" className="team-box" aria-haspopup="dialog" onClick={onOpen}>
      <span className="team-heading"><span className="eyebrow">TEAM</span><span className="team-name" role="heading" aria-level="3">{team.id}</span></span>
      <StatePill value={team.status} />
      <ProgressBar value={getTeamProgress(team)} />
      <span className="team-message">{team.message || "No message recorded"}</span>
      <span className="team-agent-summary">{formatAgentSummary(summary)} <span aria-hidden="true">→</span></span>
    </button>
  </div>;
}

function TeamDialog({ team, agents, onClose }) {
  const closeButtonRef = useRef(null);
  const summary = summarizeAgents(agents);

  useEffect(() => {
    if (!team) return undefined;
    const previouslyFocused = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();
    function handleKeyDown(event) {
      if (event.key === "Escape") onClose();
      if (event.key === "Tab") {
        event.preventDefault();
        closeButtonRef.current?.focus();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.();
    };
  }, [team?.id, onClose]);

  if (!team) return null;
  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="team-dialog" role="dialog" aria-modal="true" aria-labelledby="team-dialog-title">
      <header className="team-dialog-header">
        <div><p className="eyebrow">TEAM DETAILS</p><h2 id="team-dialog-title">{team.id}</h2></div>
        <button ref={closeButtonRef} type="button" className="modal-close" aria-label={`Close ${team.id} team details`} onClick={onClose}>×</button>
      </header>
      <div className="team-dialog-status"><StatePill value={team.status} /><span>{team.message || "No message recorded"}</span></div>
      <ProgressBar value={getTeamProgress(team)} />
      <dl className="agent-kpis">
        <div><dt>Total</dt><dd>{summary.total}</dd></div>
        <div><dt>Active</dt><dd>{summary.active}</dd></div>
        <div><dt>Queued / waiting</dt><dd>{summary.queuedOrWaiting}</dd></div>
        <div><dt>Completed</dt><dd>{summary.completed}</dd></div>
      </dl>
      <div className="agent-roster-heading"><h3>Agent roster</h3><span>Live team membership</span></div>
      {agents.length === 0
        ? <p className="empty agent-empty">No agents have registered for this team yet.</p>
        : <ul className="agent-roster">
          {agents.map((agent) => <li key={agent.id}>
            <span className={`agent-state-marker ${agent.status}`} aria-hidden="true">{symbol(agent.status)}</span>
            <div className="agent-identity"><strong>{agent.role || agent.id}</strong><small>{agent.id}</small></div>
            <div className="agent-runtime"><strong>{agent.model || "Model unavailable"}</strong><small>{agent.effort ? `${agent.effort} effort` : "Effort unavailable"}</small></div>
            <StatePill value={agent.status} />
          </li>)}
        </ul>}
    </section>
  </div>;
}

function TaskDetail({ task }) {
  return <div className="detail-card"><p className="task-id">{task.id}</p><h3>{task.title}</h3><StatePill value={task.status} /><ProgressBar value={task.progress} /><dl><dt>Type</dt><dd>{task.kind || "task"}</dd><dt>Team</dt><dd>{task.team}</dd><dt>Message</dt><dd>{task.message || "—"}</dd><dt>Evidence</dt><dd>{task.evidence || "—"}</dd><dt>Updated</dt><dd>{new Date(task.updatedAt).toLocaleString()}</dd></dl></div>;
}

function Metric({ label, value, detail, filter, activeFilters = [], onToggle }) {
  if (!filter) return <article className="metric"><p>{label}</p><strong>{value}</strong><span>{detail}</span></article>;
  const active = activeFilters.includes(filter);
  return <button type="button" className={`metric metric-filter ${active ? "selected" : ""}`} aria-pressed={active} onClick={() => onToggle(filter)}><span className="metric-label">{label}</span><strong>{value}</strong><span>{detail}</span></button>;
}

function StatePill({ value }) {
  return <span className={`pill ${value}`}><span aria-hidden="true">{symbol(value)}</span>{shortState(value)}</span>;
}

function ProgressBar({ value }) {
  const safeValue = Math.max(0, Math.min(100, Number(value) || 0));
  return <div className="progress" aria-label={`${safeValue}% complete`} role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow={safeValue}><span style={{ width: `${safeValue}%` }} /></div>;
}

function shortSha(value) { return value ? value.slice(0, 8) : "unknown"; }
function shortState(value) { return String(value || "queued").replaceAll("-", " "); }
function formatTime(value) { return value ? new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "—"; }
function formatDateTime(value) { return value ? new Date(value).toLocaleString() : "Unknown update time"; }
function formatDuration(startedAt, completedAt) {
  if (!startedAt) return "Duration unavailable";
  const start = new Date(startedAt).getTime();
  const end = completedAt ? new Date(completedAt).getTime() : Date.now();
  if (!Number.isFinite(start) || !Number.isFinite(end)) return "Duration unavailable";
  const seconds = Math.max(0, Math.floor((end - start) / 1000));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainder = seconds % 60;
  return `Duration ${hours ? `${hours}h ` : ""}${minutes ? `${minutes}m ` : ""}${remainder}s`;
}
function formatAgentSummary(summary) {
  if (summary.total === 0) return "No agents registered · view details";
  const activity = summary.active ? `${summary.active} active` : summary.queuedOrWaiting ? `${summary.queuedOrWaiting} queued / waiting` : `${summary.completed} completed`;
  return `${summary.total} ${summary.total === 1 ? "agent" : "agents"} · ${activity}`;
}
function symbol(value) { return value === "active" ? "●" : value === "completed" || value === "passed" ? "✓" : value === "failed" || value === "blocked" ? "!" : value === "waiting" ? "◌" : value === "not-required" ? "—" : "○"; }
function filterLabel(value) { return value === FILTERS.activeAgents ? "active agents" : value === FILTERS.openBlockers ? "open blockers" : "open review findings"; }
