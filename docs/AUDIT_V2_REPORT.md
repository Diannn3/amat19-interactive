# AMAT 19 Instrument UI — Audit v2 report

Audit target: `Diannn3/amat19-interactive` at `fad779052ab66dedf1a1abdc240ad6bf18a08215`.

## Executive result

Audit v2 found and fixed both implementation-quality issues and a release-integrity defect in the previous overlay. The deterministic math/learning/persistence architecture remains untouched. The corrected payload passes every dependency-independent gate available in this runtime, but it still requires a dependency-complete Astro/Playwright run before merge.

The previous Instrument UI ZIP is superseded and should not be applied.

## 1. Release-blocking packaging defect fixed

An extracted copy of the previous delivery contained an incomplete `apps/web/src/styles/instrument.css` (~67 KB / ~723 lines), while the completed implementation workspace contained the full late-stage stylesheet (~100 KB+). The missing tail included large parts of the Finance, Game Theory, Markov, refined Conditional Probability, Gauss–Jordan, and other subject-native lab compositions.

Audit v2 restores the complete stylesheet and adds a source regression contract that fails when:

- `instrument.css` drops below 90 KB; or
- representative late-stage selectors for Finance, Game Theory, Markov, Gauss–Jordan, Counting, Bayes, Distribution, or Simulation disappear.

The final release procedure also performs ZIP extraction and byte-for-byte manifest verification so archive integrity is tested rather than assumed.

## 2. Monochrome contract strengthened

The earlier scan concentrated on hex literals and missed a warm cream expressed through `rgb(...)`.

Audit v2 now scans active design sources across hex, rgb/rgba, and hsl/hsla syntax and rejects hue-bearing values. Linear, radial, and conic gradients are also rejected. PWA PNGs are inspected at pixel level for non-grayscale RGB values.

The design layer now uses neutral grayscale appearance only.

## 3. Contrast and control-boundary improvements

`--ink-tertiary` was too light for small text on the primary canvas. It was strengthened to `#6b6b6b`. A separate `--control-edge: #8a8a8a` token was introduced so important form/control boundaries are not forced to reuse an excessively faint hairline.

High-contrast/forced-color modes now override structural and control tokens directly rather than depending on ordinary grayscale values surviving system remapping.

## 4. Genuine motion/transparency preferences

Legacy compatibility CSS still used a `0.01ms` reduced-motion technique. Audit v2 removes that behavior from the active design contract. Reduced motion now disables animation and transition; scrolling falls back to automatic behavior. Reduced-transparency and more-contrast media preferences also have explicit rules.

## 5. Anti-vibecode hierarchy audit

The second pass found several small-label-before-heading patterns that recreated an eyebrow/kicker hierarchy even though the overall redesign prohibited it.

Affected compositions were reordered so the mathematical/task heading leads and context follows. The source contract now rejects:

- `.eyebrow` / `bento-kicker` patterns on audited surfaces; and
- `.section-label` directly preceding an `h1`, `h2`, or `h3` in the patched application surfaces.

A manual correction was also made after an automated Equivalence rewrite briefly moved its transform heading into the wrong evidence panel; the regression contract now verifies the intended transform-heading location.

## 6. Evidence/data semantics corrected

### Home

- removed an invented “around N minutes” review duration that had no duration model behind it;
- review count is restricted to evidence-backed `repair`, `weak`, and `review` queue reasons;
- attempts and active sessions are explicitly sorted before “recent” behavior is derived;
- module progress uses aggregate course-skill mastery so leaf-only historical evidence is represented;
- raw queue enum labels are mapped to learner-facing copy;
- Continue illustration changes with the real module instead of always showing a matrix.

### Study

- recency-dependent attempt/session inputs are explicitly sorted;
- queue reasons use learner-facing labels.

### Progress

- a skill with no mastery record is no longer called “weak” merely because a fallback score is low;
- latest practice is explicitly sorted by update time.

## 7. Native HTML semantics hardened

Static audit of the patched TSX/Astro sources found and fixed groups of radios without a shared `name` and literal interaction buttons without explicit `type="button"`.

The final source contract reports no unnamed radio inputs and no implicit literal buttons across its audited patch surface.

## 8. Finance timeline collision algorithm improved

The shared finance timeline previously alternated labels through two vertical lanes. Three or more coincident cash flows could still collide.

Audit v2 groups events by exact time, preserves the same true x-coordinate for coincident events, distributes labels across upper/lower lanes and horizontal offsets, clamps the label group to the SVG bounds, and renders a subdued leader when the label moves away from the event position.

This separates typography without lying about the mathematics.

## 9. Current-main behavior preserved where it matters

The reduced shell initially omitted the existing Developer contact action. Audit v2 restores it in a quieter form:

- desktop rail utility action;
- mobile More action;
- existing dialog behavior/focus return retained;
- close control receives the same touch-target contract.

The redesign therefore removes obsolete shell complexity without silently deleting current functionality.

## 10. Browser-test migration audited

Current-main browser tests contain deliberate expectations for the pre-redesign UI, including the old marketing home, Plus Jakarta interface typography, collapsible sidebar/More flyout, and permanent three-zone LabShell.

Audit v2 does not preserve those obsolete visual assertions. Instead it replaces the affected specs with behavior-oriented coverage for:

- four-destination instrument rail and mobile dock;
- evidence-backed Home;
- system interface typography + technical mono;
- neutral runtime color output;
- touch-target floor;
- reduced motion;
- Developer dialog/focus return;
- command palette keyboard behavior;
- module deep links and learner taxonomy;
- canvas-first lab shell;
- URL-restored reference filters;
- local-data messaging;
- 375px containment;
- serious/critical axe findings on representative high-level routes.

The broader full-course suite retains mathematical behavior assertions for finance, matrices, row reduction, LP, game theory, and lab-route hydration/error behavior.

## 11. Installer safety improved

`scripts/apply-instrument-ui-patch.sh` now:

1. verifies the target looks like the AMAT 19 repository;
2. preflights every manifest payload file;
3. refuses a Git `HEAD` other than the audited `fad779...` anchor unless explicitly overridden;
4. refuses a dirty worktree unless explicitly overridden;
5. copies only redesign-owned manifest files; and
6. deletes only the explicit retirement list.

Both successful payload application and wrong-anchor refusal were smoke-tested.

## 12. Architecture boundary audit

The overlay does not replace deterministic packages, persistence, mastery/retrieval rules, course semantics, mixed-question generation, or the lockfile.

Architecture audit result:

- 8 domain/content packages remain DOM/framework independent;
- all 18 lab routes retain exactly one `client:load` root;
- no dynamic JS evaluation, unsafe raw HTML rendering, or overlapping monolithic UI suites were detected.

## 13. Local verification results

### Passed

- **114/114 Node tests**
- **14/14 Instrument UI contracts** (included in the Node total)
- architecture audit **PASS**
- public-content audit **PASS**
- **74** TS/TSX files syntax-transpiled, **0 failures**
- **39** Astro files/frontmatter blocks parsed, **0 failures**
- CSS parser sweep, **0 errors**
- grayscale/no-gradient active-source audit **PASS**
- grayscale PWA icon pixel audit **PASS**
- manifest JSON parse **PASS**
- installer exact-copy/delete smoke **PASS**
- installer wrong-anchor safety refusal **PASS**

### Still externally blocked

This runtime lacks the external pnpm dependency tree and cannot resolve `registry.npmjs.org`, so it cannot perform the authoritative Astro check/build or real Playwright browser execution. The GitHub connector can read the repository but returns HTTP 403 on write operations, so it cannot create the branch/commit required to trigger fresh protected CI checks.

These are verification gaps, not claims of success.

## 14. Required pre-merge gate

Apply Audit v2 to a clean checkout at the audited anchor and run:

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm verify
pnpm test:e2e
pnpm test:e2e:production
```

Then require the protected GitHub checks (`quality`, Chromium, browser compatibility, production PWA) to pass before merge.

## 15. Deferred cleanup

Plus Jakarta and Motion remain in the current dependency manifest/lock even though the active interface no longer imports them. Removing those packages is a legitimate follow-up, but Audit v2 deliberately avoids hand-editing `pnpm-lock.yaml`. Perform that cleanup with pnpm in a dependency-complete checkout and verify the resulting lockfile through the normal release gates.
