# AMAT 19 Evidence-First Atomic Implementation Loop

Base audited commit: `928d445ab84fd752a6e1523fc9fc0ef2888a3f36`
Plan started: 2026-09-19

## Execution contract

Every implementation unit follows this loop:

1. Inspect the current source and relevant tests.
2. Reproduce the current behavior or add a failing contract test when appropriate.
3. Implement only one coherent feature.
4. Run targeted checks.
5. Run the repository verification gate.
6. Review the diff for mathematical, learner-trust, accessibility, persistence, and offline regressions.
7. Commit that feature atomically.
8. Push and verify GitHub Actions.
9. If CI fails, repair the same feature before beginning another.
10. Record the verified commit in `docs/IMPLEMENTATION_LOOP_STATUS.md`.

A feature is not complete merely because it renders.

## Non-negotiable invariants

- Mathematical truth remains in deterministic framework-independent engines.
- No LLM grading.
- Core learning remains local-first and offline-capable.
- Current-course and supplemental content remain distinguishable.
- Learner-specific progress, counts, resume state, mastery, and recommendations may never be fabricated.
- Hints, reveals, retries, and duplicate problem fingerprints must not masquerade as independent mastery evidence.
- Visible controls must be functional and accessible.

## Branch sequence

- `loop/00-guardrails`
- `loop/01-truthful-surfaces`
- `loop/02-course-provenance`
- `loop/03-assessment-contract`
- `loop/04-practice-coverage`
- `loop/05-response-feedback`
- `loop/06-skill-practice-expansion`
- `loop/07-study-queue-v2`
- `loop/08-progress-v2`
- `loop/09-mixed-check-v2`
- `loop/10-product-integration`
- `loop/11-accessibility-release`
- `loop/12-student-validation`

## Verification tiers

Before every code feature commit, run the relevant targeted tests and `pnpm verify`.

For UI/navigation changes, also run relevant Playwright tests on `mobile-375` and `desktop-1280`.

For persistence/PWA changes, run migration coverage and production-PWA tests.

Before closing a phase:

```bash
pnpm verify:full
pnpm test:e2e:production
pnpm audit --audit-level high
```

GitHub Actions jobs `quality`, `browser-chromium`, `browser-compat`, and `production-pwa` must be green before the phase is closed.

## Phase 00 — Guardrails

- G00 — install this execution plan and status ledger.
- T00 — first learner-visible task: rebuild the mobile bottom navigation as a compact monochrome glass tab bar that matches the current black/white Apple-HIG-inspired visual system.
- G01 — reject noncanonical `/workbench/*` learner links.
- G02 — crawl built internal links.
- G03 — guard learner-facing state against hard-coded mock progress.
- G04 — centralize canonical learning destinations.
- G05 — capture semantic/visual regression baseline.

## Phase 01 — Truthful learner surfaces

- T01 canonical Study links.
- T02 remove fabricated Study progress.
- T03 remove fake Continue Learning session.
- T04 promote the real Dexie-backed adaptive Study queue.
- T05 remove inactive Study resource controls.
- T06 derive resource metadata from actual content.
- T07 remove static Course progress.
- T08 label the unsourced syllabus as a suggested study path.
- T09 remove unsourced week assignments.
- T10 remove inactive Course view toggle.
- T11 extract searchable workbench directory model.
- T12 implement real Course search.
- T13 implement real filters.
- T14 align desktop/mobile information architecture.
- T15 close with a truthful-surfaces audit.

## Phase 02 — Course provenance

Create structured course-source types and a source registry; attach provenance to modules, skills, lessons, and references; visibly distinguish current and supplemental material; enforce classification in content audits.

## Phase 03 — Unified assessment evidence

Move persistence from schema v3 to v4 with response type, evidence mode, problem fingerprint, generator/template identity, misconception code, first-attempt state, hint count, and reveal state. Migrate all scored interactions to one atomic assessment pipeline.

## Phase 04 — Truthful practice coverage

Every current leaf skill must declare one of: generated direct practice, structured workbench, guided-only, notes-only, supplemental, or unsupported. CTAs must reflect actual capability and never silently relabel same-module fallback as targeted practice.

## Phase 05 — Constructed responses and staged feedback

Build reusable exact number, rational, model choice, matrix, row-operation, logic-expression, and point responses. Use a staged feedback ladder: local error → process hint → smaller subtask → explicit worked-solution reveal.

## Phase 06 — Complete current-skill practice

Implement/refactor direct or structured assessment for the current logic, probability, finance, matrix/system, linear-programming, and game-theory leaf skills. Each skill is a separate commit.

## Phase 07 — Study Queue v2

Centralize learner evidence selectors, wire prerequisites, add transparent review-due rules, prioritize misconception repair, explain recommendation reasons, support resumable three/five-item sessions, and add a truthful new-learner state.

## Phase 08 — Progress v2

Parent mastery must require child breadth. Replace dominant mastery percentages with evidence summaries, independent/assisted evidence, last independent checks, due review, misconception signals, and next actions.

## Phase 09 — Mixed Course Check v2

Use an explicit current-course assessment blueprint, mixed response types, delayed feedback, skill-level diagnostics, and a generated repair plan that feeds the Study queue.

## Phase 10 — Product integration

Reuse the same evidence model across Home, Course, lessons, Saved, Reference, settings, and backup/restore.

## Phase 11 — Accessibility and release

Keyboard, screen-reader feedback, forced colors, reduced motion, short-height mobile, production route crawl, PWA schema migration, offline study-loop coverage, performance budgets, dependency/security closure, and release checklist.

## Phase 12 — Student validation

Run real student tasks, add local-only research instrumentation/export, evaluate delayed transfer, document actual findings, and convert them into the next atomic backlog.

## T00 visual contract

The current mobile bottom bar is the first visible fix because it conflicts with the neutral visual system.

Required direction:

- translucent neutral/white surface rather than opaque maroon;
- thin neutral border and low-elevation shadow;
- near-black active icon/label, neutral gray inactive state;
- no decorative gradient or bouncing dock behavior;
- compact height while retaining ~44px touch targets;
- safe-area aware;
- visible labels;
- `aria-current="page"`;
- usable in forced-colors and reduced-motion modes;
- no horizontal overflow or clipping at 320–375px;
- must not obscure the first page action on short-height devices.

Primary tabs remain Study, Course, Progress, More. Broader information architecture changes belong to T14.

## Completion definition

The program is done when the app has no fabricated learner state or inert controls; current-course scope is sourced; every current leaf skill has truthful practice coverage; all scored interactions use the canonical evidence pipeline; Study recommendations are explainable; Progress reflects evidence rather than opaque readiness percentages; Mixed Check produces an actionable repair plan; schema migration preserves learner data; core study works offline; and full CI/accessibility/release gates are green.
