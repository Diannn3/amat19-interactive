# AMAT 19 project-local UI/UX rules

Derived from the supplied `uiux-engineer-handoff-updated.zip`; the source archive remains the canonical full protocol.

1. **Static-first by default.** Astro owns content and shell; React exists only where sustained interaction justifies hydration.
2. **One coherent React root per lab.** Do not split one mathematical workflow into cross-island state fragments.
3. **Mobile-first blocking gate.** The full primary task must work at 375×667 before desktop polish counts.
4. **WCAG 2.2 AA target.** Semantic controls, keyboard completion, visible focus, non-color-only state, reduced-motion support, forced-colors review, adequate targets.
5. **No AI-slop visual language.** No generic purple/blue gradient wallpaper, glow soup, glassmorphism-for-its-own-sake, stock SaaS grids, random motion, or card bloat.
6. **Semantic tokens only.** Brand/source colors are centralized and consumed through semantic CSS variables.
7. **Math is the visual content.** Prefer authentic mathematical representations over decorative stock imagery.
8. **Explain next to the object.** Correctness, trace, and hints live near the relevant mathematical state rather than generic toasts.
9. **Owned primitives.** Use a small shadcn/Radix-style component layer only when behavior warrants it. Do not mix full UI suites.
10. **Browser-in-the-loop QA.** Required viewports: 375×667, 640×480, 768×1024, 1280×720, 1920×1080. Include keyboard, axe, reduced-motion, and forced-color passes.
11. **Third-party math/visual packages sit behind adapters.** Domain truth must never depend on React or a renderer.
12. **No official institutional-brand claim without permission.** Use course-aligned text until mark/name usage is resolved.
