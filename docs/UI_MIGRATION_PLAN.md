# AMAT 19 Instrument UI Migration

## Invariants

Do not alter domain engines, exact-answer semantics, mastery evidence rules, persistence contracts, PWA/update behavior, scope labeling, or deterministic generation.

## Order

1. Lock schema and anti-vibecode gate.
2. Replace semantic color/tactile tokens.
3. Introduce the instrument stylesheet and retire `pass4.css` from the app shell import path.
4. Replace the wide workspace/sidebar shell with an 80px instrument rail and mobile bottom navigation.
5. Recompose Home, Study, Course, module, lesson, Progress, Reference, Saved, Settings, Practice, and Exam surfaces.
6. Replace LabShell with a canvas-first shell.
7. Make truth tables, matrices, timelines, graphs, payoff matrices, and transition diagrams visually dominant.
8. Perform mobile, keyboard, reduced-motion, forced-colors, and anti-vibecode audits.

## Compatibility strategy

`pass4.css` remains in the repository for history during this migration but is no longer imported by `AppLayout.astro`. Existing `global.css` remains the foundational compatibility layer. `instrument.css` owns the redesigned composition and intentionally overrides any remaining old shared hooks until `global.css` can be reduced in a later cleanup without destabilizing domain behavior.
