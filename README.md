# Implement Codex Plugin

Portable source repository for the `implement` Codex plugin.

## Repository layout

- `plugins/implement/` — the complete plugin: manifest, skills, hooks, scripts, and dashboard assets.
- `.agents/plugins/marketplace.json` — the local marketplace entry that exposes the plugin.

## Install from this repository

From a machine containing a clone of this repository, register the marketplace root and install the plugin:

```bash
codex plugin marketplace add /absolute/path/to/implement-plugin-repo
codex plugin add implement@personal
```

Start a new Codex thread after installing so it picks up the plugin's skills and hooks.

## Updating after edits

Run the Codex cachebuster helper, then use the bundled installer. The installer
first runs Codex's normal plugin update and then materializes the installed
root-hook commands with the actual absolute plugin path. This is required
because hook runners do not provide a `PLUGIN_ROOT` environment variable:

```bash
python3 /home/raptorx/.codex/skills/.system/plugin-creator/scripts/update_plugin_cachebuster.py plugins/implement
node plugins/implement/scripts/install-plugin.mjs install \
  --marketplace personal
```

Use `inspect` before a repair to report source and installed versions without
changing either artifact:

```bash
codex plugin add implement@personal --json
```

The installer reads the authoritative installed path from Codex's JSON result,
then refuses to materialize hooks when that selected package is stale. After a
successful install, use Codex's `/hooks` flow to review and trust the changed
hook commands, then start a new thread so it reads the updated plugin. For
portability, replace the cachebuster-helper path above with the matching path
on the target machine, or use an equivalent installed Codex plugin-creator
helper.
