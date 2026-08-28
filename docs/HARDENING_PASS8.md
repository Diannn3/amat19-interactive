# Pass 8 — Correctness & Release Hardening

Target baseline: `main` at `d71ca940a0882a929a6d23a80ea7f4dea8df2bdc` (`feat: clarify AMAT 19 study navigation`, 2026-08-27).

Pass 8 deliberately preserves the existing Astro + React-islands + deterministic-domain architecture. It focuses on correctness at the seams between study questions, mastery evidence, persistence, offline behavior, and release automation.

## Implemented

### CI and supply-chain hardening
- Replace the incompatible `pnpm/action-setup@v4` path with `pnpm/setup` for pnpm 11.
- Install Node 22 through the pnpm setup action.
- Pin GitHub Actions to immutable full commit SHAs.
- Explicitly limit `GITHUB_TOKEN` to `contents: read`.
- Make high-severity dependency audit failures blocking.
- Add job timeouts.
- Add a production-build PWA browser job using `astro preview` rather than only the development server.

### Mastery correctness
- Add an atomic `updateMastery()` operation to the persistence port.
- Dexie performs mastery read/merge/write inside one read-write transaction.
- Memory persistence implements the same contract for deterministic tests.
- Leaf skill evidence is aggregated into its parent course skill for Progress without duplicating the stored evidence record, so Study and Progress see the same learning event.
- Legacy `games.saddle` evidence is normalized to `applications.game.security` without requiring a UI rewrite.
- `Secure` now requires at least three evidence updates, score >= 0.78, and at least two high-scoring independent successes.

### Assessment correctness
- Generated questions carry the skill they actually test instead of being relabeled to a requested skill.
- Factories declare which parent/leaf skills they genuinely support.
- Targeted permutation/combination and simple/compound practice can force the matching generator branch.
- Unsupported targeted skills fall back to honest same-module practice without falsely crediting the requested skill.
- Assessment size is bounded to 1–100 items.
- Generated evidence now prefers leaf skill IDs; parent-course aggregation is handled centrally by the mastery view helpers.

### Probability correctness
- Total probability now requires a non-empty partition whose priors sum exactly to 1.
- Distribution CDF output sorts by random-variable value before accumulation.
- Added known-value tests for Bayes, Binomial mass/moments, CDF ordering, and invalid partitions.

### Persistence/import hardening
- Validate settings, content metadata, optional mastery counters, skill-ID arrays, and difficulty values.
- Reject oversized snapshot collections at the schema boundary.
- Preserve v2-to-v3 migration behavior.
- Keep browser UI's existing 8 MB file-size limit as an additional outer guard.

### PWA/offline hardening
- Precache all 18 labs plus Study, Saved, Settings, and other core workspace routes.
- Normalize navigation cache keys to pathnames.
- Ignore query strings during navigation fallback so module retrieval routes such as `/modules/logic?view=practice&preset=logic-drill` work offline.
- Bound network-first navigation waits to four seconds before using cached content.
- Keep learner-controlled service-worker update activation.
- Register draft persistence flushes at editor mount, wait for restoration readiness, and require an explicit application-wide acknowledgement before activating a waiting worker.
- Add production Playwright coverage that registers the service worker and verifies query-route offline navigation.

### Deployment/repository hygiene
- Ignore and remove tracked `.vercel/` metadata.
- Remove obsolete pnpm-10-era `.npmrc` build-dependency configuration now superseded by `pnpm-workspace.yaml` `allowBuilds`.
- Add explicit Vercel security response headers and no-cache behavior for `sw.js`.
- Add third-party notices for React Bits-derived/inspired components.
- Replace pass-number course-version metadata with a semester-semantic course version.
- Align exposed conditional/indirect proof feature flags with the currently visible implementation.

## Added regression coverage
- Conditional and indirect proof scope opening, closure, contradiction, and reference visibility.
- Atomic mastery updates and key integrity.
- Snapshot validation edge cases.
- Targeted assessment attribution and legacy skill normalization.
- Repository-wide literal skill instrumentation audit.
- PWA route coverage, query-insensitive fallback, and timeout policy.
- PWA update persistence-flush acknowledgement and delayed worker activation.
- Command-palette combobox/listbox semantics and keyboard active-option linkage.
- Independent high-precision finance reference vectors.
- Graphical LP multiple-optimum and redundant-constraint cases.

## Intentionally not changed
- No backend, authentication, analytics, LLM grading, or cloud sync.
- No change to the exact `Rational` source of truth.
- No general-purpose LP/Nash solver added.
- No framework rewrite.
- No project-wide license chosen on behalf of the repository owner.

## Still required before a public correctness release
1. Run the updated CI in GitHub and require it on protected `main`.
2. Confirm the new production PWA job passes on the deployed build and run a real install/update cycle on at least Chrome/Edge plus Safari/iOS.
3. Run a fresh frozen-lockfile install and dependency audit after applying this pass.
4. Run Astro/Vitest/Playwright/Axe against the exact merged tree.
5. Add a Lighthouse or equivalent production performance/accessibility budget.
6. Decide whether unsupported concept-specific practice links should be hidden, disabled, or backed by new generators rather than module-level fallback.
7. Select a repository-level software license if public redistribution/contribution is intended.
