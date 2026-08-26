# ADR 0001 — Astro shell + React Lab Runtime + pure domain core

**Status:** Accepted for Pass 1

## Context

AMAT 19 mixes mostly static curriculum/reference pages with continuously interactive mathematical labs. Hydrating the full product would waste client JavaScript, while fragmenting one lab across many islands would complicate state and accessibility.

## Decision

- Astro owns routing, static content, metadata, and no-JS fallback content.
- Each complex lab is one React root hydrated with `client:load`.
- Mathematical semantics live in DOM-free TypeScript packages.
- The learning engine consumes mathematical results but does not redefine them.
- Persistence is a port. Dexie/IndexedDB is the first browser adapter.
- Heavy/exponential tasks receive Worker adapters when required.

## Consequences

- Domain packages can be tested in Node without Astro/React.
- Hydration failure still leaves course context and a static connective reference.
- A future backend can sync persistence without changing the math engine.
- React remains replaceable at the presentation boundary rather than becoming the mathematical source of truth.
