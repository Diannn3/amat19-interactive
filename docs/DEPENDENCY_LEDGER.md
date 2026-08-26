# Dependency Ledger — Pass 3

## Application/runtime

- Astro 7.2.6 — static/content shell and routing
- React 19.2.8 / React DOM — interactive lab roots only
- @astrojs/react 6.0.4
- Tailwind CSS 4.3.3 / @tailwindcss/vite 4.3.3
- Radix Tabs 1.1.21 — owned tab primitive
- Lucide React 1.34.0 — icons
- Inter Variable / Sora Variable — local package fonts
- Dexie 4.4.5 — IndexedDB adapter

## Test/dev

- TypeScript 6.0.3
- Vitest 4.1.11
- fast-check 4.9.0
- Playwright 1.62.1
- @axe-core/playwright 4.13.0

## Deliberately project-owned / no external solver dependency

- propositional logic parser/evaluator/proof rules
- BigInt Rational arithmetic
- combinatorics/probability
- finance teaching traces
- matrix/RREF/system engine
- 2D graphical LP engine
- bounded educational simplex routine
- zero-sum 2×2 game engine
- Markov primitives
- seeded mixed assessment generator

## Deferred dependency decisions

- arbitrary-precision decimal package for production Finance accuracy: required decision before public correctness release
- general LP oracle such as HiGHS WASM: defer until arbitrary/high-dimensional LP becomes a real learner requirement
- Mafs: no dependency added; current visualizations use accessible SVG/table mirrors
- MathLive: no dependency added because current text/symbol inputs remain sufficient
- Nano Stores: no cross-island real-time state requirement yet
