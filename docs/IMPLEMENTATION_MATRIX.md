# Target architecture → Pass 1 implementation matrix

This matrix records what was implemented now versus deliberately deferred until a real module creates reuse pressure.

| Target capability | Pass 1 status | Implementation / reason |
|---|---|---|
| Astro content/application shell | Implemented | `apps/web`; static routes and one hydrated lab root. |
| One React application boundary per complex lab | Implemented | Truth Table route has exactly one `client:load` root. |
| Framework-independent domain core | Implemented | `packages/domain-logic`, `packages/math-core`; no React/Astro/DOM imports. |
| Separate teaching/attempt layer | Implemented foundation | `packages/learning-engine`; checker results and append-only attempt actions are separate from truth semantics. |
| Typed canonical mathematical state | Implemented for Logic | AST + ordered symbols + assignments + table rows + evaluation trace. |
| Local-first persistence port | Implemented | `packages/persistence` with in-memory test adapter and Dexie/IndexedDB browser adapter. |
| Full attempt/mastery persistence in UI | Deferred after interface QA | Port/schema exist; Pass 1 UI autosaves the active expression draft only to avoid locking an untested interaction model into storage. |
| Web Worker compute seam | Implemented | Truth tables use a dedicated Worker from 5 symbols upward with timeout/fallback. |
| Computation safety/cancellation | Partial | 8-symbol global enumeration cap + Worker termination; richer cancellation/progress belongs to later heavy modules. |
| Astro Content Collections | Implemented foundation | Course lesson content uses `src/content.config.ts` + `glob()` loader. |
| PWA/offline shell | Implemented scaffold, browser gate pending | Manifest + conservative service worker; production offline cache strategy must be validated after a real Astro build. |
| Global cross-island store / Nano Stores | Intentionally deferred | There is no shared cross-island realtime state yet. Adding a store now would be speculative complexity. |
| Mafs / custom graph adapter | Deferred | No graph-heavy vertical slice exists in Truth Tables. Add with Probability/LP only after interaction/a11y spike. |
| HiGHS WASM optimization adapter | Deferred | No optimization route exists in Pass 1. Keep solver behind a future Worker/adapter; do not load it in Logic. |
| MathLive / symbolic interchange | Deferred | Logic input is intentionally token-aware text + symbol toolbar first. Add MathLive only if course input ergonomics justify its cost. |
| Fraction.js / Decimal.js | Deferred to owning domains | Logic truth semantics are boolean. Probability and Finance will own exact rational/decimal dependencies. |
| Backend/auth/cloud sync | Intentionally absent | MVP remains private/local-first; persistence port leaves a future adapter seam. |
| AI tutor | Intentionally absent | Mathematical correctness and teaching feedback remain deterministic. |
| Browser E2E/axe/multi-viewport | Scaffolded, not executed here | Playwright config covers 375×667, 640×480, 768×1024, 1280×720, and 1920×1080. Registry access blocked dependency installation. |
