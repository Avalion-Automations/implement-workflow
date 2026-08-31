# Tracking protocol

Prefer the repository’s documented work-tracking workflow. When it has no suitable location, create `docs/test-seeds/<run-id>-contract.md` using this structure:

# Test Seed: <run-id>

- **Owner / date:**
- **Target branch / base SHA:**
- **Seed branch / worktree:**
- **Request:**
- **Contract status:** Proposed or confirmed.
- **In scope / non-goals:**
- **Criteria:** table from the orchestration contract.
- **Planned test paths:**
- **Expected initial failures:** criterion, command, and missing behavior.
- **Validation evidence:** command, exit code, and result.
- **Commits:** SHA, message, and covered criteria.
- **Residual ambiguity / blockers:**
- **Merge readiness:** Ready for merge to `<target>` or not ready, with reason.

Update it after contract confirmation, every commit, final validation, and handoff. Do not write a result handoff that says a change is implemented; it only states that test seeds are ready for an implementation workflow.
