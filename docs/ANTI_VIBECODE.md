# AMAT 19 Anti-Vibecode Gate

Every route must pass these checks before merge.

## P0 visual failures

- Any non-neutral hue in learner-facing UI.
- Any gradient, gradient text, glow, decorative background blob, or wallpaper effect.
- Generic SaaS/bento dashboard composition.
- Repeated equal-size cards used only to fill space.
- Colored status pills or color-only correctness.
- Glassmorphism across the content layer.
- Hover translate/lift as generic decoration.
- Animated headings, typewriter effects, scroll reveal, bouncing, spring decoration, number count-up.
- Fake metrics, fake streaks, fake grades, fake analytics, or generic celebration screens.
- Icon-in-circle patterns repeated where text or mathematical notation is clearer.
- Marketing copy inside the study workspace.

## Mandatory route tests

- **Subject test:** Can you identify finite mathematics with the course name hidden?
- **One-big-object test:** Is the dominant mathematical object obvious on every lab?
- **Squint test:** Can a learner immediately find the object, current action, and next decision?
- **Logo-swap test:** Would the interface still make sense as a generic project-management product? If yes, redesign it.
- **Every-surface test:** Why does each boundary exist? Remove it if whitespace/type/alignment can do the job.
- **Motion test:** Does every animation teach a mathematical relationship or state change?
- **Grayscale test:** Always passes because the product is intentionally monochrome.

## Accessibility gate

- Keyboard complete.
- No pointer-only manipulation.
- Visible double-ring focus.
- Screen-reader output describes the mathematical state.
- No page-level horizontal overflow.
- 200% zoom usable.
- Forced-colors usable.
- Reduced-motion mode is a real alternate presentation, not animation-duration hacks.
