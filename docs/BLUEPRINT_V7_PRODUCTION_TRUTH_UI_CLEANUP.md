# Blueprint v7 — Production Truth + UI Architecture Cleanup

Date: 2026-10-07  
Base: `main@dc3010c91884d61b18a11a9fd4e1e7447ef0d435`  
Branch: `refactor/blueprint-v7-production-truth`

## Why this pass exists

A real-device screenshot showed `amat19.vercel.app` rendering an older AMAT 19 module shell even after GitHub/Vercel status checks reported successful deployments. The screenshot also exposed a separate UI-architecture problem: the visible surface mixed pre-redesign, Apple/glass, and Blueprint Orange generations.

This pass treats those as two distinct failures:

1. **production truth was not independently provable**;
2. **the styling cascade still used historical redesign layers as a de facto versioning system**.

## Baseline audit

Before v7, the live layout imported:

- `global.css`
- `pass4.css`
- `audit-v13.css`
- `apple-glass.css`
- `editorial-grid.css`

Measured source CSS baseline:

- **489,012 bytes**
- **16,804 lines**
- **3,089 `!important` declarations**
- `apple-glass.css`: 88,013 bytes / 3,658 lines / 633 `!important`
- repeated shell/module selectors spread across multiple generations

The old Applications workbench implementation also remained in the source tree after its public route had been retired.

## v7 production-truth contract

### Public fingerprint

Every production build now emits `/version.json`:

```json
{
  "commit": "<VERCEL_GIT_COMMIT_SHA | GITHUB_SHA | local>",
  "release": "amat19-blueprint-v7",
  "revision": "<16-char content revision>",
  "builtAt": "<ISO timestamp>"
}
```

The same commit and release are exposed as document metadata:

- `meta[name="amat19-build"]`
- `meta[name="amat19-release"]`

`version.json` is served with browser/CDN `no-store` headers.

### Real-origin verification

`scripts/verify-public-deployment.mjs` polls the real public origin and succeeds only when:

- production `commit` equals the expected GitHub SHA;
- production `release` equals `amat19-blueprint-v7`.

GitHub Actions now runs a `production-origin` job on pushes to `main`, targeting:

`https://amat19.vercel.app/version.json`

A green Vercel status is therefore no longer treated as proof that the public alias moved.

## PWA v7 migration

`RELEASE` is now `amat19-blueprint-v7`.

Legacy rescue includes:

- workbench v2
- Blueprint v3
- Blueprint v4
- Blueprint v5
- Blueprint v6

An active v6 controller reports its release through the existing worker handshake; v7 sees the release mismatch, force-activates once, clears old AMAT cache generations, claims clients, and refreshes them while preserving IndexedDB learner data.

Ordinary v7 → v7 revisions remain learner-controlled.

## UI architecture changes

### Removed

- deleted `apple-glass.css` from the repository;
- removed live `apple-glass-card` markup;
- renamed the remaining arrow affordance away from Apple naming;
- deleted `OptimizationStrategyWorkbench.tsx`;
- deleted its orphaned answer-feedback helper and unit test;
- removed the retired Applications workbench from screenshot capture.

### Single ownership

Historical module-route and mobile-dock selectors were removed from both:

- `pass4.css`
- `editorial-grid.css`

Current ownership is explicit:

- `shell-v7.css` — mobile topbar + mobile navigation
- `module-v7.css` — all `/modules/*` route surfaces

A Node contract fails if legacy styles reclaim these selectors.

### Mobile shell

At ≤900 px:

- topbar target: **56 px**
- bottom dock target: **56 px + safe area**
- flat dock instead of oversized floating neo-brutalist pill
- no graph-paper background behind mobile learning content
- 40 px theme/search controls inside a 56 px masthead
- More panel remains accessible from the dock
- content gets explicit dock clearance

### Module pages

The old giant hero-card model is removed.

Module overview is now:

- open paper, not a dark/gradient card;
- module label → H1 → concise lede;
- compact primary + practice actions;
- small `Primary / Core skills / Notes` metadata;
- flat three-tab navigation;
- first real study action targeted inside the initial 375×667 viewport.

Applications remains explicitly notes-first and does not recreate a fifth workbench.

## Naming normalization

Learner-facing destinations use the canonical registry names:

- Logic Workbench
- Probability Workbench
- Money Timeline
- Matrices & Systems

Retired product labels are forbidden on current public surfaces:

- Logic & Proof
- Probability Model Builder
- Row Operations Coach
- Optimization & Strategy

## CSS reduction

After the v7 ownership cleanup:

- **351,257 bytes** total source CSS
- **12,002 lines**
- **1,902 `!important` declarations**

Change from baseline:

- **−137,755 bytes (−28.2%)**
- **−4,802 lines (−28.6%)**
- **−1,187 `!important` declarations (−38.4%)**

The remaining 1,902 `!important` declarations are still technical debt, concentrated primarily in `editorial-grid.css`. v7 deliberately removes the most conflict-prone route/shell ownership first rather than attempting a high-risk all-at-once rewrite of every workbench.

## Regression gates

Added/updated gates cover:

- single CSS ownership for modules/mobile nav;
- no Apple/glass stylesheet import;
- size and `!important` ceilings on the new owner files;
- canonical public workbench naming;
- no retired Applications workbench;
- generated v7 worker behavior;
- public build fingerprint;
- mobile module geometry at 375×667;
- real production alias commit verification after `main` pushes.

## Success condition

This pass is complete only when:

1. all existing quality/browser/PWA checks pass;
2. PR is merged into protected `main`;
3. Vercel finishes the production build;
4. `production-origin` confirms `amat19.vercel.app/version.json` reports the merge SHA and `amat19-blueprint-v7`;
5. the public mobile module route no longer reproduces the oversized old screenshot composition.
