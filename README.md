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

Run the Codex cachebuster helper against `plugins/implement`, then reinstall `implement@personal`:

```bash
python3 /home/raptorx/.codex/skills/.system/plugin-creator/scripts/update_plugin_cachebuster.py plugins/implement
codex plugin add implement@personal
```

For portability, replace the helper path above with the matching path on the target machine, or use an equivalent installed Codex plugin-creator helper.
