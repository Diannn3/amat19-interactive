# Dependency Ledger — Current Hardening Baseline

## Application/runtime
- Astro 7.x — static/content shell and routing.
- React 19.x / React DOM — interactive islands only.
- `@astrojs/react` — Astro/React integration.
- Tailwind CSS 4.x / `@tailwindcss/vite` — utility generation and project tokens.
- Radix Tabs — owned accessible tab primitive.
- Lucide React — iconography.
- Plus Jakarta Sans / JetBrains Mono — packaged local fonts; Jakarta is the interface face and JetBrains Mono is reserved for formulas, values, tables, and technical data.
- Dexie 4.x — IndexedDB adapter behind the persistence port.
- Motion — narrowly used for reduced-motion-aware headline behavior.

## Test/dev
- TypeScript 6.x.
- Vitest 4.x.
- fast-check 4.x.
- Playwright 1.62.x.
- `@axe-core/playwright` 4.x.

## Deliberately project-owned
- propositional parser/evaluator and named proof-rule validation
- BigInt Rational arithmetic
- combinatorics and exact finite probability
- finance teaching traces and fixed-point decimal layer
- matrix/RREF/system engine
- two-variable graphical LP engine
- bounded educational simplex routine
- zero-sum 2x2 game engine
- Markov primitives
- seeded mixed-assessment generation
- mastery/retrieval prioritization rules

## Deliberately deferred
- General LP oracle such as HiGHS WASM until course requirements exceed the current 2D + bounded-simplex surface.
- MathLive while text/symbol inputs remain sufficient.
- Cross-island state library while the current architecture has no demonstrated need.
- Cloud/backend dependencies until local-first workflows are validated.

## Release policy
- pnpm 11 is the package manager authority declared by root `package.json`.
- CI uses the pnpm 11-native setup action and a clean frozen-lockfile install.
- High-severity dependency audit is a blocking release check.
- Do not add a dependency solely to replace a small deterministic domain function unless correctness, accessibility, security, or maintenance clearly improves.
