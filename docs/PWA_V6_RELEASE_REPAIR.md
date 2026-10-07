# PWA v6 release lifecycle repair

Date: 2026-10-07
Branch: `fix/pwa-v6-release-lifecycle`
Base: `66e5804dc84c19354833423ede5bcd257131acfa`

## Incident

Production clients could remain on an older AMAT 19 service worker even after a newer Vercel deployment succeeded. Repeated browser reloads did not reliably activate the waiting worker, and on slow connections the active worker could fall back to cached HTML after four seconds.

The most important production-only defect was in `scripts/build-offline-assets.mjs`: the build appended a content revision directly to `VERSION`. Source code compared `VERSION` to an exact release string to decide whether to force a stale-worker migration, so the generated production worker made that comparison false. Unit tests exercised the source template rather than `apps/web/dist/sw.js`, allowing the mismatch to survive earlier v3-v5 repair attempts.

## v6 contract

- `RELEASE = amat19-blueprint-v6` is stable.
- `BUILD_REVISION` is the only value stamped by the production build.
- Cache names include both release and build revision.
- v6 rescues v2-v5 clients by checking legacy cache prefixes and by asking the currently active worker for `GET_RELEASE`.
- v5 and older workers do not answer that handshake, so rescue still works when earlier `Clear-Site-Data: "cache"` responses already removed Cache Storage.
- A temporary rescue marker cache carries the migration decision into activation and is deleted with stale AMAT caches.
- Ordinary v6-to-v6 updates answer the release handshake and remain learner-controlled.

## Page lifecycle

- Removed the redundant cache-busted `fetch('/sw.js?...')`; `registration.update()` is the single update check.
- A waiting update is still surfaced through Save & update.
- A deliberate browser Reload is also update consent. After the page reaches load, the same persistence-flush contract runs and the waiting worker receives `SKIP_WAITING`.
- Persistence tasks have an eight-second failure bound. Timeout or failure keeps the old version active and explains why instead of leaving the button permanently disabled.
- `controllerchange` reloads only after an application-authorized activation.
- Normal navigation retains the four-second network-first fallback. Explicit reloads use an unbounded `cache: 'no-store'` network request and fall back only on actual failure.

## HTTP caching

- `sw.js`: no-store for browser and Vercel CDN.
- `sw-assets.json`: no-store for browser and Vercel CDN.
- Removed `Clear-Site-Data: "cache"` from `sw.js`; routine update checks no longer purge unrelated HTTP cache state.

## Recovery

Progress → Your study data now exposes **Repair offline app**. It unregisters service workers and deletes only `amat19-*` Cache Storage entries, then reloads. IndexedDB drafts, attempts, mastery evidence, sessions, saved items, settings, and exported backups are not cleared by this action.

## Regression coverage

- Source worker lifecycle tests cover fresh install, legacy rescue, marker cleanup, explicit reload freshness, headers, and update polling.
- A new post-build Node test executes `apps/web/dist/sw.js` and verifies:
  - the placeholder was stamped,
  - legacy caches force rescue,
  - a cacheless legacy active controller still forces rescue,
  - v6-to-v6 updates do not force activation.
- Production Playwright coverage models a browser Reload with a waiting worker and confirms `SKIP_WAITING` is sent after persistence readiness.
- The production-PWA GitHub Actions job runs the generated-worker regression immediately after `pnpm build`.
