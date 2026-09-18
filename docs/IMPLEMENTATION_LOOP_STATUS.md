# AMAT 19 Implementation Loop Status

Active branch: `loop/01-truthful-surfaces`
Base: `928d445ab84fd752a6e1523fc9fc0ef2888a3f36`
Started: 2026-09-19

Status vocabulary: `PLANNED` · `IN_PROGRESS` · `BLOCKED` · `COMMITTED` · `VERIFIED` · `SUPERSEDED`

| ID | Status | Commit | CI | Notes |
|---|---|---|---|---|
| G00a | COMMITTED | be37a427 | pending | Atomic execution plan committed |
| G00b | COMMITTED | pending | pending | Status ledger finalized after dependency-security refresh |
| T00 | COMMITTED | e81947a | blocked by baseline browser debt | Neutral glass mobile nav + matching More sheet + regression contract |
| B01 | COMMITTED | this commit | pending | Align cross-browser tests with responsive/region semantics uncovered by T00 CI |
| B02 | IN_PROGRESS | — | — | Repair shared workbench tab semantics and contrast uncovered by Axe |
| G01 | PLANNED | — | — | Reject noncanonical workbench links |
| G02 | PLANNED | — | — | Production internal-link crawl |
| G03 | PLANNED | — | — | Hard-coded learner-state guard |
| G04 | PLANNED | — | — | Canonical route helpers |
| G05 | PLANNED | — | — | UI/behavior baseline |
| T01 | PLANNED | — | — | Fix Study subject routes |
| T02 | PLANNED | — | — | Remove fabricated Study progress |
| T03 | PLANNED | — | — | Remove fake resume session |
| T04 | PLANNED | — | — | Promote adaptive Study queue |
| T05 | PLANNED | — | — | Remove inactive Study resource toolbar |
| T06 | PLANNED | — | — | Derive Study resource metadata |
| T07 | PLANNED | — | — | Remove static Course progress |
| T08 | PLANNED | — | — | Suggested Study Path wording |
| T09 | PLANNED | — | — | Remove unsourced week numbers |
| T10 | PLANNED | — | — | Remove inactive Course view toggle |
| T11 | PLANNED | — | — | Workbench directory model |
| T12 | PLANNED | — | — | Course search |
| T13 | PLANNED | — | — | Course filters |
| T14 | PLANNED | — | — | Navigation IA alignment |
| T15 | PLANNED | — | — | Truthful-surfaces close |

## Rule

Do not move a task to `VERIFIED` until its pushed code has passed the applicable repository verification and GitHub CI checks. If a task's CI fails, keep that task active and fix it before beginning another learner-visible feature.

## Phase 00 CI note

The initial loop branch exposed dependency-audit failures before learner-visible work began. Narrow dependency-security commits were applied on this branch. This ledger commit intentionally follows those changes so the normal user-authored push CI can verify the patched branch tip before T00 begins.

## T00 implementation note

The existing semantic mobile navigation and route logic were preserved. T00 changes only the visual-system integration and its regression contract: neutral glass surface, neutral active/inactive states, matching More sheet, 44px minimum targets, safe viewport fit, forced-colors fallback, and reduced-motion behavior.
