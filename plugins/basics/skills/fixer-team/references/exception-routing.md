# Exception Routing

Use this table when the standard one-finding repair loop cannot continue normally.

| Condition | Required state and action |
| --- | --- |
| Report lacks a reviewed commit, a unique `RT-<domain>-<number>` ID, `path:line` evidence, impact, or an observable verification | Stop before delegation. Ask for a corrected report or route the user to [$basics:bug-list-generator](../../bug-list-generator/SKILL.md). |
| A standalone report from `bug-list-generator` has unresolved product, design, architecture, scope, compatibility, or risk choices | Before workspace mutation or delegation, add them to the decision ledger and batch the user-owned decisions through the question tool. Continue only after every material item is resolved, deferred, or irrelevant. |
| A decision-gate answer changes expected behavior, verification, or scope beyond the reviewed finding | Mark the finding `needs-context`. Request a new or corrected [$basics:bug-list-generator](../../bug-list-generator/SKILL.md) report instead of expanding the repair implicitly. |
| Entry is `needs-context` or `not-reproducible` | Do not send it to the builder. Preserve its evidence in the final handoff. |
| Planner's faithful regression test still passes | Mark the finding `not-reproducible`, retain the evidence, and do not propose a speculative fix. |
| Planner or builder needs a product decision, wider API change, or data migration | Mark the finding `needs-context`, stop that task, and request the necessary user decision. |
| Judge adds a regression test that fails | Commit that test and return only that finding to Builder. |
| Judge's proposed regression test passes | Mark the critique `not-reproducible`; do not make a change solely for it. |
| The same finding has two consecutive Builder/Judge cycles with no new faithful failing test, candidate commit, or evidence-changing disposition | Mark it `needs-context`, preserve receipts/commits, stop that finding, and ask for user direction or an explicit budget extension. Never count it fixed or ready. |
| A finding remains blocked after evidence review | Keep it out of the fixed count, continue independent findings, and include the blocker in the final handoff. |

These routes preserve the report's evidence trail; they never authorize an undocumented fix, a test weakening, or an unapproved merge.
