---
name: blast-radius-analysis
description: 'Estimate the affected users, modules, data shapes, migrations, configs, and operational surfaces for a validated bug or suspected regression.'
argument-hint: 'Provide the validated bug and its touched boundaries.'
user-invocable: false
---

# Blast Radius Analysis

Measure how far the bug can spread and what a fix might disturb.

## Procedure
1. Identify affected callers, data flows, and user-visible surfaces.
2. Note config, schema, migration, cache, or compatibility implications.
3. Separate direct impact from plausible secondary fallout.
4. Return a tight impact summary.

## Output
- Direct impact
- Secondary risk
- Fix sensitivity areas