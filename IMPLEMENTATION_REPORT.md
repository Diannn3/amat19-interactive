# AMAT 19 Full-Course Implementation Report

Date: 26 Aug 2026
Local implementation label: **Pass 3 — Full Course Foundation + Cross-Domain Practice**

## Executive summary

This pass expands the original Logic vertical slice into a broad AMAT 19 study environment while preserving the architectural rule established in Pass 1: mathematical authority stays in framework-independent domain packages; React/Astro render, manipulate, persist, and teach that state but do not redefine it.

The current-guide core now has interactive coverage for Logic, Probability, Financial Mathematics, Matrix Operations/Inverse/Systems, graphical Linear Programming, and a zero-sum Game Theory foundation. Older-material-only topics—formal proof depth, distributions, simulation, bonds, simplex and Markov chains—are explicitly labeled supplemental/extended where appropriate rather than silently treated as current requirements.

## Implemented domain engines

### Logic
- tokenizer + recursive-descent parser
- AST with source spans/stable ids
- deterministic truth tables / classification
- equivalence + counterexamples
- argument validity + counterexamples
- AMAT named proof rules and exact one-step rule validation
- direct proof line validation and reference safety

### Probability
- BigInt factorial/permutation/combination
- repetition variants
- inclusion–exclusion
- exact Rational probability
- exact two-way conditional/independence analysis
- exact discrete expectation/variance
- deterministic seeded Bernoulli simulation

### Finance
- simple accumulation
- compound accumulation
- nominal conversion-period accumulation
- nominal ↔ annual effective conversion
- focal-date valuation of one/many cash flows
- annuity immediate/due; present/future; solve value/payment
- supplemental level-coupon bond pricing + premium/discount classification
- explicit teaching traces for each model

### Linear algebra / applications
- exact Rational matrix representation
- add/subtract/scalar/transpose/multiply
- inspectable row-by-column multiplication trace
- determinant
- exact RREF with elementary row-operation history
- inverse via Gauss–Jordan `[A|I]`
- exact system classification and solution
- 2D graphical LP: feasible points/vertices, objective values, infeasible/unbounded/optimal status
- educational exact simplex tableau trace for supported standard maximization form
- exact Markov transition validation, k-step movement and two-state stationary distribution

### Game theory
- zero-sum payoff matrix
- row minima / column maxima
- maximin / minimax
- saddle points
- strict row/column dominance
- exact interior 2×2 mixed-strategy solution with boundary/degenerate handling

## Implemented learner-facing labs

1. Logic Basics
2. Truth Table / Argument Validity
3. Equivalence
4. Formal Proof Workspace
5. Counting Explorer
6. Conditional Probability & Independence
7. Discrete Distributions (supplemental)
8. Probability Simulation (supplemental, Worker-backed)
9. Interest & Time Value
10. Annuity Timeline
11. Bond Pricing (supplemental)
12. Matrix Operations
13. Gauss–Jordan / RREF / Inverse / Systems
14. Graphical LP + synchronized supported Simplex trace
15. Game Theory
16. Markov Chain (supplemental)

## Whole-course product work

- semester-aware course map
- all five module pages
- content-collection lesson routing
- original reference notes across every implemented module
- Formula & Notation Reference
- Mixed Practice generator spanning all five modules
- Mixed Course Check that withholds feedback until submission
- deterministic seeded question generation
- direct repair links from missed mixed questions into the relevant lab
- transparent local mastery evidence
- attempt persistence
- IndexedDB snapshot export/import/clear
- PWA offline shell
- waiting-worker update flow so a study session is not forcibly reloaded
- user-facing scope labels for current vs supplemental material
- explicit graph-theory hold: no invented module without authoritative scope

## Content/IP policy implemented

Historical handouts/exams are specifications and assessment-pattern evidence. Public content and generated practice are original. `scripts/audit-content.mjs` guards obvious historical-assessment leakage into learner-facing source.

## Current technical limitation

This environment cannot resolve `registry.npmjs.org`, so pnpm 11.23.0 cannot be downloaded through Corepack and a Pass 3 lockfile cannot be regenerated locally. The dependency-backed Astro/Vitest/Playwright gates therefore remain pending.

The connected GitHub integration can read the repository but returned HTTP 403 for write operations earlier in the work, so this full implementation currently exists as a local artifact rather than a pushed remote commit.
