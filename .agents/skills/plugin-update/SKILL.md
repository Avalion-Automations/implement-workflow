---
name: plugin-update
description: Package, install, and verify a changed Basics Codex plugin, including its lifecycle-hook materialization and trust review.
---

# Plugin update

Use this skill when a committed Basics plugin change must be installed or
reinstalled for Codex. It covers the Codex adapter only; Claude Code uses its
own plugin installation flow.

## Release preparation

- Confirm the intended semantic version is newer than the pre-change version
  in both `platforms/codex/plugin.json` and
  `plugins/basics/.codex-plugin/plugin.json`.
- Regenerate `plugins/basics/` after canonical or Codex-adapter changes, then
  run the repository's Codex-package synchronizer in check mode.
- Run the applicable repository release checks before installing changed
  content. Do not install an uncommitted or version-stale package.

## Installation and hooks

After the package checks pass, run:

```bash
node plugins/basics/scripts/install-plugin.mjs install --marketplace personal
node --test plugins/basics/scripts/install-plugin.test.mjs
codex plugin list
```

The installer must report the expected version and its absolute cache
destination. Verify that destination's `hooks/hooks.json` has no
`$PLUGIN_ROOT` or `%PLUGIN_ROOT%` token, has exactly one handler for each of
`SubagentStart`, `SubagentStop`, `PreToolUse`, `PostToolUse`, and `Stop`, and
that every handler points to the same installed
`skills/build/scripts/build-status.mjs` file.

Codex may report a local-marketplace source path rather than the cache path in
`codex plugin list --json`. That active source legitimately retains
`$PLUGIN_ROOT`: Codex supplies `PLUGIN_ROOT` to plugin hooks. Do not mutate the
tracked source hook template to an absolute user path. Ensure each hook timeout
is within Codex's supported 1–3 second range.

## Completion

- Review and trust changed hooks through `/hooks`; changed hook definitions are
  skipped until trusted.
- Start a new Codex thread after a successful update so the refreshed skills
  are discovered.
- If installation, materialization, the hook test, or enabled-version check
  fails, stop and report the concrete failure. Do not hand-edit Codex's config
  or trust hashes as a workaround.
