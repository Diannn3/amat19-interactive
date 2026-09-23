# AMAT 19 Release Checklist

## Source and governance
- [ ] `main` is protected.
- [ ] Pull requests require the quality, Chromium, browser-compat, and production-PWA checks.
- [ ] GitHub Actions are restricted to approved actions and immutable SHAs where practical.
- [ ] No `.vercel/`, credentials, private assessment material, generated reports, or local test artifacts are tracked.
- [ ] Third-party notices are current.
- [ ] Repository-level license decision is explicit.

## Install and build
- [ ] `pnpm install --frozen-lockfile` succeeds on clean Node 22 environment.
- [ ] `pnpm audit --audit-level high` passes or every exception is documented and time-bounded.
- [ ] `pnpm verify` passes.
- [ ] Static build completes without warnings that affect behavior.

## Mathematical correctness
- [ ] Direct semantic tests pass.
- [ ] Property tests pass.
- [ ] Finance independent reference vectors pass to the documented tolerance.
- [ ] LP supported-boundary tests pass.
- [ ] Formal proof scope tests pass.
- [ ] Assessment generator never records evidence for a skill it did not test.

## Learning data
- [ ] Repeated/concurrent mastery updates do not lose attempts.
- [ ] Leaf evidence appears in both leaf Study recommendations and parent Progress summaries.
- [ ] `Secure` requires independent evidence.
- [ ] Import/export roundtrip and v2 migration pass.
- [ ] Malformed snapshots are rejected without deleting existing data.

## Browser and accessibility
- [ ] Chromium responsive matrix passes.
- [ ] Firefox core suite passes.
- [ ] WebKit mobile core suite passes.
- [ ] All lab routes pass critical/serious Axe checks.
- [ ] Keyboard-only navigation reviewed manually.
- [ ] Screen-reader review completed for navigation, command search, forms, tables, SVG explanations, and feedback regions.
- [ ] Forced colors and reduced motion reviewed.

## PWA/offline
- [ ] Production preview service-worker test passes.
- [ ] Fresh install works offline for all core routes.
- [ ] Query-based routes work offline.
- [ ] Upgrade from previous service-worker cache version preserves local IndexedDB data.
- [x] Update activation waits for an explicit persistence flush before reload.

## Deployment
- [ ] Security headers verified with actual production response headers.
- [ ] CSP produces no unexpected violations.
- [ ] `sw.js` is revalidated rather than long-lived in browser/CDN cache.
- [ ] No third-party runtime/CDN dependency is required for core study use.
- [ ] Lighthouse/performance budget passes on representative mobile and desktop profiles.
