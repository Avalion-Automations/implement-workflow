# Reference adapter

For a custom coding agent, expose every directory under `.agents/skills/` as a
discoverable skill. Preserve its `SKILL.md` and adjacent resources. Before a
capability-dependent workflow runs, compare host capabilities with
`.agents/adapter-contract.md`; either provide the capability or use the stated
fallback.

Do not install Codex hooks, OpenAI metadata, or the dashboard unless the host
implements their equivalent lifecycle events.
