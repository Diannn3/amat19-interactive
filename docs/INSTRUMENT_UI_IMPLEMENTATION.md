# AMAT 19 — Instrument UI Audit v2 implementation

Target integration anchor: `fad779052ab66dedf1a1abdc240ad6bf18a08215` (`main`).

## Design contract implemented

- black, white, and neutral grayscale only across active UI/PWA appearance
- native system sans-serif interface typography; JetBrains Mono reserved for compact technical notation/data
- three intentional depth levels: flat canvas, restrained raised controls, recessed work/input surfaces
- narrow desktop instrument rail and mobile bottom dock
- canvas-first labs in which the mathematical object is the dominant visual structure
- no marketing hero, fake analytics, colored semantic states, gradients/glow, decorative bento UI, or generic card-dashboard composition
- no eyebrow/kicker supertitles above primary section headings
- keyboard and focus visibility, 44px+ interaction contracts with 45px safety where browser rounding matters
- genuine reduced-motion behavior plus more-contrast, reduced-transparency, and forced-colors handling
- internal overflow containment for wide mathematical objects rather than page-level horizontal scrolling

## High-level surfaces

### Home
Home answers four study questions only: what was I doing, what needs repair/review, what is next, and how is the course progressing.

- Continue is driven by persisted active/incomplete work and renders a module-native mathematical sketch.
- Review & repair counts only evidence-backed repair/weak/retrieval items. The previous invented duration estimate was removed.
- Next uses the deterministic study queue and learner-facing reason labels.
- Course evidence uses aggregate mastery so historical leaf-level evidence is not lost.
- attempts/sessions are explicitly sorted by recency before “recent/latest” UI is derived.

### Course and module journeys
The Course route is a vertical mathematical map rather than a tile dashboard. Logic, probability, finance, matrices, and applications use their own visual grammar. Module pages retain deep-linkable Overview/Labs/Notes/Practice behavior while reducing repeated status chrome.

### Study and Progress
Study is a prioritized evidence queue rather than an analytics dashboard. Progress distinguishes “no evidence yet” from genuinely weak evidence and sorts latest-practice records before presenting them.

### Settings, Saved, Reference, Exam
These surfaces use quiet native-product list/handbook compositions. Existing local-data, motion-preference, filtering, and exam behavior remain intact.

## Subject-native labs

- **Truth Tables:** truth grid is the canvas; structure, row evaluation, practice, classification, and counterexample reasoning remain synchronized.
- **Equivalence:** transformation ledger and truth-vector comparison dominate; evidence follows the transformation object instead of becoming a dashboard panel.
- **Formal Proof:** scoped proof ledger and line construction dominate.
- **Counting:** order/repetition decision structure and arrangements dominate.
- **Conditional Probability:** the conditioning population becomes the active universe; partition/table/tree views remain synchronized.
- **Bayes:** branch/partition reasoning dominates the calculation.
- **Distribution:** probability-mass geometry and moments are synchronized.
- **Simulation:** convergence is the primary visual object.
- **Interest/TVM:** focal-date timeline dominates.
- **Cash-flow valuation:** timeline + focal date dominate.
- **Annuity:** payment timing and valuation focal point dominate.
- **Bonds:** coupon/redemption timeline dominates.
- **Matrix Operations:** matrices and selected row×column dot product dominate.
- **Gauss–Jordan:** augmented matrix, row-operation builder, exact history, current matrix, and system classification form one instrument.
- **Linear Programming:** coordinate plane, feasible hatch, corner points, and objective line dominate; Simplex stays supplemental.
- **Game Theory:** payoff matrix carries row minima, column maxima, dominance, saddle/mixing state.
- **Markov:** graph, transition matrix, state vector, and k-step evolution remain synchronized.

## Shared finance timeline hardening

`apps/web/src/components/math/Timeline.tsx` now distributes labels for coincident cash flows instead of alternating between only two vertical lanes. Points at the same mathematical time retain the same x-coordinate; labels are split above/below, distributed horizontally within bounds, and linked back to the true event location when displaced.

## Accessibility and semantic hardening

- tertiary readable text strengthened to an AA-capable neutral token on the main canvas
- control-edge token provides a stronger neutral UI boundary
- radios in patched labs share explicit group names
- literal interaction buttons in patched TSX/Astro sources explicitly use `type="button"`
- decorative course SVGs are explicitly hidden from accessibility APIs
- Developer contact functionality from current main is preserved in the reduced rail/mobile More composition
- reduced-motion rules disable transition/animation rather than using near-zero-duration animation tricks
- forced-colors overrides include structural surface and control-edge tokens

## Preserved architecture boundaries

The overlay intentionally does **not** replace:

- `@amat19/math-core`
- any domain package
- `@amat19/learning-engine`
- `@amat19/persistence`
- course current/supplemental semantics
- mixed/question generation
- `pnpm-lock.yaml`

Mathematical truth remains deterministic and framework-independent. Each lab route retains one React `client:load` hydration root.

## Retired visual assumptions

The active app no longer imports the legacy `pass4.css` layer or Plus Jakarta as its interface face. GradientText, SpotlightCard, and ModuleSpotlightGrid are retired. Old browser specs that explicitly required the previous gradient hero/large collapsible shell/three-rail lab layout are replaced with tests for the Instrument UI contract rather than simply being allowed to fail.

Plus Jakarta and Motion can still appear in the package manifest/lock as inactive legacy dependencies. They are deliberately not removed by this overlay because doing that correctly requires a pnpm lockfile-maintenance pass rather than hand-editing the lockfile.

## Audit-v2 verification performed locally

- Node deterministic/repository suite: **114/114 passed**
- Instrument UI source contract: **14/14 passed** (included in the 114)
- architecture audit: **PASS** — 8 framework-independent domain/content packages; 18 lab routes each keep exactly one `client:load` root
- public-content audit: **PASS**
- TypeScript/TSX syntax transpilation: **74 files checked, 0 failures**
- Astro frontmatter parsing: **39 files checked, 0 failures**
- CSS parsing: **0 errors**
- active design source: grayscale-only color audit across hex/rgb/hsl syntax; no linear/radial/conic gradients
- PWA PNG icons: grayscale-only pixel audit
- patch installer: exact payload-copy/deletion smoke test and wrong-anchor refusal test
- complete `instrument.css`: release contract requires the stylesheet to remain above 90 KB and contain the late-stage Finance/Game/Markov/Gauss–Jordan/Probability-family selectors

## Verification still required in a clean dependency-complete checkout

This environment cannot resolve the npm registry and does not contain the complete external pnpm store, so the redesigned overlay has not been executed through Astro or Playwright here. The connected GitHub app also continues to return `403 Resource not accessible by integration` for writes, preventing a branch/PR and fresh CI run.

Run after applying to a clean checkout at the audited anchor:

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm verify
pnpm test:e2e
pnpm test:e2e:production
```

Do not merge until those commands and the protected GitHub checks are green.
