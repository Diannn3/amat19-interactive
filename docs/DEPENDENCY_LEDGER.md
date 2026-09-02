# Dependency Ledger — Instrument UI v2

## Application/runtime
- Astro 7.x — static/content shell and routing.
- React 19.x / React DOM — interactive islands only.
- `@astrojs/react` — Astro/React integration.
- Tailwind CSS 4.x / `@tailwindcss/vite` — utility generation and project tokens.
- Radix Tabs — owned accessible tab primitive.
- Lucide React — restrained functional iconography.
- Native system UI stack — active interface typography; no packaged sans face is imported by the application shell.
- JetBrains Mono — packaged local technical face for compact formula/value/table contexts where a monospaced treatment improves legibility.
- Dexie 4.x — IndexedDB adapter behind the persistence port.

## Declared legacy packages that are inactive in Instrument UI v2
- `@fontsource-variable/plus-jakarta-sans` remains present in the current lockfile/package manifest but is no longer imported by active application source. Remove it during a lockfile-maintenance change made with the repository's pinned pnpm version rather than hand-editing the lockfile inside a UI overlay.
- Motion remains declared from an earlier headline experiment but is not used by the Instrument UI v2 shell. It can be removed in the same dependency-maintenance pass after a clean install/build verification.

Keeping those declarations temporarily is deliberate: this overlay does not hand-edit `pnpm-lock.yaml` or dependency resolution state without the pinned package manager available.

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
- CI uses a clean frozen-lockfile install.
- High-severity dependency audit is a blocking release check.
- Do not add a dependency solely to replace a small deterministic domain function unless correctness, accessibility, security, or maintenance clearly improves.
- Dependency removal must update the manifest and lockfile together through the pinned pnpm toolchain.
