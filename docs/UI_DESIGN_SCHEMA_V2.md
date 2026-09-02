# AMAT 19 UI Design Schema v2

Status: implementation authority for the monochrome instrument redesign.

## Product thesis

AMAT 19 Study Lab is a monochrome mathematical instrument suite with Apple-like restraint, selective tactile neomorphism, and direct manipulation where the mathematics becomes the interface.

**Course content = personality. Neomorphism = structure. Glass = controls only.**

The visual identity comes from propositions, truth grids, probability partitions and trees, financial timelines, matrix brackets and pivots, coordinate planes, feasible regions, payoff matrices, and state transitions. Do not decorate the mathematics; make the mathematics the decoration.

## Hard boundaries

The redesign must preserve:

- framework-independent domain engines and exact-answer semantics
- learning/mastery semantics and evidence rules
- local IndexedDB persistence and update flushing
- PWA/offline safety
- course scope and current/supplemental distinction
- question generation and assessment behavior
- Astro/static-first routing with one coherent React root per sustained lab workspace

## Visual system

Use only white, black, and neutral grayscale.

- Canvas: `#f5f5f5`
- Surface: `#fafafa`
- Raised surface: `#ffffff`
- Strong ink: `#090909`
- Primary text: `#111111`
- Secondary text: `#595959`
- Tertiary text: `#858585`
- Hairline: `rgba(0,0,0,.09)`
- Strong divider: `rgba(0,0,0,.18)`
- Selected fill: `#111111`
- Selected text: `#ffffff`
- Recessed field: `#f3f3f3`

No maroon, orange, blue, semantic hues, colored gradients, decorative glow, or module colors.

### Surface levels

**Level 0 — flat:** page canvas, typography, diagrams, tables, timelines, plots, article content, ordinary rows, dividers.

**Level +1 — raised:** primary action, compact floating toolbar, selected interactive tile, small inspector, movable manipulation handle, bottom sheet.

**Level -1 — recessed:** text/numeric inputs, matrix editing cells, slider tracks, work wells, segmented-control troughs.

Target visual balance: ~80% flat mathematical workspace, ~15% controlled tactile depth, ~5% floating/translucent functional chrome.

## Typography

Use the native system stack:

```css
font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
```

Do not bundle SF Pro merely to imitate Apple. Math/monospace content may use the existing JetBrains Mono or browser math serif where appropriate.

## Shell

Desktop uses a narrow 76–84px navigation rail with Home, Study, Course, Progress. Utilities sit lower: Search, Reference, Saved, Settings. No giant collapsible sidebar and no decorative online/local status text in primary chrome.

Mobile uses a fixed bottom navigation with at least 44px targets. The page itself must never horizontally overflow.

## Interaction language

Use one consistent segmented-control language for modes such as Explore / Guided / Practice, System / Inverse / RREF, Simple / Compound / Nominal / Time Value, and Manual / Worked trace.

Primary actions are black. Secondary actions are white and subtly raised. Tertiary actions are text-first. Inputs are recessed. Avoid pill buttons by default.

Feedback is contextual and adjacent to the mathematical object that caused it. Correctness cannot depend on color.

## Motion

Motion must explain mathematics: row transforms, selected truth columns, conditioned branches, moving focal dates, payment shifts, feasible-region construction, objective-line movement, strategy collapse, Markov redistribution.

State transitions should generally be 160–220ms; sheets 220–300ms. Never use bounce, springy decoration, scroll reveal, animated backgrounds, headline animation, hover lift, count-up, or motion for its own sake.

Reduced motion is a genuine alternative, not a `.01ms` animation hack. Replace animated change with immediate state plus static structural emphasis.

## Accessibility

- WCAG 2.2 AA target
- visible monochrome double-ring focus
- pointer and keyboard alternatives for manipulation
- screen-reader descriptions expose mathematical meaning, not merely `selected point`
- no color-only meaning
- no pointer-only controls
- 200% zoom support
- forced-colors support
- reduced-motion support
- internal scroll regions allowed for intrinsically wide truth/simplex/matrix content, but page overflow is forbidden

## Anti-vibecode gate

P0 failures include any hue, gradients, gradient text, generic landing-page heroes, bento dashboards, fake streaks/scores/analytics, colored status pills, glass-card content layers, decorative blobs/glows, hover-lift cards, animated headlines, duplicate summary metrics, and generic congratulatory screens.

For every visible surface ask: **why does this need a boundary?** If whitespace, alignment, type, or a divider can express the hierarchy, remove the container.

Final rule: **Never add UI merely to make the page look designed. Every visible element must teach, navigate, manipulate, explain, or provide feedback.**
