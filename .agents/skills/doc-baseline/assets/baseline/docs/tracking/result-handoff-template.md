# Documentation agent result handoff

- **Owner / date:**
- **Goal reference:** Link or identifier for the approved agent goal.
- **Outcome / status:** Complete, partial, or blocked, with a concise result.
- **Changed paths:** Every changed file and its purpose.
- **Verification evidence:** Commands run and pass/fail results.
- **Promotion status:** Draft-only or promoted topics. For each promotion, provide canonical path, valid semantic version, and SHA-256 of raw canonical UTF-8 bytes from `docs/manifest.yaml`.
- **Blockers / risks:** Remaining decisions, failures, or review needs.
- **Next owner / action:** Who can safely proceed and what they should do.

## Handoff rule

Do not claim promotion or production readiness while the documentation gate is failing.
