---
name: assumption-audit
description: 'List and verify the runtime, environment, input, and sequencing assumptions behind a bug claim so hidden leaps are exposed early.'
argument-hint: 'Provide the candidate claim or repro idea to audit.'
user-invocable: false
---

# Assumption Audit

Expose every hidden assumption before confidence is assigned.

## Procedure
1. List each assumption behind the claim.
2. Mark each assumption as verified, contradicted, or unverified.
3. Drop or downgrade claims that depend on too many unverified assumptions.
4. Return the minimum missing checks needed to firm up the claim.

## Output
- Verified assumptions
- Weak assumptions
- Required follow-up checks