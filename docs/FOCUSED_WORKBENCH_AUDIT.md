# Focused workbench implementation audit

This is an incremental implementation record, not a release certificate. Branch work started from `82b2ab2`; the current focused-workbench pass is locally verified and has not been deployed.

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

### Row Operations Coach stepwise practice delivered (2026-09-04)

- The coach now asks for the affected row before a legal operation can be applied; incorrect candidates receive the first wrong column without exposing the full answer.
- The same workbench now includes a focused Matrix arithmetic mode for exact addition, subtraction, and multiplication. A complete candidate is checked before the exact result is revealed.
- Goal switching resets the instructional context, target summaries stay collapsed until requested, and mobile keeps the matrix, operation controls, candidate field, and 44px check action above the dock.
- Final targeted coverage is green through a 65-case configured browser run plus the final 6-case WebKit rerun after the last mobile spacing adjustment. The new pure feedback suite passes 5/5; Astro check and the production build also pass.

### Probability shared event model delivered (2026-09-04)

- Conditioning, Bayes, and seeded verification now share the same canonical four-region event table. Bayes derives its prior, likelihood paths, and posterior from that table; verification simulates the table's `P(B)` instead of an unrelated probability input.
- Conditional and posterior answers are checked locally before exact results or path accounting are shown. Invalid and incorrect answers do not disclose the target value.
- Counting remains an explicit separate counting-rule view; it is not being presented as another representation of the binary event table.
- Targeted Probability verification: 77 browser tests passed across the configured viewport/browser projects; the pure answer-feedback suite passes 3/3; the complete Node suite passes 194/194; Astro check and the production build pass.

### Optimization step checks delivered (2026-09-04)

- Bounded linear programs now ask the learner to choose the best feasible corner before revealing the objective value, optimum marker, or objective-value column. Unbounded and infeasible scenarios require an explicit model classification first.
- Zero-sum games now ask for a strict-dominance comparison before revealing row/column security levels or the equilibrium. The default game accepts “no strict dominance,” while edited matrices are checked against the exact dominance engine.
- Wrong and malformed answers stay local and do not disclose target coordinates, strategy pairs, or solution values. Editing a model resets the relevant coaching state.
- Targeted applications verification: 66 browser tests passed across the configured Chromium, Firefox, and WebKit projects; the pure optimization feedback suite passes 7/7; Astro check passes with only the existing service-worker typing hint.

### Logic translation and proof feedback delivered (2026-09-04)

- Logic & Proof now has a bounded Translate mode for controlled-language templates. It uses the exact course parser, accepts keyboard aliases, and reveals canonical notation only after a correct learner check.
- Wrong and malformed translations stay local without exposing the target form. Guided proof copy no longer exposes implementation metadata such as internal workspace/fingerprint labels; caught errors use explicit alert feedback while line-specific proof messages remain beside the affected line.
- Targeted Logic verification: 99 browser cases passed across the configured Chromium, Firefox, and WebKit projects, including mobile geometry, keyboard-sized controls, proof feedback, and serious/critical Axe checks. The translation helper suite passes 4/4.

### Counting model gate delivered (2026-09-04)

- Counting is now an explicit setup helper: the learner selects the model implied by order and repetition, receives local model feedback, and sees the exact count only after the model is correct. Invalid input remains an engine error rather than a fabricated answer.
- The existing exact counting engine, n/r inputs, persistence shape, and canonical Probability route remain unchanged. The first counting task stays within six task controls and the result remains above the mobile dock after the learner checks the model.
- Targeted Probability verification: 77 browser cases passed across the configured viewport/browser projects, with the Firefox 7-case suite rerun serially after concurrent startup stalls. The counting helper suite passes 3/3.

### Advanced optimization trace gate delivered (2026-09-04)

- The Advanced view now starts with the Simplex trace collapsed, keeping algorithm detail subordinate to the primary model.
- Markov forecast output is released by an explicit “Run forecast” action and is cleared whenever transition values, the initial distribution, or the step count changes, so stale results are not mistaken for the current model.
- Targeted Applications verification: 66 browser cases passed across the configured viewport/browser projects, with one Firefox startup stall passing on a serial rerun. The updated Advanced assertions pass on desktop and mobile layouts.

### Focused task picker and first-action pass delivered (2026-09-05)

- Replaced the persistent Logic, Probability, and Applications mode bars and normalized Finance and Linear selectors into one shared native “Choose a task” picker with grouped, learner-facing options.
- Foundation defaults are Translate a statement, Count outcomes, Move cash flows, Solve a system, and Graphical linear program. Internal task values, query parameters, legacy routes, draft keys/content versions, and exact math engines remain unchanged.
- Query-selected tasks take precedence over saved drafts; valid saved tasks continue without a query; invalid persisted task values fall back safely. Switching tasks clears stale task-specific feedback and result disclosure.
- Short-height responsive rules keep the first mathematical action above the mobile dock at 375x667 and 640x480 while preserving local scrolling for dense mathematical tables and the existing shell.
- Verification: `pnpm run verify` passed (208 Node tests, 5 Vitest tests, Astro check with 0 errors/0 warnings and one existing service-worker hint, and a 62-page production build). The full changed browser matrix completed with 816 passes and 29 intentional skips; the two follow-up failures were corrected and passed in serial reruns: task-picker mobile-375 8/8, Firefox 8/8, WebKit 8/8, and Finance WebKit 4/4. Production PWA checks passed 4/4.

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

1. Counting is now an explicit setup helper separate from the shared event table. Decide later whether a first-class course-directory view is warranted; no duplicate event representation is needed for this pass.
2. Optimization's LP, game, and Advanced outputs are now gated behind learner actions. Continue with a full audit of custom model error placement and first actions across all workbench modes.
3. Logic translation and proof feedback are delivered. Continue with notation edge cases and a full audit of proof scopes and alternate methods.
4. The shared picker and first-action pass are covered across the configured responsive/browser matrix. Remaining UX work is mode-specific: improve custom-model error placement, notation edge cases, and alternate proof methods without expanding the picker or adding new routes.
5. The final screenshots and release review remain separate from this implementation record; deployment is intentionally outside this pass.

## Dependency boundary

No third-party source code or runtime package has been imported for this pass. Existing exact engines remain authoritative. The MathLive pilot remains unevaluated; global adoption is not assumed. Source availability on GitHub, including personal use, does not waive license obligations.
