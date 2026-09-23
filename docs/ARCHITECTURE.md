# AMAT 19 Architecture — Pass 3

## Product boundary

```text
Astro shell / content routes
│
├─ course map + lessons + reference
├─ study / module retrieval / mixed-check / progress surfaces
└─ one React application root per complex lab
      │
      ├─ interaction reducer/local UI state
      ├─ deterministic domain package
      ├─ teaching / attempt layer
      ├─ persistence adapter
      └─ Worker adapter when computation is meaningfully heavy
```

React is not the mathematical source of truth. Domain packages remain importable/testable without a browser.

## Pure package graph

```text
@amat19/math-core
  ├─ seeded RNG
  └─ exact Rational

@amat19/domain-logic
@amat19/domain-probability ──> math-core
@amat19/domain-finance
@amat19/domain-linear ───────> math-core
@amat19/domain-games ────────> math-core

@amat19/learning-engine
@amat19/course-content

browser edge only:
@amat19/persistence ── Dexie / IndexedDB
apps/web ───────────── Astro + React + UI + Workers
```

## Domain responsibilities

### Logic
AST is canonical. Rendered text is never reparsed to decide truth. Proof validation checks the selected AMAT rule and cited lines, not merely semantic equivalence of the final expressions.

### Probability
Combinatorics use BigInt. Rational probabilities, conditionals and distribution moments remain exact. Seeded simulation is an explicitly empirical layer and runs in a Worker.

### Finance
Cash flows are represented by timestamps/model parameters and every teaching trace resolves a focal-date transformation. Current numeric exponentiation uses JavaScript `number`; see the precision decision below.

### Linear algebra
Matrix elements use exact Rational values. RREF generates an immutable chronological row-operation trace. System classification derives from exact RREF structure.

### LP
The graphical engine owns the current learner-facing P0 result for two variables. The simplex engine is an educational exact-tableau implementation for a deliberately bounded standard maximization subset. It is not presented as a universal arbitrary LP solver.

### Games
The current foundation is two-player zero-sum matrix games: security levels, pure saddle points, dominance, and exact supported 2×2 mixtures.

### Markov
Supplemental transition analysis is matrix-based and exact where rational inputs are used.

## Cross-domain practice architecture

`apps/web/src/lib/mixed-assessment.ts` generates original deterministic questions from the same domain engines used by the labs. Retrieval is entered from a module route (`/modules/:module?view=practice`) so the learner always has a visible course context. The legacy `/practice` URL is a compatibility handoff to Study; it is not a product surface. The mixed runner has two UX modes:

- module retrieval: per-item deterministic feedback immediately, scoped to the selected module
- mixed course check: explanations remain hidden until submission

Both write ordinary local attempts/mastery evidence; neither is described as an official course assessment.

## Persistence

Persistence is a port, not a domain dependency. IndexedDB stores:
- lab drafts
- attempts
- mastery evidence
- settings
- content/schema metadata

Snapshot export/import is validated and local-only. Cloud sync remains absent.

## PWA/update policy

The custom service worker uses:
- network-first navigations with an offline page fallback
- cache-first same-origin static assets
- explicit versioned caches
- waiting-worker activation

An installed update never calls `skipWaiting()` automatically during an active study session. The page prompts the learner, dispatches `amat:before-update` with a task-collection detail, and waits for every mounted draft editor to become restoration-ready before asking it to persist current state. A rejected, `false`-returning, or never-ready task keeps the update pending so local work is not discarded.

## Current/supplemental curriculum boundary

Official AMAT 19 course syllabus guide = primary scope authority.

Older handouts may add depth, but the course-content package marks that depth `supplemental`. Formal proof depth, distributions/simulation, bonds, simplex and Markov can therefore exist without falsely claiming that every current section requires them.

## Finance precision decision

Pass 3 deliberately records a remaining architectural debt: Finance currently uses JavaScript numeric exponentiation. Course-style rounding occurs only at display/final-answer boundaries, but a public correctness release should adopt or independently verify an arbitrary-precision decimal implementation for rates/money. Exact Rational is retained for domains where exact rational arithmetic naturally models the course objects.
