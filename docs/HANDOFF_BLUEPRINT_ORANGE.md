# AMAT 19 Blueprint Orange — Handoff

## Mission and current decision

Continue the user-approved Blueprint Orange redesign in this repository. The user will switch to another LLM; assume no prior context. The controlling specification is the copied plan at `docs/AMAT19_Workbench_Redesign_Sync_AntiHallucination_Plan_2026-09-23.md`. The integration contract is `docs/BLUEPRINT_RECONCILIATION_GOAL.md`. Preserve mathematical correctness, local-first persistence, accessibility, static-site/PWA behavior, and existing lesson discoverability. Do not deploy until all acceptance checks pass.

## Repository / branch

- Repo: `C:\Users\Dian\Documents\Vaults\Fensalir\businesses\amat19-blueprint-integration`
- Remote: `https://github.com/Diannn3/amat19-interactive.git`
- Branch: `fix/blueprint-workbench-reconciliation`
- Base observed: `origin/main` at `11c9fb7de18cb82a714108022f0eb4bc4bcda5f6`.
- Before this handoff commit, branch HEAD was `83e3711` (`feat(finance): typeset accessible formulas in calculation traces`) and was seven commits ahead of `origin/main`. Check `git status`, branch, and remote again before editing.
- User explicitly authorized committing and pushing this progress. No production deployment was authorized or performed.

## Product scope

Keep five course modules: Logic, Probability, Financial Mathematics, Matrices & Systems, and Applications. Keep four functional workbenches: Logic, Probability, Money Timeline, and Matrices & Systems. Applications lessons remain available, but there is no Applications workbench; its former route redirects to `/modules/applications?view=notes`. Counting and other course material remain lessons/engine features, not removed content.

The three worker implementation diffs were exported from isolated worktrees and applied to this integration branch. The worker sessions themselves did not finish verification (quota failures); do not cherry-pick their duplicate dirty worktrees. Their worktree paths are `amat19-blueprint-logic`, `amat19-blueprint-probability`, and `amat19-blueprint-linear` under `...\businesses\`.

## Work present on the integration branch

1. Seven earlier commits establish the redesign contract/plan copy, five-module/four-workbench registry, finance mockup removal and event ledger, PWA migration, course/navigation redirects, trailing-slash route normalization, and finance formula rendering. See `git log --oneline origin/main..HEAD` for exact commit history.
2. Integrated Logic workbench: canonical Truth Table and Argument Tester tabs, URL/history selection, keyboard behavior, and canonical display notation in generated prompts.
3. Integrated Probability workbench: four Radix tabs (conditional probability, distributions, random variables, supplemental inference), URL/history state, exact domain-derived PMFs/moments, Wilson interval, and local draft persistence. Added domain/model tests.
4. Integrated Matrices & Systems workbench: four canonical engine-backed goals, no decorative/mock state layer, exact multiplication trace, responsive/error behavior, and source/E2E checks.
5. Finance: semantic event ledger discloses that timeline points are samples while all periods still contribute to valuation; MathML-based accessible formulas avoid unsafe HTML; explicit zero-rate annuity/bond expressions; bond lesson includes zero-yield handling. KaTeX was removed after the architecture audit rejected raw HTML rendering; `src/env.d.ts` narrowly types the MathML JSX elements.
6. Applications lesson destinations were corrected in mixed-assessment and skill-graph metadata to point to their relevant lessons rather than the removed Applications workbench.
7. Added/updated E2E and Node tests, including four-workbench/five-module discoverability, keyboard/history checks, exact probability model tests, finance traces, mobile sizing, and axe checks.

## Verification actually observed

Most recent full static gate completed successfully:

- `pnpm run verify:static`: architecture audit PASS; content audit PASS; workspace check PASS.
- Astro check: 0 errors, 0 warnings, 2 pre-existing `public/sw.js` TypeScript hints about `self.clients`.
- `pnpm run test:node`: 228 passed, 0 failed.
- `pnpm run build`: PASS; 61 static pages; offline assets generated (52 chunks).

Most recent targeted E2E run used `AMAT_E2E_BASE_URL=http://127.0.0.1:4343`, Playwright project `desktop-1280`, and five workbench/course specs. It ran 38 tests: 36 passed, 2 failed. After that run, both failures received source/test fixes but **were not rerun** before handoff:

- Applications module still rendered links to `/workbenches/applications` from `packages/course-content/src/skill-graph.ts`; all six Applications skill links have since been redirected to their relevant lesson paths. Rebuild and rerun.
- Zero-rate bond E2E expected an exact accessible label without the implementation's truthful `at zero yield` suffix; the selector was changed to a prefix match. Rebuild and rerun.

Earlier first E2E attempt also used the default `127.0.0.1:4321` and hit an unrelated service / unhydrated page. Always set `AMAT_E2E_BASE_URL=http://127.0.0.1:4343` for the existing isolated preview, or intentionally start a fresh known server and verify it before testing. The 4343 preview may need restart/rebuild after edits.

**Important:** the full E2E suite has not passed. Search results showed stale expectations in `tests/e2e/applications-workbench.spec.ts`, `workbench-aliases.spec.ts`, `workbench-task-picker.spec.ts`, and `pwa-production.spec.ts` that still expect the removed Applications workbench or old redirects. Review/update these to the plan's current route contract, then run the full E2E suite, not just the five targeted specs. Also run responsive projects and offline/PWA production checks before declaring done.

## UI/UX review and deepsearch

- The independent UI/UX Codex review completed only as a partial source-level critique on an earlier six-commit snapshot. It reported no clear contrast failure for two sampled color pairs (reported approximate ratios 5.3:1 and 4.63:1), but did not verify computed browser styles, dark mode, forced colors, focus order, target sizes, or full responsive overflow. Refresh the critique against this branch. Separate delegated Kimi review failed with HTTP 403 due an OpenCode Go subscription requirement.
- Local Fensalir guidance was loaded from `systems/agents/13_ui_ux_engineer.md`; retain Fensalir Anti-Vibecode and Impeccable requirements.
- Deepsearch queried the W3C ARIA Authoring Practices tabs guidance: `https://www.w3.org/WAI/ARIA/apg/patterns/tabs/`. Verify keyboard behavior against it. The MDN MathML web-search request failed with HTTP 403, so do not claim an external MathML browser-support audit was completed.

## Next actions (in order)

1. Read `AGENTS.md`, `package.json`, the Blueprint plan and integration contract, then this handoff. Check `git status`, branch, current HEAD and remote.
2. Rebuild after the final Applications-link and locator changes; rerun the five targeted E2E specs at `127.0.0.1:4343`. Fix any real failures, not just assertions.
3. Search repository/tests exhaustively for old Applications-workbench assumptions and retired query modes. Update only expectations contradicted by the plan; preserve intentional compatibility redirects.
4. Run all E2E specs, then responsive/browser coverage and PWA/offline production checks. Keep failure output/artifact paths in this handoff or an appended verification section.
5. Inspect all final diffs and verify the worktree is clean after commits. Do not deploy until every acceptance criterion in the plan is verified.

## Last known E2E command

```sh
AMAT_E2E_BASE_URL=http://127.0.0.1:4343 pnpm exec playwright test --project=desktop-1280 --workers=1 tests/e2e/blueprint-course.spec.ts tests/e2e/logic-workbench.spec.ts tests/e2e/probability-workbench.spec.ts tests/e2e/linear-workbench.spec.ts tests/e2e/finance-workbench.spec.ts
```
