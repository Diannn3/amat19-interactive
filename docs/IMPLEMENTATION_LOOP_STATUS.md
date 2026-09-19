# AMAT 19 Implementation Loop Status

Active branch: `loop/01-truthful-surfaces`
Base: `928d445ab84fd752a6e1523fc9fc0ef2888a3f36`
Started: 2026-09-19

Status vocabulary: `PLANNED` · `IN_PROGRESS` · `BLOCKED` · `COMMITTED` · `VERIFIED` · `SUPERSEDED`

| ID | Status | Commit | CI | Notes |
|---|---|---|---|---|
| G00a | COMMITTED | be37a427 | pending | Atomic execution plan committed |
| G00b | COMMITTED | pending | pending | Status ledger finalized after dependency-security refresh |
| T00 | VERIFIED | e81947a | green on 35411400394 | Neutral glass mobile nav + matching More sheet + regression contract |
| B01 | COMMITTED | 8475a39 | pending | Align cross-browser tests with responsive/region semantics uncovered by T00 CI |
| B02 | COMMITTED | c147485 | pending | Use real toggle-group semantics for workbench mode selectors |
| B03 | COMMITTED | a1de286 | pending | Restore 44px topbar search touch target after visual redesign |
| B04 | COMMITTED | fda6b4c | pending | Raise inactive workbench mode contrast above WCAG AA threshold |
| B05 | COMMITTED | 78351fd | pending | Keep truth-table core test aligned with intentionally compact mobile presentation |
| B06 | COMMITTED | cefaa8d | pending | Name visual instrument controls and repair low-contrast context labels |
| B07 | COMMITTED | 79030fb | pending | Restore desktop utility navigation in the sidebar-free topbar |
| B08 | COMMITTED | 9bf0331 | pending | Migrate retired sidebar browser contracts to topbar/mobile navigation |
| B09 | COMMITTED | 5bd666c | pending | Keep production-only PWA tests out of the Astro dev browser matrix |
| B10 | COMMITTED | afc82eb | pending | Replace obsolete above-fold geometry with reachability, dock-occlusion, and overflow contracts |
| B11 | COMMITTED | 9741462 | chromium residuals | Align Money Timeline model-switch tests with the canonical task picker |
| B12 | COMMITTED | 1aa1ff5 | pending | Repair final contrast misses, fixed-dock scroll clearance, and topbar More dismissal |
| B13 | COMMITTED | 326e2b9 | 218 pass / 2 chromium focus failures | Align semantic and fixed-dock reachability assertions with current accessible surfaces |
| B14 | COMMITTED | this commit | pending | Preserve Developer-dialog trigger focus while topbar More is open |
| G01 | VERIFIED | 7bdf84f | green on 35411830032 | Reject noncanonical singular /workbench/ links in learner-facing source |
| G02 | PLANNED | — | — | Production internal-link crawl |
| G03 | IN_PROGRESS | this commit | pending | Guard known fabricated Study learner progress and resume literals |
| G04 | PLANNED | — | — | Canonical route helpers |
| G05 | PLANNED | — | — | UI/behavior baseline |
| T01 | VERIFIED | 7bdf84f | green on 35411830032 | Derive Study subject routes from the canonical workbench registry |
| T02 | VERIFIED | 93fe682 | green on 35414302611 | Remove fabricated Study progress card and percentages |
| T03 | VERIFIED | 04042f5 | green on 35414698817 | Remove fake Study resume session and empty sidebar column |
| T04 | VERIFIED | 5a431d0 | green on 35415107210 | Promote evidence-backed adaptive Study queue above browse content |
| T05 | COMMITTED | this commit | pending | Remove inactive Study resource tabs, search, and filter controls |
| T06 | PLANNED | — | — | Derive Study resource metadata |
| T07 | PLANNED | — | — | Remove static Course progress |
| T08 | PLANNED | — | — | Suggested Study Path wording |
| T09 | PLANNED | — | — | Remove unsourced week numbers |
| T10 | PLANNED | — | — | Remove inactive Course view toggle |
| T11 | PLANNED | — | — | Workbench directory model |
| T12 | PLANNED | — | — | Course search |
| T13 | PLANNED | — | — | Course filters |
| T14 | COMMITTED | this commit | pending | Align desktop primary navigation with Study/Course/Progress and move utilities under More |
| T15 | PLANNED | — | — | Truthful-surfaces close |

## Rule

Do not move a task to `VERIFIED` until its pushed code has passed the applicable repository verification and GitHub CI checks. If a task's CI fails, keep that task active and fix it before beginning another learner-visible feature.

## Phase 00 CI note

The initial loop branch exposed dependency-audit failures before learner-visible work began. Narrow dependency-security commits were applied on this branch. This ledger commit intentionally follows those changes so the normal user-authored push CI can verify the patched branch tip before T00 begins.

## T00 implementation note

The existing semantic mobile navigation and route logic were preserved. T00 changes only the visual-system integration and its regression contract: neutral glass surface, neutral active/inactive states, matching More sheet, 44px minimum targets, safe viewport fit, forced-colors fallback, and reduced-motion behavior.

## Baseline compatibility repair note

B02 keeps the existing mode selectors as button groups rather than pretending they implement the full ARIA tab interaction model. Each button now exposes its selected state with `aria-pressed`, and inactive mode labels use a darker neutral that clears the WCAG contrast failure reported by Axe.

## B06 accessibility repair

The September visual pass introduced several visually labelled controls whose labels were not programmatically associated with the inputs. B06 adds accessible names to the Probability sliders, Finance number/range/select controls, and Linear matrix cells, and raises low-contrast command/page context labels without changing mathematical behavior.

## B07 navigation repair

The Apple topbar intentionally replaced the desktop sidebar, but the sidebar's utility destinations were not replaced. B07 restores Reference, Saved, Settings, and Developer through a compact topbar More menu while keeping the full-width topbar architecture and the mobile dock unchanged.

## T14 navigation IA alignment

Desktop and mobile now share the same student-job taxonomy: Study, Course, and Progress are primary destinations; Reference, Saved, Settings, and Developer are utilities under More. Home remains visible in the desktop topbar and topbar wordmark while the mobile dock stays intentionally four-item.

## B08 shell test migration

The September Apple shell explicitly decommissioned the desktop sidebar. B08 removes browser assertions for the retired collapse rail and replaces them with current contracts: topbar route state, topbar More containment and utility access, dialog focus restoration, and the four-item mobile dock.

## B09 PWA test boundary

The regular Playwright matrix runs the Astro development server, where the app intentionally disables and unregisters service workers. Production PWA behavior remains verified by `playwright.production.config.ts` against `astro preview`; B09 prevents that production-only spec from being duplicated under the incompatible dev-server environment.

## B10 responsive test contract

The Apple instrument redesign intentionally makes several workbenches vertically richer. B10 no longer requires every mathematical control or directory card to fit in the initial viewport. Instead it verifies that canonical tools remain reachable in document order, important controls retain 44px targets when scrolled into view, the fixed mobile dock does not occlude them, and pages do not introduce horizontal overflow.

## B12 Chromium product repair

The converged Chromium run reduced the baseline to six root causes. B12 fixes the product-side ones: the topbar shortcut, command-search hint, and page-intro lede now clear the reported WCAG AA contrast misses; mobile scroll containers advertise clearance for the fixed navigation dock; and the desktop topbar More menu now dismisses on Escape or outside pointer interaction while restoring focus on keyboard dismissal.

## B13 final test-contract cleanup

Two residual assertions were semantically stale after the visual/accessibility refactor: the Home heading contains decorative visual words but exposes the intended accessible name, and the Logic translation surface is a labelled region rather than a nested heading. Mobile dock checks now center the target control before measuring occlusion, which verifies intentional reachability while preserving the 44px and no-overflow requirements.

## B14 modal focus handoff

The converged Chromium run reached 218 passes with only the Developer focus-handoff test failing in both configured Chromium projects. The topbar More outside-pointer handler now defers dismissal while the Developer modal is open, allowing the dialog to restore focus to its connected trigger before normal outside-click dismissal resumes.

## T01 + G01 canonical Study routes

Study subject shortcuts now resolve through `currentCourseProfile.workbenches` instead of hand-written route aliases. The architecture audit rejects singular `/workbench/` strings anywhere under `apps/web/src`, so the broken-link class found in the audit becomes a permanent CI failure rather than a rediscovered runtime bug.

## T02 fabricated progress removal

The Study page no longer displays invented learner percentages or completion counts. The repository architecture audit now rejects the exact fabricated progress literals previously present on `/study`, preventing a visual redesign from silently reintroducing made-up learner state.

## T03 fabricated resume removal

The static Study shell no longer invents a resumable `Practice Set 3`, matrix topic, or `6 / 10` completion state. Resume behavior is now reserved for the Dexie-backed `StudyDashboard`, which only renders sessions actually stored for the learner. The page also stops reserving a desktop column for the removed mock sidebar.

## T04 adaptive queue promotion

`/study` now answers the student's primary question first: what to study next. The existing Dexie-backed `StudyDashboard` is rendered immediately after the hero, ahead of catalog-style browsing. No queue scoring or persistence logic changed in this commit; only hierarchy and truthful explanatory copy changed, with a browser regression asserting that the real dashboard precedes the browse UI.

## T05 inert Study controls removal

The Study page no longer presents tabs, a search field, or a Filter button that have no behavior or resource model behind them. The adaptive dashboard remains first, followed by browse content. A static architecture guard and browser regression now reject the known inert toolbar controls if they reappear.
