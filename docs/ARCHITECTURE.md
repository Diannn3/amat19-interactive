# AMAT 19 architecture — implemented Pass 1

## Runtime boundary

```text
Astro route (static HTML)
├─ course/module context
├─ no-JS connective reference
└─ TruthTableLab client:load  ← exactly one React root
   ├─ lab reducer: interaction state only
   ├─ @amat19/domain-logic    ← mathematical authority
   ├─ @amat19/learning-engine ← checking/feedback/attempt semantics
   ├─ Worker adapter          ← larger truth tables
   └─ @amat19/persistence     ← IndexedDB/Dexie port
```

The React tree may render or explain mathematical state, but it does not define truth semantics. `domain-logic` has no DOM, Astro, React, IndexedDB, or renderer imports and is guarded by `scripts/audit-architecture.mjs`.

## Domain data flow

```text
raw expression
   │
   ▼
tokenize → recursive-descent parse → Proposition AST
                                      │
                      ┌───────────────┼────────────────┐
                      ▼               ▼                ▼
                 evaluator       symbol set      display nodes
                      │               │                │
                      └───────┬───────┘                │
                              ▼                        │
                       assignment rows                 │
                              │                        │
                              ▼                        │
                         truth table ◄─────────────────┘
                              │
                ┌─────────────┼──────────────┐
                ▼             ▼              ▼
          classification  explanation   learner checker
```

## Canonical logic state

The AST is the source of truth. Display strings are generated from it; table columns are derived from AST traversal; evaluation reads the AST directly. The app never reparses a rendered column label to determine its value.

Every node carries:

- a stable id derived from kind/source span,
- source start/end offsets,
- its operator/identifier type,
- child relationships.

This supports later source highlighting and proof/trace UI without rewriting the evaluator.

## State ownership

| State | Owner | Persistence |
|---|---|---|
| input selection/cell selection | React lab reducer | no |
| current proposition | React lab reducer + AST derived state | draft autosave |
| mathematical truth table | domain engine | recomputed deterministically |
| practice guesses/feedback | learning UI/reducer | attempt schema is ready; UI write-through is next |
| lab drafts | persistence port | IndexedDB/Dexie |
| attempt/mastery/settings/content metadata | persistence port | schema implemented |
| course copy/status | Astro content + course-content package | build artifact |
| cross-island global state | none yet | Nano Stores intentionally deferred |

## Worker policy

The truth-table engine caps the current learner-facing lab at eight unique symbols. Expressions with five or more symbols are sent through `truth-table.worker.ts`; failure/timeouts fall back to the pure synchronous engine. The Worker wrapper contains no mathematical rules.

The same seam is reserved for:

- large Monte Carlo simulations,
- optimization solvers,
- other bounded computation that would otherwise block input/rendering.

## Future domain package pattern

Do **not** add empty packages early. When reuse pressure exists, future modules should mirror the boundary rather than copy the UI:

```text
packages/
├─ domain-probability/
├─ domain-finance/
└─ domain-linear/
```

Probability can then adopt `BigInt`/exact rational adapters; finance can adopt arbitrary-precision decimal arithmetic; optimization can add a Web Worker + HiGHS WASM oracle while retaining a custom pedagogical trace.
