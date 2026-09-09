# Claude adapter contract

The Claude adapter packages the canonical `.agents/skills/` tree without
Codex-specific lifecycle hooks, dashboard files, host model selection, or
effort settings. Claude Code selects its session capabilities; workflows that
need isolated delegation run sequentially when that capability is unavailable.

## Invocation preflight

Run packaged script commands from the adapter root (the directory containing
this file). In a repository checkout that is `platforms/claude`:

```bash
cd platforms/claude
node ./skills/feat-commit-no-scope/scripts/validate_commit_subject.js "type: concrete outcome"
```

For a locally installed plugin, change to that installed plugin directory
before running an equivalent command. This avoids an unresolved plugin-root
placeholder while keeping commands independent of a host-specific install
path.

## Capability fallbacks

- Missing lifecycle hooks or dashboard: retain file-backed receipts and state
  records; never treat telemetry as approval.
- Missing fresh-context delegation: run bounded roles sequentially.
- Missing worktree support: do not parallelize overlapping edits.
