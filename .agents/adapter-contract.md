# Agent adapter contract

`.agents/skills/` is the canonical, agent-neutral source for this repository.
Adapters package those skills into a host's discovery layout and may add host
metadata without changing the core files.

## Required capabilities

An adapter must provide skill discovery and a working directory. Skills that
run scripts also require a compatible shell and the runtime named by that
script. Adapters must expose unavailable capabilities instead of pretending
they exist.

## Optional capabilities

| Capability | Skills affected | Fallback |
| --- | --- | --- |
| Fresh-context delegation | `brainstorm`, `blue-team`, `red-team`, `fixer-team`, `failing-test-generator` | Run roles sequentially or ask the user to perform the independent review. |
| Isolated Git worktrees | `blue-team`, `failing-test-generator`, `work-cleanup` | Do not parallelize overlapping edits; use a reviewed branch or stop. |
| Lifecycle hooks | `build` telemetry | Run without telemetry; hooks must never grant approval. |
| Status dashboard | `build` | Keep the file-backed status records only. |

## Adapter responsibilities

- Map neutral skill references to the host's invocation syntax.
- Put host metadata beside the packaged skill, never in `.agents/skills/`.
- Use a host-configurable state directory for optional telemetry.
- Supply a preflight that reports unavailable capabilities and unresolved
  package placeholders.

`platforms/reference/README.md` is the minimal custom-agent integration
example. `platforms/codex/` is the supported Codex implementation.
