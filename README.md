# Agent Workflows

`agent-workflows` is the portable source repository for foundational coding
agent skills and workflows. `.agents/skills/` is canonical. Hosts package or
sync that source into their native skill discovery layout.

## Layout

- `.agents/skills/` — shared skills, scripts, references, and assets.
- `.agents/adapter-contract.md` — required and optional host capabilities.
- `platforms/codex/` — Codex-only manifest, metadata, hooks, and installer.
- `platforms/claude/` — Claude Code manifest and generated host-neutral skills.
- `plugins/basics/` — the install-ready Codex package generated from the core.

## Codex: Basics

`basics` is the Codex adapter and exposes commands such as `$basics:build`.
For a first package build, run:

```bash
node scripts/sync-codex-basics.mjs
```

After changing canonical skills, verify the package with:

```bash
node scripts/sync-codex-basics.mjs --check
```

The generator refuses to overwrite `plugins/basics/`; explicitly archive or
remove that exact generated directory before rebuilding it.

Install from a clone after the package exists:

```bash
codex plugin marketplace add /absolute/path/to/agent-workflows
codex plugin add basics@personal
```

Run the package tests before reinstalling, then start a new thread so Codex
discovers the updated skills. Lifecycle telemetry is optional; set
`BASICS_RUNS_DIR` when its status records should not use Codex's default state
directory.

Set `BASICS_WORKTREE_ROOT` to place disposable Build worktrees and large build artifacts on suitable local storage. This host uses `/temp`:

```bash
export BASICS_WORKTREE_ROOT=/temp
```

This setting does not move durable status archives and never migrates existing runs.

## Other agents

Use `.agents/adapter-contract.md` and `platforms/reference/README.md` to build
an adapter for Claude or a custom coding agent. Do not copy Codex hook events,
OpenAI metadata, or the dashboard unless the target host provides equivalent
features.

## Claude Code: Basics

The Claude Code adapter is generated from the same canonical skill source.
Create or verify it with:

```bash
node scripts/sync-claude-skills.mjs
node scripts/sync-claude-skills.mjs --check
```

See `platforms/claude/README.md` for the local-plugin layout, invocation, and
host-capability fallbacks. The adapter does not install, configure, or
authenticate Claude Code.
