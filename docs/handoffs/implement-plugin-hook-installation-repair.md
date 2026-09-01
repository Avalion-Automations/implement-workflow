# Handoff: repair Implement-plugin hook installation

**Status:** Integrated into the Basics Codex installer and mandatory repository release procedure. All five hook commands are materialized and installation-tested. Retained as historical diagnosis.

## Objective

Make the installed `implement` plugin's `PreToolUse` and `PostToolUse` hooks
reliable across Codex hosts. The repair must survive future plugin updates and
must not depend on a hook runner injecting `$PLUGIN_ROOT`.

## Observed state

- Authoritative source checkout:
  `/home/raptorx/coding/agents/implement-workflow/plugins/implement`.
- Active installed plugin:
  `/home/raptorx/.codex/plugins/implement`.
- Source manifest declares `1.1.0+codex.20260830201816`; the installed manifest
  declares stale `1.0.1+codex.20260828044127`.
- The source and installed `hooks/hooks.json` and
  `skills/build/scripts/build-status.mjs` are otherwise byte-identical at the
  time of this handoff.
- Both `PreToolUse` and `PostToolUse` invoke:

  ```sh
  node "$PLUGIN_ROOT/skills/build/scripts/build-status.mjs" hook
  ```

- In the failing environment `PLUGIN_ROOT` is unset. The command then resolves
  to `/skills/build/scripts/build-status.mjs` and fails with Node
  `MODULE_NOT_FOUND`.
- Invoking the same script using its absolute installed path with representative
  PreToolUse and PostToolUse JSON events succeeds and returns `{}`. The handler
  and existing build-run archive are not the fault.

## Required repair

1. Treat plugin source and installed plugin as distinct artifacts. Do not patch
   only `/home/raptorx/.codex/plugins/implement`; any update would overwrite
   that change.
2. Add an installation/packaging step that materializes every plugin-root hook
   command to the actual installed absolute path, for example:

   ```sh
   node "/home/raptorx/.codex/plugins/implement/skills/build/scripts/build-status.mjs" hook
   ```

   The installer must derive that path from its selected install destination;
   never hard-code this example into the source plugin.
3. Preserve source portability. The source `hooks/hooks.json` may retain a
   documented placeholder, but the install process must substitute it before
   activation. If the installer cannot perform substitution, generate a
   discovered user/repository hook file with absolute commands and ensure the
   placeholder-based plugin hooks are not also active, so events are never
   handled twice.
4. Update the installed plugin from the reviewed source only after reconciling
   its currently dirty worktree. At minimum, the installation must carry the
   current source manifest version. Do not silently discard the source's
   uncommitted manifest bump or untracked skills.
5. Re-review/re-trust the changed hooks through Codex's hook management flow
   after installation.

## Required tests

Add an installation-level smoke test that executes the installed PreToolUse and
PostToolUse command with a representative Codex JSON event and an explicitly
unset `PLUGIN_ROOT`. It must exit zero and emit valid JSON.

Cover both cases:

1. No selected active Build run: the hook must safely no-op and return `{}`.
2. A selected active Build run/task: PreToolUse marks it active and PostToolUse
   records the tool outcome without altering approval, merge, or task ownership.

Also assert:

- Installed plugin manifest version equals the intended source package version.
- The installed hook command contains a resolvable absolute script path, not an
  unresolved `$PLUGIN_ROOT` token.
- PreToolUse and PostToolUse have one active handler each after installation.
- Existing command timeout and matcher behavior remain unchanged.
- A reinstall/update repeats the materialization correctly.

## Validation and acceptance

- Run the plugin's existing build-status tests plus the new installation smoke
  test.
- Exercise both installed hook events through the actual Codex hook runner, not
  only direct Node invocation.
- Confirm the user-visible hook failures disappear for Bash and `apply_patch`.
- Confirm telemetry still no-ops when no Build task context is selected.
- Confirm no source, installed-plugin, hook configuration, or trust-state file
  outside the intended repair set is overwritten without explicit approval.

## Constraints

- This is a telemetry repair only. Hooks must never approve plans, bypass
  permissions, merge changes, or block unrelated work merely because no Build
  context exists.
- Keep `SubagentStart`, `SubagentStop`, and `Stop` behavior compatible unless
  the same root-resolution defect affects them; if it does, apply the same
  installation-level materialization to all five commands.
- Prefer an idempotent installer/sync operation. A stale installed plugin must
  be detectable before replacement and report its source/installed versions.
