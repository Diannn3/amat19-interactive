# AMAT 19 Study Lab

A local-first, course-aligned interactive study environment for UPLB AMAT 19 (Finite Mathematics).

AMAT 19 Study Lab is intentionally **not** a dashboard of black-box calculators. Mathematical truth lives in deterministic, framework-independent engines; React owns interaction state; Astro owns routes/content; learner data stays in the browser.

## What is implemented

### Logic
- Logic Basics / controlled symbolization
- Truth Table Lab with structure, systematic row patterns, classification, practice, and argument-validity mode
- Equivalence Lab with named one-step rewrite validation
- Formal Proof Workspace with AMAT equivalence/inference rules and scoped direct/conditional/indirect proof support

### Probability
- Counting Explorer: permutations, combinations, repetition models, inclusion–exclusion
- Conditional Probability & Independence with exact two-way analysis
- Bayes Update Lab (supplemental)
- Discrete Distribution Lab (supplemental)
- Seeded Probability Simulation Lab using a Web Worker (supplemental)

### Financial Mathematics
- Interest & Time Value: simple/compound/nominal accumulation, rate equivalence, focal-date valuation
- Cash-flow Timeline
- Annuity Timeline: immediate/due, present/future value, solve payment
- Bond Pricing (supplemental)
- BigInt-backed fixed-point `FinanceDecimal` with deterministic traces; representative calculations are cross-checked against independent high-precision reference vectors

### Matrices & Applications
- Matrix Operations with exact rational arithmetic and row-by-column traces
- Gauss–Jordan / RREF / inverse / systems with immutable row-operation traces
- Graphical Linear Programming with bounded/infeasible/unbounded detection and a bounded educational simplex trace
- Zero-sum Game Theory with maximin/minimax, saddle points, strict dominance, and exact supported 2×2 mixtures
- Markov Chains (supplemental)

### Whole-course workflow
- `/study` prioritized retrieval/repair queue
- `/course` semester-aware roadmap
- module-scoped retrieval from `/modules/:module?view=practice` with immediate deterministic feedback
- `/exam` original mixed course check with delayed feedback
- `/reference` searchable formula/notation reference
- `/progress` local mastery evidence
- `/saved` local saved-item library
- `/settings` local preferences/data controls
- PWA/offline shell with learner-controlled updates

## Architecture

```text
Astro static/content shell
├─ course, module, lesson, practice, progress, and library routes
├─ one React root per complex interactive lab
└─ local-first browser application surfaces

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

Key contracts:
- React/Astro do not decide mathematical truth.
- Logic/probability/matrices/game calculations use exact deterministic representations where appropriate.
- No `eval`, `new Function`, LLM grading, account system, cloud backend, or analytics is required.
- IndexedDB is behind a persistence port rather than embedded throughout UI code.
- Current-guide topics and supplemental older-material depth stay explicitly separated.

## Pass 8 correctness and release hardening

The current hardening pass targets `main` baseline commit `d71ca940a0882a929a6d23a80ea7f4dea8df2bdc`.

Major changes:
- pnpm 11-compatible GitHub Actions using `pnpm/setup`, immutable action SHA pins, read-only workflow permissions, and blocking high-severity dependency audit
- atomic mastery updates to prevent concurrent lost writes
- canonical skill IDs plus parent-course aggregation so leaf lab evidence and broad Progress views agree without duplicate storage
- `Secure` mastery now requires repeated independent evidence
- targeted practice no longer relabels unrelated questions as the requested skill
- stronger snapshot validation
- mathematically ordered CDF and validated total-probability partitions
- independent high-precision Finance regression vectors
- expanded proof/LP/probability/persistence/assessment tests
- full core-route service-worker precache, query-insensitive offline navigation, and a four-second network fallback bound; legacy `/practice` now redirects to Study
- production-build PWA Playwright job
- explicit Vercel security headers
- `.vercel/` repository cleanup and React Bits third-party notices

See `docs/HARDENING_PASS8.md` and `docs/RELEASE_CHECKLIST.md`.

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
pnpm test:e2e:production
```

## Current verification evidence for Pass 8 workspace

In the implementation workspace, with no dependency download available:
- direct Node semantic/regression suite: **100/100 passed**
- architecture audit: **PASS** — 8 framework-independent domain/content packages and 18 single-root lab routes
- public-content audit: **PASS**

The sandbox could not install npm dependencies, so the exact merged-tree Astro/Vitest/Playwright/Axe/frozen-lockfile gates must be run by GitHub CI after applying this pass. The CI workflow has been repaired specifically to perform those gates and now includes a production-build offline PWA check.

## Scope and correctness policy

The official AMAT 19 course guide remains the primary scope authority. Older handouts inform terminology and explicitly supplemental depth. Historical examinations are assessment-pattern evidence only and are **not** republished as a question bank. Learner-facing practice is original/generated.

Finance has a high-precision fixed-point decimal implementation, but some non-integer root/power paths can still use native-number seeding/fallback behavior. Public correctness certification should define and independently verify the required course tolerance rather than claiming arbitrary precision without qualification.

## Third-party material

Small UI patterns are adapted from or inspired by React Bits. See `THIRD_PARTY_NOTICES.md` for attribution and license terms. The repository currently does not declare a project-wide license; that decision belongs to the repository owner.
