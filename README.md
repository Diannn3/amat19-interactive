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

The dependency-free semantic suite currently passes **74/74 tests**, the architecture audit passes across **8 framework-independent packages** and **16 lab routes**, the learner-facing content audit passes, and the local app TypeScript integration check passes using temporary external-library stubs.

A real frozen-lockfile dependency install, Astro build/check, Vitest/fast-check through the installed dependency graph, Playwright browser runs, axe, offline/PWA validation, and visual QA still need to run in a networked environment before this snapshot should be called a release candidate. See `VERIFICATION.md`.

## Important numerical note

Logic/probability/matrix/game domains use exact deterministic representations where appropriate. The current Finance engine uses JavaScript numeric exponentiation and applies course-style rounding at display boundaries. Before a public correctness release, Finance should either adopt an audited arbitrary-precision decimal implementation or be independently cross-checked to the required course tolerance. This limitation is recorded rather than hidden.
