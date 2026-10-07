# Blueprint Orange reconciliation goal contract

Baseline: `origin/main@11c9fb7de18cb82a714108022f0eb4bc4bcda5f6`. The user-approved source plan is `C:/Users/Dian/Downloads/AMAT19_Workbench_Redesign_Sync_AntiHallucination_Plan_2026-09-23.md`. This document records scope; it does not supersede the plan or mathematics contracts.

## Objective and acceptance

Deliver four functional canonical workbenches (Logic, Probability, Finance, Matrices), five course modules (Applications retained as lessons only), redirect retired lab URLs to instructional destinations, and preserve exact domain math, local drafts, PWA/offline behavior, accessible tab interaction, and Blueprint Orange visual coherence. The full acceptance matrix is section 21 of the source plan.

Required gates: `pnpm verify`, `pnpm test:e2e:core`, full Chromium/Firefox/WebKit E2E, `pnpm test:e2e:production`, visual inspections at 320/375/390/414/640/768/1024/1440px, focus/forced-colors/reduced-motion, no serious/critical axe findings, and manual route/notation audit. A blocked gate must be reported, never counted as passing.

## Scope and boundaries

Allowed: `apps/web/**`, `packages/course-content/**`, `packages/domain-probability/**`, `packages/domain-finance/**`, `tests/**`, project documentation, and root dependency manifest/lockfile only if a justified display dependency is needed. Do not edit `raw/**`, secret files, GitHub workflows, Vercel settings, or production data. Do not delete framework-independent math engines or Applications instructional material. No remote push, merge, or production deployment before all release checks are green and production-branch configuration is verified. Atomic local commits are authorized by the source plan.

## Parallel ownership

- Logic agent: logic workbench, logic E2E, logic prompt notation/tests. No registry, shared CSS, or finance.
- Probability agent: probability workbench, domain probability inference/distribution tests, probability E2E. No registry, shared CSS, or finance.
- Linear agent: matrix workbench, linear E2E, local linear helpers/tests. No registry or shared CSS.
- Integration agent: course registry, legacy aliases and routing, shell/home/course, finance, notation renderer/shared UI, styling, global tests, review and verification. Cherry-pick each worker branch only after inspecting its diff.

Budget: three isolated worker attempts, one integration pass, one independent UI/UX critique and bounded correction. Two identical zero-progress failures trigger replan rather than repeated retries.
