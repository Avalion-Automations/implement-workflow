# Claude Code adapter plan

## Outcome

Provide a repository `CLAUDE.md` operating contract and a standalone Claude Code
adapter under `platforms/claude/`.  The adapter must package complete canonical
skills without any Codex hooks, OpenAI metadata, Codex model IDs, or Codex
reasoning-effort settings.

## Decisions

- **DEC-001:** `.agents/skills/` remains the sole shared source; the Claude
  adapter contains a generated complete copy, checked for drift.
- **DEC-002:** The Claude adapter does not choose a Claude model or configure
  effort. Claude Code chooses these from its session/configuration. Any
  workflow role labels are advisory and never translated to `gpt-*` IDs.
- **DEC-003:** Hooks, dashboard telemetry, and Codex `openai.yaml` metadata
  are excluded. The contract reports them as unavailable and uses the existing
  sequential/file-backed fallbacks.
- **DEC-004:** A local path install and a layout check are the acceptance
  boundary; a live Claude Code install is optional and only run if `claude` is
  already installed.
- **DEC-005:** The repository's existing versioned deliverable moves from
  `2.1.1+codex.20260901171236` to a new patch version and cachebuster. The
  Codex generated package is synchronized even though its source content is
  unchanged, as required by `AGENTS.md`.

## Acceptance criteria

- **CRIT-001:** `CLAUDE.md` identifies canonical versus generated content and
  carries the repository's preservation, merge, and release constraints.
- **CRIT-002:** `platforms/claude/` has a Claude-native plugin manifest,
  complete skill copies, and installation/use documentation.
- **CRIT-003:** No packaged Claude adapter file contains `gpt-`,
  `reasoning_effort`, Codex hook events, or `openai.yaml` metadata.
- **CRIT-004:** The adapter contract gives explicit model/effort, delegation,
  worktree, telemetry, state-directory, and invocation fallbacks.
- **CRIT-005:** A deterministic check proves that the Claude skill tree equals
  `.agents/skills/` and validates the adapter exclusions.
- **CRIT-006:** Canonical/generated Codex manifests share the bumped version,
  `sync-codex-basics.mjs --check` passes, and applicable skill/package checks
  pass.

## Scope

In scope: root `CLAUDE.md`, `platforms/claude/`, a Claude adapter sync/check
script and focused tests, README discoverability, and required Codex version
and generated-package synchronization. Out of scope: installing Claude Code,
publishing to an external marketplace, credentials, remote repositories,
Codex hook changes, and protected-branch merging.

## Verification

Seed tests will first demonstrate missing Claude adapter artifacts/checks.
Implementation will run the new focused test, Claude adapter drift check,
canonical and packaged skill checks, package tests/validation, generated
package drift check, and `git diff --check`. A real local `claude` inspection
will be recorded only if the executable exists; no installation or update is
authorized.
