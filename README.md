# AMAT 19 Study Lab

A local-first, course-aligned interactive study environment for UPLB AMAT 19 (Finite Mathematics).

The product is intentionally **not** a dashboard of black-box calculators. Every implemented domain separates deterministic mathematical rules from teaching feedback and UI state, and the course map distinguishes current-guide core topics from older supplemental depth.

## Current implementation

### Logic
- Logic Basics / controlled symbolization
- Truth Table Lab with parse structure, row-pattern teaching, practice, classification, and argument validity
- Equivalence Lab
- AMAT-specific Formal Proof Workspace with named equivalence/inference rules

### Probability
- Counting Explorer: permutations, combinations, repetition models, inclusion–exclusion
- Conditional Probability & Independence Lab with two-way table/tree views
- Discrete Distribution Lab (supplemental)
- Seeded Probability Simulation Lab in a Web Worker (supplemental)

### Financial Mathematics
- Interest & Time Value Lab: simple/compound/nominal accumulation, equivalent rates, focal-date valuation
- Annuity Timeline Lab: immediate/due, PV/FV, solve value/payment
- Bond Pricing Lab: coupons, redemption, premium/discount (supplemental older-material depth)

### Matrices & Systems
- Matrix Operations Lab with exact rational arithmetic and row-by-column inspection
- Gauss–Jordan / RREF / inverse / systems lab with exact row-operation traces

### Applications
- Graphical Linear Programming Lab with feasible corners, bounded/infeasible/unbounded detection, and synchronized educational simplex trace for supported standard max problems
- Zero-sum Game Theory Lab with maximin/minimax, saddle points, strict dominance, and exact 2×2 mixtures
- Markov Chain Lab (supplemental older-material depth)

### Whole-course surfaces
- `/course` semester-aware roadmap
- `/practice` generated mixed practice with immediate feedback and repair links
- `/exam` original mixed course check with feedback held until submission
- `/reference` formula/notation reference
- `/progress` transparent local mastery evidence plus export/import/clear controls
- PWA/offline shell and user-controlled update activation

## Pass 5 UI/UX consolidation

- responsive, accessible AppLayout navigation with a mobile dialog sheet
- grouped keyboard command palette for course, lab, lesson, reference, and action destinations
- one shared context shell across all 18 lab routes, with current/supplemental scope made explicit
- visual course/module journeys that foreground the study loop instead of long text blocks
- one-question practice and exam stages with preserved progress, feedback, and repair links
- searchable reference browser and progress-first repair queue
- mobile overflow containment, reduced-motion/forced-colors handling, hydration guards, and lab control accessibility fixes

## Architecture

```text
Astro static/content shell
├─ course + lesson routes
├─ one React root per interactive lab
└─ local-first app surfaces

Framework-independent packages
├─ @amat19/math-core
├─ @amat19/domain-logic
├─ @amat19/domain-probability
├─ @amat19/domain-finance
├─ @amat19/domain-linear
├─ @amat19/domain-games
├─ @amat19/learning-engine
├─ @amat19/persistence
└─ @amat19/course-content
```

React owns interaction state, not mathematical truth. Logic, exact rational probability, matrices, game theory and deterministic traces live outside React/Astro. Expensive truth-table and probability-simulation work has Web Worker seams.

## Scope policy

The AY 2025–2026 course guide is the primary current-scope authority. Older handouts inform terminology and supplemental depth. Historical exams are assessment-pattern evidence only and are **not** republished as public question banks. Learner-facing examples and mixed practice are original/generated.

## Local development

Requires Node 22+ and pnpm 11.23.0.

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm verify
pnpm test:e2e
pnpm dev
```

Useful gates:

```bash
pnpm test:node
pnpm test:vitest
pnpm audit:architecture
pnpm audit:content
pnpm check
pnpm build
pnpm test:e2e:core
```

## Verification state of this snapshot

Pass 5 was implemented on branch `pass5/uiux-consolidation` and is locally verified with the installed dependency tree:

- direct Node semantic suite: **75/75 passed**
- direct Vitest/fast-check property suite: **5/5 passed**
- architecture audit: **8 framework-independent packages**, **18 lab routes**, one `client:load` root per lab
- content audit: **PASS**
- `astro check`: **0 errors, 0 warnings, 7 non-blocking hints**
- `astro build`: **57 static pages built**
- Playwright app-shell suite: **64/64 passed** across 375, 640, 768, and 1920px projects
- full-course browser suite: **19/19 passed** at 1280px
- all-lab mobile overflow and critical/serious axe audit: **36/36 passed** at 375 and 1280px
- visual review completed for the primary mobile, tablet, desktop, forced-colors, reduced-motion, truth-table, linear-programming, and progress surfaces

The local `pnpm` wrapper did not produce output in this host, so the final semantic, Vitest, Astro, and Playwright checks were invoked directly through the installed Node CLIs. Firefox/WebKit projects, a fresh frozen-lockfile install, Lighthouse, and real service-worker install/update/offline certification remain outside this local evidence. This branch has not been deployed or pushed. See `VERIFICATION.md` and `IMPLEMENTATION_REPORT.md`.

## Important numerical note

Logic/probability/matrix/game domains use exact deterministic representations where appropriate. The current Finance engine uses JavaScript numeric exponentiation and applies course-style rounding at display boundaries. Before a public correctness release, Finance should either adopt an audited arbitrary-precision decimal implementation or be independently cross-checked to the required course tolerance. This limitation is recorded rather than hidden.
