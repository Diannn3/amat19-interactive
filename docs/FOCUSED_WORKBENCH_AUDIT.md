# Focused workbench implementation audit

This is an incremental implementation record, not a release certificate. Branch work started from `82b2ab2`; no push or deployment is included.

## Consolidation delivered

- Five canonical workbenches replace eighteen independent lab destinations.
- Course, reference, repair, and skill links use canonical workbench URLs and selected tasks.
- All eighteen legacy URLs retain static compatibility pages. The legacy argument query retains Argument mode. A no-JavaScript redirect fallback is included.
- Unused standalone lab UI was removed; exact domain engines and the embedded Formal Proof editor remain.
- One React root owns each workbench. Generic context/reminder rails are absent.
- The production worker precaches all built mathematical UI chunks, not just HTML. Its cache revision is derived from build output; incomplete installs do not activate.

### Money Timeline stepwise valuation delivered (2026-09-04)

- The timeline now presents one cash-flow movement as the first task instead of exposing the final valuation immediately.
- Cash-flow, annuity, and bond presets all provide a student-entered exponent/value check backed by the exact finance engine; feedback identifies invalid input, time-shift, sign, and arithmetic errors locally.
- The full valuation and trace remain behind an explicit “Show full calculation” action. The mobile check action stays above the dock across the configured Chromium, Firefox, and WebKit runs.
- Targeted finance verification: 77 browser tests passed across the configured viewport/browser projects; the complete Node suite passed with 186 tests.

### Verification of route retirement (2026-09-04)

- Architecture/content audits and Astro checks passed (0 errors, 0 warnings; one pre-existing service-worker typing hint).
- Unit baseline: 179 Node tests and 5 Vitest tests passed before additional feedback/PWA regressions were added.
- Production build generated 62 pages, including compatibility pages.
- Broad shell/navigation/workbench run: 140 passed, 6 deliberately skipped, 1 navigation-context failure during a development reload. The isolated overflow rerun passed. This is not a claim that the complete browser suite passed.
- All eighteen legacy URLs and direct task selection passed the focused browser tests.
- Production PWA suite: 4 passed, including all five initially unvisited workbenches hydrating offline, persistence-gated updates, legacy argument selection, and no-script fallback.
- New worker regression tests cover asset precaching and CORS-module cache matching.

## Learning-interaction gaps still open

Consolidating destinations does not by itself fulfill the brief. These are acceptance gaps to close before declaring the goal complete:

1. Row Operations Coach currently executes a chosen legal operation; it must also diagnose a student-entered arithmetic result. Matrix arithmetic remains a supporting-mode gap.
2. Probability currently groups calculators rather than synchronizing representations of one model. Counting, conditioning, Bayes, and simulation need a coherent model/view distinction.
3. Optimization still reveals its solution immediately. Formulation/corner checks and dominance reasoning need student actions before the solution.
4. Logic needs translation coverage and a full audit of proof-mode feedback, notation, and visible implementation metadata.
5. Audit all modes, not only default pages, for mobile first-action visibility, local error placement, keyboard use, forced colors, reduced motion, and Axe.
6. Complete `verify:full` plus production PWA checks and inspect final screenshots before a release claim.

## Dependency boundary

No third-party source code or runtime package has been imported for this pass. Existing exact engines remain authoritative. The MathLive pilot remains unevaluated; global adoption is not assumed. Source availability on GitHub, including personal use, does not waive license obligations.
