# Basics for Claude Code

This is the Claude Code adapter for the canonical skills in
`../../.agents/skills/`. `skills/` is generated: do not edit it by hand. Run
`node scripts/sync-claude-skills.mjs` to create it, and use
`node scripts/sync-claude-skills.mjs --check` to prove it is current.

Install this local plugin with the Claude Code local-plugin workflow, selecting
this `platforms/claude` directory. The plugin manifest is in
`.claude-plugin/plugin.json`; the skills are then available by their skill
names (for example, `/build`). No installation, authentication, or global
configuration is performed by this repository.

## Capability contract

**Model mapping:** no model is selected or mapped by this adapter. Claude Code
selects the session model.

**Effort:** no effort setting is configured. Role labels in adapted skills are
advisory; use the capability available in the current Claude Code session.

**Fresh-context delegation:** when isolated delegation is available, give each
agent only its bounded artifact paths and receipt contract. Otherwise perform
roles sequentially and retain the same file-backed handoffs.

**Worktrees:** use isolated Git worktrees only when the host and repository
permit them. Otherwise do not parallelize overlapping edits; use a reviewed
branch or stop for user direction.

**Lifecycle hooks:** the adapter ships no lifecycle runtime or dashboard.
Record the telemetry gap and continue with the workflow's file-backed
manifests and receipts; hooks never grant approval.

**State directory:** set `BASICS_RUNS_DIR` when durable status artifacts need
a host-selected location. `BASICS_WORKTREE_ROOT` controls only disposable
worktrees and build artifacts.

The generated tree excludes the unavailable lifecycle implementation while
retaining every canonical skill directory and all compatible resources. The
sync check validates both the generated contents and these exclusions.
