# AMAT 19 Interactive — Pass 1

A local-first, course-aligned interactive study environment for AMAT 19 finite mathematics.

This repository is the **first implementation pass** created from the AMAT 19 V2.0 implementation/UI/UX blueprint. No prior AMAT 19 source repository or source ZIP was available in the project library at implementation time, so this is a clean scaffold rather than an in-place refactor.

## Architecture

- **Astro 7.2 shell** for static/course content and routing.
- **One React root per complex lab**; the Truth Table lab is the first vertical slice.
- **Framework-independent TypeScript domain packages** for mathematical correctness.
- **Learning engine** separated from mathematical truth.
- **Local-first persistence** behind a port, with a Dexie/IndexedDB adapter.
- **Worker seam** for large truth tables so exponential work does not freeze the UI.
- **No backend, account, or AI dependency** in the MVP core.

## Implemented in Pass 1

- AMAT propositional-logic tokenizer and recursive-descent parser.
- Deterministic AST ids and source offsets.
- Truth evaluation for negation, conjunction, inclusive disjunction, implication, and biconditional.
- Deterministic truth-table assignment generation in AMAT handout order.
- Tautology / contradiction / contingent classification.
- Equivalence checker with counterexample.
- Argument-validity checker with all counterexample rows.
- Evaluation trace for explaining a selected cell.
- Astro course shell + Logic module route + Truth Table lab route.
- React lab with Explore, Practice, and Argument modes.
- Semantic, keyboard-accessible truth tables, symbol toolbar, selectable subexpression columns, and counterexample highlighting.
- Mobile-first styling, reduced-motion, forced-colors, and visible focus support.
- Draft persistence contract and Dexie implementation.
- Web Worker threshold/fallback for larger truth tables, plus an 8-symbol computation safety cap.
- Node semantic tests, architecture guards, Vitest property-test scaffold, Playwright/axe E2E scaffold.
- PWA manifest + service-worker/offline-shell scaffold without a runtime CDN; installability/offline behavior remains a browser QA gate.

## Run locally

```bash
corepack enable
corepack prepare pnpm@11.23.0 --activate
pnpm install
pnpm test:node
pnpm audit:architecture
pnpm dev
```

Then open the local Astro URL and visit `/labs/truth-table`.

## Verification note

The implementation environment used to create this pass could execute dependency-free Node tests, but it could not reach the npm registry, so `pnpm install`, Astro build/check, Vitest, and Playwright could not be executed here. See `IMPLEMENTATION_REPORT.md` for exact verified and unverified gates.

## Branding note

The app intentionally avoids presenting IMS/UPLB marks as official branding until permission/usage status is resolved. Course alignment is described textually instead.
