# Agent Workflows — Claude Code contract

`.agents/skills/` is the only canonical shared skill source. The tree under
`platforms/claude/skills/` is generated from it for Claude Code; do not edit
the generated copy. `platforms/codex/` and the generated `plugins/basics/`
package are a separate adapter and are not source material for Claude.

Preserve all user work and repository context. Before deleting, overwriting,
resetting, cleaning, or otherwise losing information, obtain explicit
confirmation naming the exact target and consequence. Do not push, force-push,
or merge protected branches without explicit current approval; use an explicit
merge commit unless a fast-forward merge is specifically requested.

When a versioned deliverable changes, increment its semantic version by at
least a patch level, refresh its cachebuster, update canonical and generated
manifests together, and run the repository packaging and release checks. Do
not commit or publish a changed versioned deliverable at its previous semantic
version.

For the Claude adapter, run `node scripts/sync-claude-skills.mjs --check`.
For the separately generated Basics package, run
`node scripts/sync-codex-basics.mjs --check`. Follow
`.agents/adapter-contract.md` and `platforms/claude/README.md` for host
capabilities and fallbacks.
