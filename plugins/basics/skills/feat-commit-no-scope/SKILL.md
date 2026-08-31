---
name: feat-commit-no-scope
description: Create concise Conventional Commit subjects without parenthesized scopes, using the correct change type.
---

# Commit No Scope

Create scope-free commit subjects whose type matches the actual change. The
legacy skill name does not require the `feat` type.

## Rules

1. Use `type: <short imperative description>`.
2. Choose one type: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`,
   `build`, `ci`, `perf`, `style`, or `revert`.
3. Use `feat` only for a genuinely new capability or externally observable
   contract.
4. Use `fix` for a defect correction.
5. Use `refactor` for internal restructuring that neither adds a capability
   nor fixes a defect. Do not classify vague `improve`, `refine`, or `update`
   work as `feat` without evidence of a new capability; default such internal
   improvements to `refactor` after inspecting the diff.
6. Use `chore` for actual merge commits, release/version bookkeeping, and
   repository maintenance. Format merge commits as `chore: merge <description>`.
7. Use `docs`, `test`, `build`, `ci`, `perf`, `style`, or `revert` when that is
   the primary intent.
8. Never include a parenthesized scope or breaking-change `!` marker.
9. Name the concrete outcome. Never use placeholders such as `update project
   files`, `update project tooling`, `update app flow`, or `update app
   behavior`; inspect the diff and state what changed and why.
10. Keep the subject on one line, imperative, and at most 72 characters.

## Procedure

1. Inspect the staged diff and identify its primary intent.
2. Determine whether the change adds capability, fixes a defect, restructures
   internals, merges history, or serves another allowed category.
3. Draft one subject per logical commit.
4. Run `node <skill>/scripts/validate_commit_subject.js "type: description"`.
5. Commit only after validation succeeds.

## Examples

- `feat: add paged PDF preview`
- `fix: preserve validation counts during revalidation`
- `refactor: improve file extraction pipeline`
- `chore: merge validation contracts`
- `chore: bump version to 0.4.0`
- `docs: document deployment requirements`

Reject inaccurate feat classification as well as malformed subjects:

- `feat: improve internal validation flow`
- `feat: merge validation contracts`
- `feat: update app flow`
- `chore: update project files`
- `feat(pdf): add paged preview`
- `feat!: replace validation contract`
