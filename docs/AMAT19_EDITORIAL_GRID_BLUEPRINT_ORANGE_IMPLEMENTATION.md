# AMAT 19 Editorial Grid / Blueprint Orange Redesign

Date: 2026-09-23  
Branch: `redesign/editorial-grid-neobrutalism`  
Audited base: `main@64988b57fecb6078033c5c619bb36a607ae44473`

This file is the implementation-time anti-hallucination layer for the visual redesign. It supplements, and does not replace, the repository's existing correctness, UI/UX, evidence, accessibility, persistence, PWA, and release contracts.

## User-approved direction

The user selected **Blueprint Orange** from the proposed editorial-grid color studies.

Semantic palette:

- deep field / hero: `#133B5C`
- paper: `#F8F3E8`
- main ink: `#102A43`
- signal accent: `#F26430`
- secondary accent: `#8FD3C7`

These are AMAT-owned redesign values. They are not presented as official ASES Manila, UPLB, or other institutional brand values.

## Design grammar

Translate the supplied ASES Manila / Build with ASES visual references into an original AMAT system using principles rather than copied assets:

- visible technical / graph-paper grid;
- large editorial typography;
- alternating deep-color and paper fields;
- strong real borders;
- selective zero-blur offset shadows;
- compact truthful labels/stamps;
- disciplined asymmetry;
- math diagrams as the visual identity;
- restrained tactile motion;
- calmer inner mathematical workspaces.

Do **not** copy ASES logos, mascot, partner marks, university seals, photography, illustrations, page copy, or distinctive branded assets.

## Authority order

When implementation decisions conflict, use:

1. current repository code and tests;
2. newer explicit user instruction;
3. this implementation anti-hallucination layer;
4. `UIUX_RULES.md`;
5. `docs/MATH_CORRECTNESS_CONTRACT.md`;
6. `docs/AMAT19_EVIDENCE_FIRST_IMPLEMENTATION_LOOP.md`;
7. official library/platform documentation;
8. secondary design references.

## Non-negotiable invariants

- mathematical truth remains in deterministic framework-independent packages;
- no visual code becomes mathematical authority;
- no fabricated learner progress, mastery, completion, recommendation, grade, deadline, week pacing, or course claim;
- current and supplemental course scope remain distinguishable;
- core study remains local-first and offline-capable;
- no LLM grading;
- no state conveyed by color alone;
- visible focus remains present;
- reduced motion and forced-colors behavior remain supported;
- mobile 375x667 is a blocking gate;
- primary mathematical controls remain practical touch targets;
- no unnecessary runtime UI dependency;
- no custom smooth-scroll system;
- no mascot / 3D runtime added merely to imitate the reference;
- no official institutional-brand claim without permission.

## Repository audit snapshot

At the audited base:

- 295 tracked blobs, approximately 1.45 MB;
- Astro 7.2.8;
- React 19.2.8;
- Tailwind CSS 4.3.3;
- Motion 13.1.1;
- Lucide React 1.34.0;
- Radix Tabs 1.1.21;
- Plus Jakarta Sans Variable + JetBrains Mono Variable;
- Playwright + axe;
- PWA/offline shell and local persistence;
- current visual override stack includes `global.css`, `pass4.css`, `audit-v13.css`, and a large `apple-glass.css` layer.

Dark mode and the mobile-navigation theme work were merged to `main` through PR #4 on 2026-09-23 (`main@043a882355dbf092c1c8e3f9476a98fb8a7e7639`). The redesign branch reconciled that history with a two-parent merge commit (`ce5c38d711cefff2002d7f3b8daf489a9c1c26f0`). Blueprint Orange therefore preserves the repository's binary light/dark appearance contract, mobile More theme control, PWA appearance behavior, and theme-aware workbench visuals. There is no system theme mode.

## Dependency decision

The redesign requires **no new runtime UI dependency**.

Use the existing stack:

- Astro for static shell/content;
- React only for existing sustained interactive islands;
- Tailwind/CSS variables for tokens;
- Motion only where state/orientation benefits;
- Radix for existing accessible complex primitives;
- Lucide for icons;
- owned CSS/Astro primitives for grid surfaces, labels, panels, and tactile actions.

Reference libraries may inform implementation, but should not be installed wholesale.

## Implementation sequencing

Each coherent feature is committed atomically.

### Phase 0 — guardrails

- add this document;
- establish visual regression contract/baseline hooks without changing math behavior.

### Phase 1 — foundations

1. Blueprint Orange semantic tokens.
2. Light/dark editorial grid surfaces.
3. Editorial display and label typography.
4. Tactile outlined action grammar.
5. Truthful sticker/status label grammar.
6. Editorial panel variants.

### Phase 2 — shell

1. desktop shell visual conversion without changing routes;
2. utility menus/search styling;
3. mobile navigation styling;
4. PWA/offline banner styling.

### Phase 3 — home

1. dark Blueprint Orange hero;
2. authentic math hero poster;
3. editorial module ledger;
4. learning-flow section;
5. truthful shortcuts;
6. remove legacy pointer spotlight after all consumers migrate.

Later phases cover Course/modules, Study, Progress, Reference/Saved/Settings/Exam, shared workbench framing, each workbench, motion, accessibility hardening, cleanup, and final QA.

## Atomic execution contract

For each feature:

1. inspect current source and tests;
2. preserve all unrelated behavior;
3. change one coherent concern;
4. update or add contract tests where needed;
5. run targeted checks when an execution environment is available;
6. run repository verification gates at phase boundaries;
7. review for math truth, learner truth, accessibility, persistence, offline, and PWA regressions;
8. commit with a scoped message;
9. push to this branch;
10. inspect GitHub CI before considering a phase complete.

The current sandbox cannot resolve github.com from the shell, so local `git clone` and dependency-driven browser runs are unavailable here. GitHub connector writes and GitHub Actions are therefore the authoritative remote implementation/verification path for this session. This limitation must not be misrepresented as a successful local test run.

## External research references

Primary target/reference:
- https://www.asesmanila.com/
- https://buildwithases.asesmanila.com/
- https://buildwithases.asesmanila.com/shiptickets

Implementation guidance:
- https://tailwindcss.com/docs/theme
- https://docs.astro.build/en/concepts/islands/
- https://motion.dev/docs/react
- https://motion.dev/docs/react-accessibility
- https://www.radix-ui.com/primitives/docs/overview/accessibility
- https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion
- https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Grid_layout/Subgrid
- https://www.smashingmagazine.com/2019/10/editorial-design-patterns-css-grid-subgrid-naming/

## Definition of success

The redesign is successful only when AMAT feels like an original Blueprint Orange editorial mathematics product **and** remains at least as truthful, accessible, usable, offline-capable, and mathematically correct as the audited base.


## 2026-09-23 reconciliation note

The implementation began from the audited base `64988b57fecb6078033c5c619bb36a607ae44473`. While the redesign branch was in progress, `main` advanced via PR #4. The branch was not declared complete on the stale base. Instead it was reconciled against the new `main` tree, preserving new theme, PWA, Settings, workbench-neutral, and regression-test changes while reapplying only redesign-owned surfaces.

Post-reconciliation requirements:

- `main..redesign/editorial-grid-neobrutalism` must report `behind_by: 0`;
- exact light/dark theme-color metadata remains owned by the theme contract;
- Blueprint Orange adapts through semantic tokens under `html[data-theme='dark']`;
- new dark-mode/mobile-navigation tests from PR #4 must remain green;
- the redesign must pass quality, production PWA, Chromium, Firefox, and WebKit CI before handoff.
