# Reliable release updates and Progress repair

## Contract

Implement the approved automatic update flow and teal Progress introduction on a new branch from main `dc3010c`. Work is limited to release generation, worker/client coordination, deployment configuration, Progress presentation, and their tests. Preserve learner records, math grading, and the pre-existing whitespace edit in `use-persistence-flush.ts`. No dependency additions or database migrations.

Acceptance: two real production builds on the same origin update every open tab exactly once after saving; failed, slow, or absent participants block activation; query/hash/drafts survive; first install does not reload; offline caches stay consistent. Page, release manifest, asset manifest, and worker must share one generated revision. Mobile/tablet/desktop, dark and forced colors must show the approved teal panel without overflow. Required CI and independent review must pass before merge. Two attempts without progress trigger architectural review.

## Deployment discovery

Both Vercel projects belong to `nerooo3` / `team_y7OjSJITK4dyRC0ywy6hL1yb`, with repository `Diannn3/amat19-interactive`, root directory null, build `pnpm -r build`, and output `apps/web/dist`.

The primary project `amat19` (`prj_qBgCaEdt0TiDWodNA9u6xfpktnef`) was configured with production branch `pass1/truth-table-vertical-slice`. Its public domain resolved to commit `24a6ea62016608c9c0380a0fb2cf7d398f29a9ca`, serving worker v4. The secondary project `amat19-interactive` was already configured for main, serving `dc3010c`.

Changed the primary production branch to `main` and freshly verified it through the authenticated Vercel API. Auto-assignment is enabled. Both projects retain their existing domains.

## Implementation

The waiting worker owns tab membership, a unique request ID, acknowledgements, timeouts, and activation. Every participating tab waits for island and persisted-workbench readiness, blocks editing, and flushes the existing persistence contract. Unresponsive older tabs must close or normally reload; the worker does not navigate them or bypass saving. Fresh installs do not force activation. Each acknowledged tab verifies the new controller's version before one reload.

Current page caches take priority offline. Previous caches remain while older pages or a pending installation exist, and cleanup is restricted to recognized AMAT generations. Precached page and asset metadata must match the candidate revision; failed installation keeps the active worker.

Progress uses the requested title, supporting copy, privacy text, and disclosure, with the approved light teal and navy palette in both themes. Forced colors use system colors.

## Verification and release

Local `pnpm verify` passed: 233 Node tests, 5 Vitest tests, and the 61-page production build. Production offline/no-script checks passed (2), and the stamped artifact identity check passed (1). Dependency audit reported no known vulnerabilities. Real build tests passed tab saving/rollback, failed and timed-out saves, unresponsive tab/reconnection, and failed precache recovery. Added exact-question/answer recovery coverage for practice and exams.

Independent release critic reviewed worker coordination, cache lifetime, hydration, practice recovery cancellation/retry, and actual mobile/tablet/desktop light screenshots plus dark/forced colors. Findings were corrected; final review reported no remaining observed blocker. Final serial Progress compatibility checks passed all 5 projects (mobile375, tablet768, desktop1280, Firefox, WebKit), including light/dark axe and forced colors. Final real release checks passed all 6, including exact-question and answer restoration for practice and exams. GitHub CI remains required before merge. A local concurrent rebuild temporarily produced 404s during one screenshot run; reruns use the completed build. Firefox axe succeeded in an isolated run; parallel resource contention required a serial final pass.

Practice/exam recovery stores the exact generated questions and answer state in per-tab session storage during the handshake. Aborted updates clear the snapshot and invalidate late saves. Failed independent persistence operations retry without replaying successful writes. No grading rules or database schema changed.

Merge commit and production revision: pending release verification.
