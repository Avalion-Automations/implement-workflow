# Handoff: configurable Build worktree root

**Status:** Integrated into the Basics Build root resolver, run ledger, shared orchestration contract, and work-cleanup note discovery. Retained as acceptance history.

## Objective

Make the Basics Build workflow use one configurable location for large,
disposable worktrees and build artifacts instead of scattering them across
`/tmp`, `/var/tmp`, and user-created fallback directories.

## Observed state

- The canonical Build skill currently prescribes
  `/tmp/build-runs/<run-id>/integration`.
- The status server separately supports `BASICS_RUNS_DIR`, but that controls
  durable status archives rather than temporary worktree placement.
- On the observed host, `/tmp` is a 7.7 GiB tmpfs, `/var/tmp` shares the
  50 GiB root filesystem, and `/home/raptorx/tmp` has been used as an ad hoc
  fallback.
- A dedicated local-NVMe ext4 filesystem is mounted at `/temp` with mode
  `1777`; it is the intended disposable scratch location.
- Conservative preservation of active, dirty, blocked, and unmerged Build
  artifacts means inconsistent roots accumulate and complicate cleanup.

## Required change

1. Add a dedicated configuration variable named `BASICS_WORKTREE_ROOT`.
2. Resolve temporary Build paths under:

   ```text
   ${BASICS_WORKTREE_ROOT}/build-runs/<run-id>/...
   ```

3. Keep durable run status under the existing state root and
   `BASICS_RUNS_DIR`; do not conflate worktree storage with status storage.
4. For this host, document `/temp` as the configured worktree root.
5. Preserve a portable fallback when the variable is unset, but centralize
   fallback resolution in one helper rather than embedding `/tmp` throughout
   skill instructions and orchestrator prompts.
6. Resolve and record the absolute root once at run initialization. Every
   Blue, Red snapshot, Fixer, Judge, and integration lane must inherit that
   recorded root rather than selecting its own fallback.
7. Preflight the selected filesystem for existence, writability, free space,
   local-versus-network storage, and incompatible mount options. Fail before
   creating branches or worktrees when the root is unsuitable.
8. Never migrate or delete existing run directories automatically. Existing
   roots remain cleanup candidates governed by `basics:work-cleanup`.

## Work-cleanup integration

- Teach inventory/reporting to read optional candidate registries from
  `<user-home>/.codex/notes/work-cleanup/*.md` or define an equivalent
  machine-readable registry.
- A registry entry is a discovery hint, never deletion authorization.
- Before proposing removal, verify the path exists, determine its owning Git
  repository, inspect worktree registration, dirtiness, locks, branch merge
  evidence, and task/handoff activity.
- Preserve `devel`, `main`, and `master`, and preserve all active, dirty,
  locked, uncertain, unmerged, or task-associated entries.
- Require exact row-by-row user approval before removing a real worktree or
  deleting a branch.

## Required tests

1. Configured local root produces all temporary lane paths below that root.
2. Durable status paths remain unchanged when only
   `BASICS_WORKTREE_ROOT` changes.
3. Unset configuration uses one documented portable fallback.
4. Unwritable, full, missing, or unsuitable roots fail before Git mutation.
5. Child-team prompts cannot override the run-recorded root.
6. Paths containing spaces are handled safely.
7. Cleanup-note discovery reports candidates but never removes them in report
   mode or without explicit approval.
8. Legacy runs under `/tmp`, `/var/tmp`, and user fallback roots remain
   discoverable without being silently migrated.

## Acceptance

- No canonical Build instruction hardcodes `/tmp/build-runs` except as a
  documented fallback example.
- A run initialized with `BASICS_WORKTREE_ROOT=/temp` keeps all large,
  disposable artifacts under `/temp/build-runs/<run-id>`.
- `node scripts/sync-codex-basics.mjs --check` passes after regeneration.
- Strict skill checks, Build script tests, dashboard tests/build, plugin
  validation, and `git diff --check` pass.
- Installation follows the repository's mandatory hook-refresh procedure.

## Constraints

- Do not clean, migrate, or overwrite existing worktrees as part of this
  change.
- Do not change protected-branch or explicit-approval cleanup guarantees.
- Do not use network-mounted storage as an automatic fallback for active Git
  worktrees.
- Treat scratch data as disposable only after its owning run is terminal and
  cleanup approval has been granted.
