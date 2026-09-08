---
name: build-test-discovery
description: 'Discover the exact build, lint, test, and validation entrypoints for a repository, including CI-only checks and environment prerequisites.'
argument-hint: 'Provide the repo root or affected subtree.'
user-invocable: false
---

# Build Test Discovery

Find the narrowest executable checks that can verify or disprove bug claims.

## Procedure
1. Inspect package manifests, task files, CI configs, makefiles, and docs for build and test commands.
2. Separate local runnable commands from CI-only checks.
3. Note env vars, services, fixtures, and platform prerequisites.
4. Prefer the smallest behavior-scoped command for each surface.
5. Also list the full relevant suite command(s) that must run before sign-off on touched surfaces.

## Output
- Build commands
- Test commands
- Narrow validation targets
- Full relevant suite targets
- Environment blockers