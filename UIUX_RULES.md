# AMAT 19 project-local UI/UX rules

This file combines the established UI/UX engineer protocol with the monochrome Instrument UI v2 contract in `docs/UI_DESIGN_SCHEMA_V2.md`.

1. **Static-first by default.** Astro owns content and shell; React exists only where sustained interaction justifies hydration.
2. **One coherent React root per lab.** Do not split one mathematical workflow into cross-island state fragments.
3. **Mobile-first blocking gate.** The full primary task must work at 375×667 before desktop polish counts.
4. **WCAG 2.2 AA target.** Semantic controls, keyboard completion, visible focus, non-color-only state, reduced-motion alternatives, forced-colors review, and adequate targets are release gates.
5. **No AI-slop visual language.** No gradient wallpaper/text, glow soup, glassmorphism content surfaces, bento dashboards, fake metrics, random motion, or card bloat.
6. **Monochrome semantic tokens only.** White, black, and neutral grays. Correct/error/state meaning is structural and textual rather than hue-based.
7. **Math is the visual content.** Prefer authentic mathematical representations over decorative imagery. Every lab has one dominant mathematical object.
8. **Selective neomorphism only.** Flat mathematical content; raised primary controls/inspectors; recessed editable wells. Depth must communicate affordance, not decoration.
9. **Explain next to the object.** Correctness, trace, hints, and assumptions live near the relevant mathematical state rather than generic toasts.
10. **Owned primitives.** Use a small shadcn/Radix-style component layer only when behavior warrants it. Do not mix full UI suites.
11. **Instructional motion only.** Motion may reveal mathematical state change. Never animate merely to make the interface feel dynamic. Reduced motion must provide an immediate static equivalent.
12. **Native-feeling typography.** The UI face is the system stack. JetBrains Mono is reserved for technical values where appropriate. Do not bundle a typeface merely to imitate a platform.
13. **Browser-in-the-loop QA.** Required viewports: 375×667, 640×480, 768×1024, 1280×720, 1920×1080. Include keyboard, axe, reduced-motion, forced-color, and horizontal-overflow passes.
14. **Third-party math/visual packages sit behind adapters.** Domain truth must never depend on React or a renderer.
15. **No official institutional-brand claim without permission.** Use course-aligned text until mark/name usage is resolved.
16. **Every surface must justify its boundary.** If whitespace, type, alignment, or a divider can express hierarchy, remove the container.
17. **Never add UI merely to make a page look designed.** Every visible element must teach, navigate, manipulate, explain, or provide feedback.
