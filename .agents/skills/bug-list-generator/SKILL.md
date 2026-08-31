---
name: bug-list-generator
description: "Turn vague defects and review notes into evidence-backed Red Team Review bug lists for $fixer-team. Use to investigate Git repositories or non-Git source directories and produce path-and-line repair queues without changing reviewed files."
---

# Bug List Generator

Turn a vague request into a repairable queue without inventing defects. This is a read-only investigation and reporting workflow: it produces the same report structure as `$red-team`, not fixes, tests, commits, branches, or code changes.

## Establish a reviewable target

1. Resolve the target source and determine whether it belongs to a Git repository.
2. For Git targets, resolve the requested commit or default to `HEAD`. Record `git status --short` and `git diff --quiet` before inspection. Ask for a commit or explicit reviewable diff when the requested Git content is uncommitted or untracked.
3. For non-Git targets, run `bash scripts/create_readonly_snapshot.sh create <source-dir>`. Record the printed source path, snapshot path, and SHA-256 digest. Use `snapshot:<digest>` as the reviewed target identifier and inspect only the snapshot. Do not reject a target solely because it is not a Git repository.
4. Use the `$red-team` Git snapshot procedure for Git targets. For non-Git targets, use only the read-only snapshot produced by the bundled script. Do not run tests, install dependencies, format files, create branches, or write to the source under review.
5. Translate the user's statements into investigation hypotheses, not findings. Search the relevant code paths, contracts, callers, tests, and error handling.
6. After a non-Git review, run `bash scripts/create_readonly_snapshot.sh hash <source-dir>` and require the digest to match the pre-review digest. For Git, repeat the source-state checks. If source integrity changed, disclose the failure and do not claim read-only verification.
7. After reporting, clean up a non-Git snapshot with `bash scripts/create_readonly_snapshot.sh cleanup <snapshot-dir>`. Never use an unvalidated recursive deletion command.

## Evidence standard

Create a finding only when it has concrete `path:line` evidence, a plausible user or system impact, and an observable way to verify it. Give findings IDs in the form `RT-<domain>-<number>` and use only these statuses:

- `confirmed`: the cited source logically demonstrates a specific defect or broken contract.
- `suspected`: evidence is meaningful but runtime/environment context is required to prove it.
- `needs-context`: the concern may be valid, but a product decision, reproduction, or missing artifact is required.
- `not-reproducible`: the source evidence does not support the original concern.

Give each finding a canonical `repairDisposition` for downstream routing:

- `eligible`: a `confirmed` finding, or a `suspected` finding with an explicit runtime verification path, may enter standalone `$fixer-team`.
- `needs-context`: the finding requires a product, design, architecture, scope, reproduction, or missing-artifact decision before repair.
- `rejected`: the finding is `not-reproducible`, unsupported, or otherwise not repairable from the reviewed evidence.

Keep provenance separate from eligibility. Reports produced by this skill use `reportSource: bug-list-generator` and `workflowMode: standalone`; do not invent a parallel disposition such as `bug-list-eligible`.

Do not make a positive finding from generic code-quality opinions, broad requests such as “make it robust,” intuition alone, or missing tests without a concrete behavior risk. Keep separate root causes as separate rows; merge only true duplicates. Mark unsupported user concerns in the rejected table rather than silently dropping them.

## Output contract

Return this exact report format so `$fixer-team` can use the `confirmed` entries, and can use a `suspected` entry only when its verification path is explicit:

```markdown
# Red Team Review

## Handoff Metadata
| Field | Value |
| --- | --- |
| `reportSource` | `bug-list-generator` |
| `workflowMode` | `standalone` |

## Summary
| Metric | Count |
| --- | --- |
| Accepted findings | |
| Needs context | |
| Rejected or duplicate | |

## Validated Findings
| Finding ID | Domain | Short description | Status | `repairDisposition` | Confidence | Evidence | Impact | What to verify |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |

## Rejected or Duplicate Findings
| Finding ID | Disposition | Rationale |
| --- | --- | --- |

## Coverage

State the reviewed commit or `snapshot:<digest>`, snapshot method, source-state verification, user issues considered, inspected paths, and scopes not reviewed.

## Final Thoughts

State the ordered repair queue and call out any product or reproduction context required before a finding can reach `$fixer-team`.
```

Order `Validated Findings` by expected impact and confidence. Put a concrete expected behavior or reproduction target in `What to verify`, not a proposed implementation. Preserve the source report unchanged once issued; if new evidence changes it, generate a new report against the new reviewed commit.

## Handoff boundary

Do not repair findings or choose a repair design. Direct the user to invoke `$fixer-team` with the completed report and the reviewed commit or non-Git snapshot identifier. Standalone Fixer uses the provenance metadata to run its pre-repair decision gate before mutation or delegation. If every concern is `needs-context` or `not-reproducible`, say that there is no repairable queue yet and identify the minimum information needed.
