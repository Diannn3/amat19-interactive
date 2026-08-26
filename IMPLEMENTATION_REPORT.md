# AMAT 19 — Pass 1 implementation report

## Source state inspected

The latest canonical AMAT artifact available before this pass was the V2.0 implementation/UI/UX blueprint marked **architecture-ready**, plus course guide, chapter handouts, and sample exams. No AMAT source-code ZIP was present in the project library search, and the guessed public repository path `Diannn3/amat19-interactive` did not resolve. Therefore this pass creates the first implementation repository rather than modifying an existing one.

## Implemented architecture

- Astro app/content shell.
- Single React lab root for Truth Tables.
- Pure TypeScript packages for math semantics.
- Separate learning/attempt package.
- Persistence port + Dexie adapter + in-memory adapter.
- Web Worker adapter for larger truth tables.
- Course content represented separately from UI state.
- No backend/auth/AI dependency.

## Course semantics implemented

The engine follows the supplied Chapter 1 handout semantics for:

- conjunction (`∧`),
- inclusive disjunction (`∨`),
- material implication (`→`),
- biconditional (`↔`),
- negation (`∼`, plus accepted input aliases),
- deterministic 2-variable and 3-variable row ordering.

The evaluator also supports classification, equivalence counterexamples, and argument-validity counterexamples. The interactive vertical slice now includes:

- Explore mode with a selectable evaluation trace,
- Practice mode on any selected computed subexpression column, with targeted feedback and a one-step conceptual hint,
- Argument mode with dynamic premise/conclusion inputs, a validity verdict, and persistent counterexample-row highlighting,
- an 8-symbol safety cap across assignment enumeration, plus a Worker seam for heavier truth-table generation.

## Test strategy

### Dependency-free gates runnable in the implementation container

- Node semantic tests against course truth-table definitions.
- Parser precedence/associativity/error tests.
- Generated assignment and semantic invariants.
- Learning-engine reducer tests.
- Memory-persistence tests.
- Architecture guard against React/Astro/DOM imports in domain packages.

### Dependency-backed gates scaffolded but not claimable yet

- `astro check`
- Astro production build
- Vitest + fast-check suite
- Playwright multi-viewport E2E
- axe scan
- browser visual critique
- service-worker offline validation

The implementation runtime could not reach the npm registry, so dependency installation was impossible in this pass. A reviewed `pnpm-lock.yaml` therefore could not be generated here either. Those gates must run immediately after extracting the ZIP on a normal networked development machine; commit the resulting lockfile, then switch CI to `--frozen-lockfile`.

## Next pass after dependency-backed verification

1. Fix any install/type/build issues found by the real toolchain.
2. Run Playwright at 375×667 first, then the remaining protocol viewports.
3. Complete browser-based keyboard/forced-colors/reduced-motion review.
4. Fix any browser-discovered interaction or accessibility defects and record screenshots/baselines.
5. Extend persistence from expression drafts into complete attempt traces/mastery only after the interaction model passes browser QA.
6. Only after Truth Table passes the full release gate, reuse the architecture for Probability.
