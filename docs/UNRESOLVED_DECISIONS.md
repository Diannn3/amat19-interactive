# Unresolved decisions

1. **IMS/UPLB branding permission** — Pass 1 does not use institutional marks as official product branding. Confirm allowed attribution/mark usage before adding seals/logos.
2. **Production PWA cache strategy** — A conservative first-party service worker is included. Re-evaluate `@vite-pwa/astro` after the first dependency-backed build and offline QA pass.
3. **MathLive** — The truth-table tokenizer already supports keyboard/Unicode notation without a math editor. Add MathLive only when a later domain genuinely benefits from structured math entry.
4. **Nano Stores** — No current cross-island real-time state exists, so no store dependency is added. Introduce a minimal store only when a concrete shared-state case appears.
5. **LP solver** — No solver dependency in Pass 1. Current architectural target is **HiGHS WASM behind a Web Worker as an answer oracle**, with the learner-facing simplex trace remaining custom/deterministic. Re-check package/browser/license details when the optimization module actually starts rather than shipping an unused solver now.
