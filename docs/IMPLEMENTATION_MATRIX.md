# Target Architecture → Pass 5 Implementation Matrix

| Capability | Status | Implementation |
|---|---|---|
| Astro content/application shell | Implemented | five module routes, course map, lesson routes, practice/check/reference/progress, responsive AppLayout |
| Responsive navigation and command access | Implemented | route-aware desktop nav, mobile dialog sheet, focus containment, grouped keyboard command palette |
| Shared lab context shell | Implemented | `LabShell.astro` across all 18 `/labs/*` routes with current/supplemental scope labels |
| One React root per complex lab | Implemented | 18 `/labs/*` routes; architecture audit enforces one `client:load` root |
| Framework-independent math domains | Implemented | logic, probability, finance, linear, games + math-core |
| Separate learning layer | Implemented foundation | attempts, checks, hints, mastery evidence; labs progressively use it |
| Exact rational core | Implemented | shared BigInt-backed Rational used by probability/linear/games |
| Seeded deterministic generators | Implemented | math-core RNG + mixed assessment + probability simulation |
| Local-first persistence | Implemented | Dexie/IndexedDB port, drafts, attempts, mastery, settings, export/import/clear |
| PWA/offline shell | Implemented scaffold | versioned caches, offline fallback, learner-controlled update activation |
| Worker boundaries | Implemented | larger truth tables + seeded probability simulation |
| Visual home/module journey | Implemented | study snapshot, three-step study loop, principles strip, metrics, compact module journeys |
| Practice/exam interaction model | Implemented | one-question stage, preserved progress/score/feedback semantics, repair links |
| Reference and progress surfaces | Implemented | searchable reference browser and progress-first attention queue |
| Responsive/accessibility resilience | Implemented | mobile overflow containment, named controls, hydration guards, contrast, reduced-motion, forced-colors |
| Logic P0 | Implemented | basics, parser, tables, classification, equivalence, validity |
| Logic proof P1 | Implemented direct-proof foundation | named AMAT rules and checked lines; conditional/indirect learner scope still gated |
| Probability P0 | Implemented | counting, inclusion–exclusion, exact conditional/independence |
| Probability P1 depth | Partial/implemented | exact discrete moments + seeded simulation; richer Bayes/multistage drawing remains future |
| Finance P0 | Implemented | interest/TVM/rate equivalence/annuities |
| Finance bonds | Implemented supplemental | coupon + redemption valuation; precision hardening still required |
| Matrix P0 | Implemented | operations, multiplication trace, RREF, inverse, systems |
| Graphical LP P0 | Implemented | feasible vertices + optimum + edge states |
| Simplex | Implemented bounded supplemental | supported standard maximization tableau trace |
| Game Theory | Implemented foundation | zero-sum security levels/pure/dominance/2×2 mixed |
| Markov | Implemented supplemental | exact transition/k-step/2-state stationary |
| Shared mixed practice | Implemented | generated cross-domain questions + lab repair links |
| Mixed course check | Implemented | feedback withheld until submit; original questions only |
| Progress/data controls | Implemented | New/Developing/Secure evidence + snapshot portability |
| Graph theory | Deferred intentionally | no authoritative current unit supplied |
| Backend/auth/cloud | Absent intentionally | local-first MVP |
| AI grading/tutor | Absent intentionally | deterministic engines remain authoritative |
| Local Pass 5 verification | Passed | 75 Node tests, 5 property tests, Astro check/build, architecture/content audits, 64 shell tests, 19 course tests, 36 all-lab mobile/axe checks |
| Cross-browser/release certification | Pending | Firefox/WebKit, fresh install/advisories, Lighthouse, real PWA lifecycle, and deployment remain out of scope |
