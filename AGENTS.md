# Agent workflow repository instructions

## Canonical source and generated package

- Treat `.agents/skills/` and `platforms/codex/` as canonical.
- Treat `plugins/basics/` as generated. After canonical changes, regenerate it with `node scripts/sync-codex-basics.mjs`, then require `node scripts/sync-codex-basics.mjs --check` to pass.
- Preserve a single version in `platforms/codex/plugin.json` and `plugins/basics/.codex-plugin/plugin.json`. For a release, bump the requested semantic version and replace the Codex cachebuster; do not append cachebusters.

## Mandatory hook refresh for Codex updates

Every Basics plugin install, reinstall, version bump, or cachebuster refresh must update the installed hooks. Do not finish the update with a bare `codex plugin add` because `hooks/hooks.json` contains `$PLUGIN_ROOT` and `%PLUGIN_ROOT%` templates that must be materialized for the installed destination.

After package validation and before reporting the update complete, run:

```bash
node plugins/basics/scripts/install-plugin.mjs install --marketplace personal
```

Use the actual marketplace name when it is not `personal`. The installer must invoke Codex installation, obtain the absolute installed destination, and materialize every root hook against that destination.

Then verify all of the following:

```bash
node --test plugins/basics/scripts/install-plugin.test.mjs
codex plugin list
```

- The installer exits successfully and reports the expected plugin version and absolute installed destination.
- The installed `hooks/hooks.json` contains no `$PLUGIN_ROOT` or `%PLUGIN_ROOT%` token.
- Every installed hook command points to an existing `skills/build/scripts/build-status.mjs` under that same installed destination.
- `codex plugin list` reports the expected enabled version.

Treat an unmaterialized, stale, missing, or mismatched hook destination as a failed plugin update. Repair it before committing the completion claim, and tell the user to start a new Codex thread after successful installation.

## Release checks

Before commit and push, run the workflow tests, suite lint, dashboard tests/build, plugin validation, strict skill checks, generated-package drift check, and `git diff --check`. Commit only the intended plugin update files.
