# Blueprint screenshot UX implementation receipt

Date: 2026-10-05
Branch: update/blueprint-screenshot-ux
Base commit: 81f7f601e73d1c3c183eed1f3ac9b5a208a9eacc

## Contract

Implement the approved Blueprint Orange repair plan for Study, Reference, Logic module overview/notes/practice, and Logic notation. Preserve question generation, grading, persistence, route/query contracts, and unrelated modules. Acceptance: solid compact Logic intro; independent Reference disclosures retaining source order; viewport fit from 375 through 1440 pixels; keyboard question/reset focus; no serious or critical automated accessibility violations on audited learning surfaces.

## Changes

- Study panels size to content; three desktop statistics have no empty fourth cell.
- Reference uses independent desktop columns and one ordered mobile stream; compact filter controls and space for expansion icons.
- Logic module has a solid paper hero, bounded title scale, normal-flow metrics, and padded note rows.
- Notation disclosure has padded header and definitions, stacked on mobile.
- Embedded Logic practice uses Blueprint rules, hard shadows, explicit selected/focus states, answer-selection guidance, and accessible next/previous/reset focus. Question and note counts use readable colors.

## Verification

- pnpm verify passed: architecture/content guards, type checks, unit suites, production build. Astro reported zero errors, zero warnings, two existing sw.js hints.
- Final pnpm build passed: 61 pages, 52 offline chunks.
- Existing blueprint-course and logic-workbench browser suites: 44 passed across Chromium mobile/desktop, Firefox, and WebKit.
- Production PWA suite: 4 passed, including offline query routes and persistence activation behavior.
- Screenshot repair regression suite: all 32 cases passed across six viewport widths plus Firefox and WebKit (30 in the combined run; two accessibility cases passed on isolated reruns). Four-page Axe scans now receive a 90-second budget: Firefox needed 36.5 seconds; WebKit rerun needed 27.8 seconds.
- Independent UI critic reviewed source and edge cases. Mobile midpoint divider and reset focus issues were corrected.
- Visual evidence saved locally under ignored artifacts/screenshot-ux. Desktop Study, Reference, compact hero, notes, practice and forced-color practice were inspected; mobile notes/practice were inspected. Automated layout checks cover all six affected routes.

## Disclosed limits and environment issues

The complete unrelated browser suite was not run. Initial managed dev preview returned Vite Outdated Optimize Dep and unhydrated islands; verification moved to the built production preview. Production suite first hit an existing preview process conflict, resolved by stopping the owned process. A rerun started before a rebuild finished and was interrupted; the final run uses completed build assets. Axe discovered and prompted repairs for the practice counter and Notes count contrast. Automated accessibility checks do not establish complete accessibility compliance.

Six pre-existing dirty files were preserved and excluded from implementation commits: MoneyTimelineWorkbench.tsx, use-persistence-flush.ts, apple-glass.css, pwa-production.spec.ts, workbench-aliases.spec.ts, workbench-task-picker.spec.ts. Verification covers the combined working tree, including these existing edits.

No deployment or remote push performed. Local production preview: http://127.0.0.1:4356.

Implementation commit: 18766e09cb161059b7ff102b31016fbad8bf9738.
Final independent critic review: no additional concrete regressions; earlier findings fixed. Mobile expanded notation and dark practice were also visually inspected.

## CI dependency audit repair
The protected-branch quality job initially failed because the inherited dependency lock contained 11 high-severity transitive advisories (24 total). Updated vulnerable lockfile packages to patched releases and added a scoped pnpm override for source-map-js 1.2.2 where upstream ranges otherwise retained 1.2.1. pnpm audit --audit-level high now reports no known vulnerabilities; pnpm verify passes after the update. Changes are in pnpm-lock.yaml and pnpm-workspace.yaml.
