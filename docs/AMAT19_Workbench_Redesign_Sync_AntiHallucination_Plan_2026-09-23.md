# AMAT 19 — Blueprint Orange Workbench Reconciliation
## Anti-Hallucination Research Layer + Exhaustive Implementation Plan

**Planning snapshot:** 2026-09-23  
**Repository:** `Diannn3/amat19-interactive`  
**Audited baseline:** `main@11c9fb7de18cb82a714108022f0eb4bc4bcda5f6`  
**Current production branch discovered from Vercel UI:** `pass1/truth-table-vertical-slice`  
**Design direction:** Blueprint Orange / editorial mathematical instrument system  
**Task type:** planning only in this pass; no feature implementation is authorized by this document alone.

---

## 0. Executive decision summary

The redesign is visually established at the shell/course level, but several learner-facing mathematical surfaces are still hybrids of three generations of UI:

1. **legacy pre-redesign form/card UI**;
2. **Apple/glass mockup UI** introduced during an earlier redesign pass;
3. **Blueprint Orange editorial UI** layered later through CSS overrides.

The most serious problems are not aesthetic. They are **state-model and truthfulness bugs**:

- Probability exposes a visible four-tab navigation that is disconnected from the workbench's real `mode` state, so the buttons change selection styling but not mathematical content.
- Matrices exposes a second visible tab system that is disconnected from the real `goal` state. A left-side menu also hard-codes Determinant as selected (`idx === 2`) regardless of user interaction.
- Logic exposes five lab/app modes even though the requested product should expose only **Truth Table** and **Test an Argument**.
- The course registry still treats the Applications/Optimization workbench as one of five canonical workbenches even though the requested product should **remove the Optimization lab completely**.
- Several display formulas leak machine-friendly ASCII/internal names directly to learners: `P <-> ~P`, `a-angle-n`, `R^3`, caret exponents, etc.
- Finance timelines use a fixed SVG label placement strategy that collides when events are close together or share a time.
- Some pages are technically “Blueprint” only because CSS overrides old `.apple-*` markup. This creates brittle styling, enormous blank panels, hidden legacy assumptions, and inconsistent control geometry.

### Target product after implementation

The course remains a **five-module learning experience**, but it has **four canonical interactive workbenches**:

1. **Logic** — exactly two lab tabs: `Truth Table` and `Test an Argument`.
2. **Probability** — real functional tabs for `Conditional Probability`, `Distributions`, `Random Variables`, and `Inference`; no fake tab state.
3. **Financial Mathematics** — one coherent Blueprint Money Timeline experience with fixed notation and collision-safe timelines.
4. **Matrices & Systems** — real functional tabs mapped to supported engines: `Matrix Operations`, `Solve Systems`, `Row Reduction`, and `Inverse`.

The **Applications** module remains available as course content/lessons if it is still in the syllabus, but **the Optimization & Strategy interactive lab/workbench is removed**. Existing old URLs should redirect safely rather than 404.

---

# 1. Research methodology and honesty note

The request asked for “500+ sources.” A source-count target is not a reliable quality metric, and this pass did **not individually validate 500 unique sources**. Instead, the research process used:

1. a repository-wide structural audit of the current AMAT 19 codebase;
2. targeted searches across current authoritative documentation;
3. educational references for logic, probability, finance notation, and linear algebra;
4. current accessibility standards/patterns;
5. representative open-source interactive-math projects;
6. comparison of the uploaded production screenshots with actual implementation state.

This document cites the high-signal, authoritative subset and records concrete repository evidence. **Do not claim “500 sources checked” in a pitch, README, or PR.**

### Evidence priority

When implementation begins, resolve conflicts in this order:

1. **Newest explicit user instruction** in this project.
2. **Current repository/domain tests and current course-source documents.**
3. `MATH_CORRECTNESS_CONTRACT.md`, UI/UX rules, and existing anti-hallucination documents.
4. Domain-engine behavior and exact unit tests.
5. Current external standards/docs.
6. Visual inspiration / third-party examples.

Visual mockups must never override mathematical or course-scope truth.

---

# 2. User directives that are binding for this plan

The implementation must satisfy all of these:

- sync leftover old-design surfaces to Blueprint Orange;
- fix broken/unfinished UI visible in the supplied screenshots;
- correct learner-facing notation;
- Logic lab must expose **only**:
  - Truth Table;
  - Test an Argument;
- remove the other Logic lab apps/modes from the learner-facing lab;
- Probability visible options must actually work:
  - Conditional Probability;
  - Distributions;
  - Random Variables;
  - Inference;
- Matrix tabs must actually switch mathematical tools, not just visual selection;
- completely remove the Optimization lab;
- retain accessibility, local-first persistence, offline/PWA behavior, responsive behavior, and mathematical correctness;
- future implementation should use atomic commits.

---

# 3. Current repository truth map

## 3.1 Existing stack relevant to this work

Current `apps/web/package.json` already contains:

- Astro `7.2.8`
- React `19.2.8`
- `@radix-ui/react-tabs` `1.1.21`
- Motion `13.1.1`
- Tailwind `4.3.3`
- Lucide React `1.34.0`

There is already a reusable wrapper:

`apps/web/src/components/ui/Tabs.tsx`

which wraps Radix `Root`, `List`, `Trigger`, and `Content`.

**Decision:** do not create another custom tab implementation. The broken probability/matrix pill bars should migrate to the existing Radix tabs wrapper.

## 3.2 Current canonical course model

`packages/course-content/src/index.ts` currently declares:

- five modules: Logic, Probability, Finance, Linear, Applications;
- five workbenches: Logic, Probability, Finance, Linear, Applications;
- eighteen lab definitions;
- legacy lab redirects to the five workbenches.

That model no longer matches the requested product because Applications/Optimization should not remain a workbench.

## 3.3 Legacy styling still embedded in workbenches

A source audit found substantial old markup/styles still present:

| Component | `apple-glass-card` references | inline `style={{...}}` blocks | notable issue |
|---|---:|---:|---|
| `LogicProofWorkbench.tsx` | 7 | 0 | five modes + FormalProofLab remain |
| `ProbabilityModelBuilder.tsx` | 2 | 1 | fake top tabs disconnected from real modes |
| `MoneyTimelineWorkbench.tsx` | 5 | 11 | mockup state duplicated with real finance state |
| `RowOperationsCoach.tsx` | 4 | **31** | large fake flagship layer; fake tabs/sidebar |
| `OptimizationStrategyWorkbench.tsx` | 3 | 9 | workbench must be removed |

The redesign CSS therefore spends large sections overriding legacy class behavior with `!important`. This is workable as a migration technique but is not a stable final architecture.

---

# 4. Screenshot-by-screenshot diagnosis

## 4.1 Practice set / mixed practice

Observed:

- very large rounded white card;
- generic grey answer rows;
- grey disabled-looking “Check item” button;
- raw ASCII logic notation such as `P <-> ~P`;
- visual hierarchy does not match Blueprint Orange's editorial panels.

Diagnosis:

- Mixed practice is not fully migrated to the editorial component vocabulary.
- Logic assessment prompt strings are built from raw parser input rather than formatted AST output.

Required result:

- Blueprint paper panel with navy rules and orange action;
- selected answers visibly different from disabled controls;
- correct/error feedback integrated under the answer rather than appearing as a detached block;
- normalized mathematical display (`P ↔ ∼P` or equivalent project-standard symbol set).

## 4.2 Logic module hero

Observed:

- huge grey-to-black gradient block dominates the page;
- new Blueprint buttons exist, but the hero still feels like an older mockup pasted into the new system.

Required result:

- paper/navy/teal/orange editorial field;
- no large decorative dark gradient unless it communicates mathematical state;
- title, module notation, counts, and CTA should occupy a compact editorial grid.

## 4.3 Course workbench directory filtered to one workbench

Observed:

- narrow useful card on the left;
- enormous empty navy rectangle across the rest of the row.

Repo cause:

`.workbench-grid.workbench-directory` is permanently declared as a 5-column grid; filtering uses `hidden` but the surviving item retains its original one-column width and the grid container background is navy.

Required result:

- dynamic layout based on visible count;
- one result should become a sensible max-width card, not reveal blank grid background;
- two results use two columns; 3–4 can use responsive balanced columns.

## 4.4 Logic practice/proof screens

Observed:

- Proof builder, rule reference, conditional/indirect proof, etc. create a dense tool that the user explicitly no longer wants.

Required result:

- no learner-facing Translate, Compare Expressions, or Build a Proof lab modes;
- no FormalProofLab in the canonical Logic workbench;
- exactly Truth Table + Test an Argument.

## 4.5 Progress / study panels

Observed:

- large pale-yellow surface and old table/card hierarchy;
- mismatched spacing/border systems.

Required result:

- reuse Blueprint result panels, ledger rows, compact metrics, and orange action buttons;
- no “legacy dashboard” appearance.

## 4.6 Finance growth instrument

Observed:

- visual language is partially synced;
- old rounded sliders/cards still conflict with Blueprint rules;
- graph tooltip is visually heavy;
- there is duplicated mockup finance state separate from the real scenario workbench.

Required result:

- keep one canonical finance state model;
- style native controls with Blueprint tokens;
- eliminate duplicate “mockup” compound/annuity state if it does not drive the canonical scenario engine.

## 4.7 Cash-flow and annuity timelines

Observed:

- labels overlap badly (`Present...`, `R at t=...`, payment labels);
- different timeline annotations collide around neighboring points;
- huge unused white space appears when labels are crowded.

Repo cause:

`Timeline.tsx` uses a simple fixed x coordinate and only two alternating y lanes based on duplicate occurrence at the same time. It does not detect adjacent label collisions.

Required result:

- derive label lanes based on estimated text width and horizontal separation;
- separate axis/tick labels from event labels;
- on narrow screens switch from SVG label clutter to an accessible timeline + event ledger;
- use `<title>/<desc>` and/or an adjacent semantic list/table for accessible equivalent content.

## 4.8 Annuity calculation trace

Observed:

- internal string `a-angle-n` leaks directly into learner UI;
- ASCII `^(-n)` instead of typeset superscripts;
- formula line wraps poorly.

Required result:

- actuarial notation rendered properly;
- no internal/debug token names exposed;
- trace text and formula data separated.

## 4.9 Matrices flagship panel

Observed:

- top tabs appear selectable;
- left sidebar duplicates them;
- Determinant is always highlighted;
- 3D geometric panel appears irrespective of the actual selected tab;
- user reports buttons do nothing.

Repo cause confirmed:

- real workbench uses `goal: system | inverse | rref | arithmetic`;
- mockup adds separate `activeMatrixTab: ops | solve | det | rref | eigen`;
- top pills only call `setActiveMatrixTab()`;
- left menu styling is hard-coded to `idx === 2`;
- mockup matrix state (`matrixCells`, `matrixDim`, `detValue`, `isoProject`) is separate from the exact domain-engine state.

Required result:

- delete duplicate mockup navigation/state;
- one canonical tab state maps directly to supported domain goals.

---

# 5. External research synthesis

## 5.1 Tabs must control real panels

W3C APG defines tabs as a `tablist` where each `tab` has a corresponding `tabpanel`; activating a tab hides the previous panel and displays its associated one. Keyboard arrows, Home/End, focus handling, and `aria-selected` are part of the pattern.

Sources:

- WAI-ARIA APG Tabs Pattern: https://www.w3.org/WAI/ARIA/apg/patterns/tabs/
- Automatic tabs example: https://www.w3.org/WAI/ARIA/apg/patterns/tabs/examples/tabs-automatic/
- Manual tabs example: https://www.w3.org/WAI/ARIA/apg/patterns/tabs/examples/tabs-manual/
- Radix Tabs: https://www.radix-ui.com/primitives/docs/components/tabs

**Implementation implication:** the probability and matrix pill bars must not be independent “selected style” state. Radix `Tabs.Root value/onValueChange` should own the same canonical state that determines the mathematical panel.

## 5.2 Automatic vs manual activation

APG recommends automatic activation when the panel can be displayed with no noticeable latency; manual activation is preferable when activation is expensive.

For AMAT 19, these panels are local React state with no remote network dependency. **Automatic activation is acceptable** and improves keyboard exploration, provided switching also updates/clears stale result disclosure safely.

## 5.3 Accessible math display

KaTeX can output HTML and MathML together (`htmlAndMathml`, its default), providing high-quality visual typesetting plus structured math for assistive technology.

- KaTeX options: https://katex.org/docs/options
- MathML / web math work: https://www.w3.org/Math/
- MathLive (if editable visual math is ever needed): https://mathlive.io/mathlive/

**Decision:** this plan recommends KaTeX for **display-only formulas**. Do not replace existing robust text parsers with a math editor unless a future task specifically asks for that.

Inputs may continue accepting ASCII aliases (`->`, `<->`, `~`, `&`) for typing convenience. Display output should be normalized.

## 5.4 Logic pedagogy

OpenStax describes truth tables as a way to enumerate possible truth assignments and analyze statements/arguments; deductive argument validity can be tested via truth-table structure.

- Truth tables: https://openstax.org/books/contemporary-mathematics/pages/2-3-constructing-truth-tables
- Logical arguments: https://openstax.org/books/contemporary-mathematics/pages/2-7-logical-arguments

This supports the requested two-tool Logic lab: truth tables + argument testing are coherent and sufficient as interactive modes, while translation/equivalence/proofs can remain lesson content rather than separate apps.

## 5.5 Probability pedagogy

A good interactive probability surface coordinates mathematical representations rather than showing decorative visuals disconnected from underlying values.

Useful references:

- Seeing Theory repository: https://github.com/seeingtheory/Seeing-Theory
- OpenStax conditional probability: https://openstax.org/books/statistics/pages/3-1-terminology
- Expected value/variance: https://openstax.org/books/introductory-statistics-2e/pages/4-2-mean-or-expected-value-and-standard-deviation
- Population-proportion interval: https://openstax.org/books/introductory-statistics-2e/pages/8-3-a-population-proportion

**Implementation implication:** the Venn diagram must derive from the same event/table data used to compute conditional probability. A visual should never have its own independent probability sliders if the rest of the panel is using a different table.

## 5.6 Matrix pedagogy

Mathigon emphasizes matrices as transformations and exact structured objects, while matrix-visualizer projects emphasize learner-performed row operations rather than a black-box answer.

- Mathigon matrices: https://mathigon.org/course/linear-algebra/matrices
- Mathigon linear transformations: https://mathigon.org/course/linear-algebra/linear-transformations
- Matrix visualizer: https://github.com/jaasonw/matrix-visualizer
- Interactive row-operation tutorial: https://breazeal.com/matrix/
- OpenStax row operations: https://openstax.org/books/intermediate-algebra/pages/4-5-solve-systems-of-equations-using-matrices

**Implementation implication:** AMAT 19's strongest matrix engine is already the exact row-operation/RREF/system solver. The redesign should expose that engine clearly instead of adding fake determinant/eigenvalue/3D mockup states.

## 5.7 Cognitive-load / split-attention guidance

Current research on worked examples and cognitive load continues to support minimizing unnecessary split attention and integrating related explanations with the mathematical representation.

Representative sources:

- Educational Psychology Review, cognitive-load theory development: https://link.springer.com/article/10.1007/s10648-023-09817-2
- Mathematical proficiency / split-attention discussion: https://journals.sagepub.com/doi/full/10.1177/27527263241266765
- Segmented worked examples: https://onlinelibrary.wiley.com/doi/abs/10.1002/acp.1832

**Implementation implication:** do not put a diagram on one side and the explanation/result several screens away. Keep the operation, changed mathematical object, and explanation spatially close.

## 5.8 SVG accessibility

Inline SVG visualizations should have meaningful accessible names/descriptions; a semantic table/list beside the visual is often even more robust.

- MDN SVG `<title>`: https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/title
- Accessible SVG guidance: https://data.europa.eu/apps/data-visualisation-guide/accessible-svg-and-aria

## 5.9 Accessibility minimums

WCAG 2.2 includes improved focus visibility and target-size guidance.

- WCAG 2.2: https://www.w3.org/TR/wcag/
- What's new in WCAG 2.2: https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/

Continue AMAT's stricter existing 44px control target rule where possible.

## 5.10 Finance notation

The Society of Actuaries documents standard annuity-immediate and annuity-due notation; internal text such as `a-angle-n` is a pronunciation/debug name, not appropriate final visual notation.

- SOA Exam FM notation: https://www.soa.org/globalassets/assets/Files/Edu/2018/exam-fm-notation-terminology-3.pdf

---

# 6. Target architecture — one UI state per mathematical state

## 6.1 Rule: no duplicate mode state

Every workbench must have exactly one canonical mode identifier.

Bad pattern now:

```text
visible probability tab -> activeTab
actual workbench content -> mode
```

Target:

```text
Radix Tabs value -> canonical mode -> URL query -> persisted draft -> rendered panel
```

The same applies to matrices.

## 6.2 URL as shareable state

Tabs should update query state using `history.replaceState()` (or the project's route helper) without full reload:

- `/workbenches/logic?mode=table`
- `/workbenches/logic?mode=argument`
- `/workbenches/probability?view=conditional`
- `/workbenches/probability?view=distribution`
- `/workbenches/probability?view=random-variable`
- `/workbenches/probability?view=inference`
- `/workbenches/linear?goal=arithmetic`
- `/workbenches/linear?goal=system`
- `/workbenches/linear?goal=rref`
- `/workbenches/linear?goal=inverse`

Backward compatibility aliases can still map old query values to the new canonical values.

## 6.3 Persisted state policy

Persist **mathematical inputs** and last selected canonical mode.

On switching tabs:

- preserve source data where that is pedagogically meaningful;
- clear stale correctness/reveal feedback from the previous panel;
- do not show the result from a different mode;
- query parameter overrides saved mode when the URL explicitly requests a mode.

---

# 7. Blueprint Orange component vocabulary

Create or formalize these reusable classes/components instead of continuing to style `.apple-*` compatibility markup:

- `BlueprintPanel`
- `BlueprintInstrument`
- `BlueprintTabs`
- `BlueprintToolbar`
- `BlueprintField`
- `BlueprintResult`
- `BlueprintStep`
- `BlueprintDataTable`
- `BlueprintMetricStrip`
- `BlueprintDisclosure`

They should use only semantic tokens:

- paper/pure paper;
- navy ink;
- orange signal/action;
- teal secondary/context;
- grid/rule colors;
- success/error tokens that meet contrast requirements.

### Styling rules

1. No gratuitous blur/glass.
2. No black-to-grey decorative gradients for core learning surfaces.
3. Avoid huge rounded cards; use compact editorial radii and ruled panels.
4. Max one hard shadow depth per hierarchy level.
5. No inline style objects for normal layout/styling. Inline styles are allowed only for genuinely computed geometry (e.g. SVG coordinate values).
6. No empty decorative panel consuming >25% of a workbench unless it communicates actual mathematical information.
7. Mobile: panels stack in task order, not desktop visual order.
8. Every mathematical visualization must have either an accessible semantic equivalent or a complete accessible name/description.

---

# 8. Logic workbench — exact target

## 8.1 Keep only two modes

```ts
type LogicMode = 'table' | 'argument';
```

Visible tabs:

1. **Truth Table**
2. **Test an Argument**

Remove from learner-facing lab:

- Translate a statement
- Compare expressions
- Build a proof
- FormalProofLab

This does **not** require deleting domain-logic parsing, equivalence, or proof engines. They may remain for lessons, assessments, or future use; the user asked to remove the apps, not mathematical capability from the codebase.

## 8.2 Truth Table panel

Keep/strengthen:

- expression input;
- parser aliases;
- variable detection;
- complete truth table;
- tautology / contradiction / contingent classification;
- optional final-column emphasis;
- error feedback near input.

Display normalized syntax using `formatLogic()`.

Example:

- typed: `P <-> ~P`
- displayed: `P ↔ ∼P`

Do not force the learner to type Unicode.

## 8.3 Test an Argument panel

Inputs:

- premises (one per line);
- conclusion;
- `Test validity` action.

Output:

- Valid / Invalid;
- if invalid: show a concrete counterexample assignment where every premise is true and conclusion false;
- if valid: explain that no such assignment exists across the complete valuation table;
- optionally expose a compact combined truth table under “Show evidence.”

This directly aligns with the truth-table definition of deductive validity.

## 8.4 Logic registry migration

Current old routes:

- `logic-basics` -> table
- `truth-table` -> table
- `equivalence` -> compare
- `formal-proof` -> proof

Target:

- `logic-basics` -> `/workbenches/logic?mode=table`
- `truth-table` -> `/workbenches/logic?mode=table`
- `truth-table?mode=argument` -> `/workbenches/logic?mode=argument`
- `equivalence` -> `/modules/logic` or a specific equivalence lesson, not a removed lab mode
- `formal-proof` -> `/modules/logic` or formal-proof lesson/reference, not a workbench mode

Update skill links similarly.

---

# 9. Probability workbench — exact target

## 9.1 Replace the fake top bar with real Radix tabs

Visible canonical tabs exactly matching the user's current UI:

1. **Conditional Probability**
2. **Distributions**
3. **Random Variables**
4. **Inference** `Supplemental`

The currently separate `activeTab` mockup state must be deleted.

The old `WorkbenchTaskPicker` should not remain as a second competing mode control on this flagship surface.

## 9.2 Conditional Probability

Use one canonical data source.

Recommended state:

```ts
{
  aAndB,
  aAndNotB,
  notAAndB,
  notAAndNotB,
  condition
}
```

Derive:

- `P(A)`
- `P(B)`
- `P(A ∩ B)`
- `P(A | B)`
- `P(B | A)`
- independence status

The Venn representation must derive from those exact values. Remove independent Venn sliders that can contradict the event table.

Bayes can be an **advanced disclosure inside this tab** (“Update with Bayes”) because it is fundamentally conditional-probability reasoning and is currently supplemental.

## 9.3 Distributions

The engine already provides:

- `canonicalizeDiscreteOutcomes`
- `analyzeDiscreteDistribution`
- `binomialDistribution`
- `distributionCdf`

Build a real distribution panel:

- editable `x` and `P(X=x)` table;
- exact validation that probabilities sum to 1;
- bar plot / PMF;
- optional cumulative line/step view;
- `E[X]`;
- `E[X²]`;
- `Var(X)`;
- optional Binomial preset.

Display exact fraction and decimal where useful; do not fake precision.

## 9.4 Random Variables

This is conceptually different from “a distribution.” Teach the mapping:

`X : Ω → ℝ`

Example preset:

- sample space: two coin tosses;
- map outcome to number of heads;
- automatically aggregate identical `X` values into PMF probabilities;
- then show expected value/variance using the same distribution engine.

User can edit mappings for a small finite sample space.

This tab should answer “what is a random variable?” rather than merely re-rendering the distributions tab.

## 9.5 Inference (Supplemental)

Current course registry does not list inference as a core skill. Therefore:

- add a visible **Supplemental** badge;
- do not claim it is an official current AMAT 19 core outcome without stronger course evidence.

Concrete functional scope:

- one-population-proportion estimation;
- input/sample or seeded Bernoulli run;
- sample proportion `p̂`;
- confidence level selector (e.g. 90/95/99);
- interval display;
- explicit assumptions/conditions;
- repeated-sampling visualization if practical;
- explanatory statement that interval procedures are inferential/approximate, not exact probability proofs.

Domain calculation belongs in `packages/domain-probability`, not JSX.

### Conservative initial implementation

If the course source does not specify an inference formula, implement this tab as a **clearly supplemental sampling/inference demonstrator**, and encode the method plus assumptions in tests. Do not silently invent a course-standard method.

## 9.6 Counting

Counting is still real course content. Removing it from the four-tab flagship must not delete the engine.

Recommended treatment:

- keep counting lessons and mixed-practice generation;
- keep `@amat19/domain-probability` counting functions;
- remove the old counting task from the main four-tab workbench;
- redirect `/labs/counting` to the relevant module lesson/practice route rather than pretending it is one of these four tabs.

---

# 10. Matrices & Systems workbench — exact target

## 10.1 Remove the mockup state layer

Delete the duplicated state and geometry unless still needed by a real panel:

- `matrixCells`
- `matrixDim`
- `activeMatrixTab`
- `activeMatrixOp`
- mockup `detValue`
- `isoProject`
- decorative 3D geometry panel
- duplicate left “Operations” sidebar

The real exact engine already exists and should be the UI source of truth.

## 10.2 Canonical tabs

Use Radix Tabs bound directly to existing `goal`:

| visible tab | canonical goal | engine |
|---|---|---|
| Matrix Operations | `arithmetic` | add/subtract/multiply/transpose etc. |
| Solve Systems | `system` | exact RREF + solution classification |
| Row Reduction | `rref` | learner-applied row ops |
| Inverse | `inverse` | `[A | I] → [I | A⁻¹]` |

Remove top-level `Eigenvalues` because there is no eigenvalue engine/current skill in the audited code.

Remove top-level `Determinant` as a mode. The exact `determinant()` function may appear as a contextual scalar result in Matrix Operations for square matrices if useful.

## 10.3 Matrix Operations panel

Use existing domain functions:

- add;
- subtract;
- scalar multiply;
- transpose;
- matrix multiply;
- determinant as contextual output for square matrices.

Show dimension compatibility before calculation.

For multiplication, preserve the strong existing “row-by-column” trace capability instead of a decorative 3D panel.

## 10.4 Solve Systems

- augmented matrix editor;
- exact classification: unique / infinite / inconsistent;
- only reveal final solution/classification after requested checking/reveal flow according to current learning policy;
- show RREF evidence nearby, not several panels away.

## 10.5 Row Reduction

Retain learner-selected elementary row operations and exact arithmetic.

Notation should be rendered consistently:

- `R₁ ↔ R₂`
- `R₂ ← -3R₂`
- `R₂ ← R₂ - 2R₁`

## 10.6 Inverse

Visually emphasize the augmented structure:

`[ A | I ]  →  [ I | A⁻¹ ]`

Keep exact row-operation history and singular-matrix detection.

---

# 11. Financial Mathematics reconciliation

## 11.1 Remove duplicate mockup state

`MoneyTimelineWorkbench.tsx` currently has canonical `scenario` state **and** a second mockup set (`principal`, `annualRate`, `years`, `compoundingN`, `modeTab`, `chartHoverIndex`).

Audit whether each mockup value maps to a real learning objective. Then:

- merge useful functionality into the canonical finance scenario model;
- otherwise delete it;
- never maintain two parallel finance calculators on the same page.

## 11.2 Timeline collision fix

Current `Timeline.tsx` alternates only two vertical lanes for points at the exact same time.

Replace with a deterministic layout algorithm:

1. sort points by x/time;
2. estimate label width based on characters or measure after render;
3. assign the first non-colliding lane among 3–4 label lanes;
4. use leader lines when a label is displaced;
5. reserve a distinct axis-label row;
6. if density exceeds a threshold, collapse visual labels and show numbered event markers plus an adjacent semantic ledger;
7. at <=640px, favor the ledger over dense SVG text.

Do not solve this by shrinking text until unreadable.

## 11.3 Actuarial notation fix

Current engine emits internal names such as:

`a-angle-n = (1 - (1+i)^(-n))/i`

Target display examples:

- annuity-immediate present value: `a_{\overline{n}|i}` (project can choose exact preferred typographic variant based on course notes);
- annuity-due: `\ddot{a}_{\overline{n}|i}`;
- accumulated value: `s_{\overline{n}|i}`;
- discount factor: `v = (1+i)^{-1}`;
- present-value factor: `(1 - v^n)/i`;
- future-value factor: `((1+i)^n - 1)/i`.

Do not replace the machine calculation with typesetting logic. Add structured display metadata.

## 11.4 Finance trace model change

Extend `FinanceTraceStep` safely:

```ts
type FinanceTraceStep = {
  id: string;
  label: string;
  expression: string;       // stable/debug/plain-text fallback
  displayMath?: string;     // LaTeX or structured formula for learner display
  explanation: string;
  ...
}
```

Then `StepTrace` uses `displayMath` through a reusable `MathFormula` component when present.

## 11.5 Precision language

Continue the existing correction that `exactValue` is only a deprecated compatibility alias for decimal value. UI must distinguish:

- exact rational;
- fixed-point rounded;
- iterative approximation.

Do not label a 30-digit fixed-point decimal as “exact.”

---

# 12. Notation system for the whole app

## 12.1 Add a display-only math layer

Recommended dependency:

- `katex`

Create:

- `MathInline.tsx`
- `MathBlock.tsx`

with:

- `output: 'htmlAndMathml'`;
- `throwOnError: false` only if errors are also logged/tested; otherwise validate controlled formulas ahead of rendering;
- no user-injected raw LaTeX without sanitization/controlled grammar.

## 12.2 Logic

Input aliases accepted:

- `~`, `!` -> negation
- `&` -> conjunction
- `|` -> disjunction (subject to parser ambiguity)
- `->` -> implication
- `<->` -> biconditional

Display normalized:

- `∼P` or `¬P` — choose one project standard; the current formatter already uses `∼`;
- `P ∧ Q`;
- `P ∨ Q`;
- `P → Q`;
- `P ↔ Q`.

Mixed practice must never interpolate raw source expression directly after parsing. Use `formatLogic(ast)`.

## 12.3 Probability

Display consistently:

- `P(A \mid B)` visually with a conditional bar;
- `A ∩ B`;
- `Aᶜ`;
- `E[X]`;
- `Var(X)`;
- `\hat p` for sample proportion in inference.

## 12.4 Linear algebra

- `A^{-1}` / `A⁻¹`;
- `\mathbb{R}^3` / `ℝ³`;
- matrix dimensions use `m × n`;
- row labels use true subscripts;
- RREF can be rendered as `\operatorname{rref}(A)` when displayed in math context.

---

# 13. Remove the Optimization lab completely

Interpret “completely remove the optimization lab” as removing the learner-facing **Applications/Optimization workbench**, not erasing every Applications lesson or domain function from the repository.

## 13.1 Remove learner-facing workbench

- delete route implementation from `/workbenches/applications` or replace with a redirect page;
- remove `OptimizationStrategyWorkbench` from learner bundle;
- remove it from canonical workbench registry;
- remove its workbench card from Home/Course;
- remove its PWA core route;
- remove task picker tests specific to it.

## 13.2 Preserve course content safely

Applications may remain a module if the course source still includes:

- graphical linear programming;
- game theory;
- Markov material.

Links formerly targeting the removed lab should go to:

- the Applications module page;
- a relevant lesson;
- or Study/Practice.

Do not 404 old bookmarks.

## 13.3 Type model improvement

Current code assumes every `ModuleId` has a workbench.

Introduce a distinct type such as:

```ts
type WorkbenchId = 'logic' | 'probability' | 'finance' | 'linear';
```

This prevents future code from doing unsafe `workbenchesById.get(module.id)!` for Applications.

## 13.4 Home/Course consequences

Home currently loops over modules and expects a workbench for each. Change it to loop over workbenches.

Target copy:

- `4 Workbenches`
- `Logic, Probability, Finance, Matrices`

Course still shows five modules in the Suggested Study Path if Applications remains course content.

---

# 14. Course directory blank-panel bug

The grid is hard-coded to five columns and has navy background behind cards.

### New strategy

Use responsive auto-fit or a visible-count data attribute.

Option A:

```css
.workbench-directory {
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 17rem), 1fr));
}
```

and cap container/card width.

Option B (more controlled): JS writes `data-visible-count`, CSS defines layouts for 1/2/3/4.

For one filtered result:

- card width ~`min(100%, 34rem)`;
- align left or center consistently;
- no full-width navy filler.

After Optimization removal, default directory becomes four cards and should use a balanced 2×2 desktop or 4-column compact index depending visual QA.

---

# 15. Practice + Progress redesign sync

## Practice

- replace oversized pill/rounded answer surfaces with ruled Blueprint choices;
- selected state uses teal or paper + strong navy/orange indicator;
- disabled/check state must not look identical to enabled primary action;
- “Question 1 of 8” becomes a compact editorial progress bar/ledger;
- mobile controls remain above dock;
- normalize all generated math display.

## Progress

- replace pale-yellow mega-card with paper/result composition;
- metric counts use Blueprint metric strip;
- “recommended next” action uses orange signal button;
- empty-state copy remains honest (`no saved evidence yet`), never fabricated mastery.

---

# 16. Accessibility and interaction requirements

Every new tab system must pass:

- arrow-key tab navigation;
- Home/End;
- `aria-selected` state;
- active `tabpanel` relation;
- focus-visible ring;
- 44px project target minimum where feasible;
- no horizontal overflow at 320, 375, 390, 414, 640 landscape;
- `prefers-reduced-motion`;
- forced colors;
- axe serious/critical violations = 0.

Visualizations:

- SVG gets title/description and/or semantic adjacent table/list;
- no meaning solely encoded in color;
- interactive sliders have visible numeric values and labels;
- chart/tooltips are keyboard reachable only if they contain information unavailable elsewhere; otherwise provide persistent text equivalent.

---

# 17. Test strategy before implementation

## 17.1 Write failing tests first for current bugs

### Probability

- clicking `Distributions` must reveal distribution panel and remove Venn-only conditional panel;
- Random Variables shows mapping panel;
- Inference shows supplemental inference panel;
- URL state updates;
- browser Back/Forward restores tab;
- no stale result from previous panel.

### Matrices

- each visible tab changes the mathematical surface;
- there is no `Eigenvalues` tab;
- there is no hard-coded Determinant selected state;
- determinant result, if shown, is subordinate to Matrix Operations;
- 3D geometric mockup is absent unless backed by a real learning objective.

### Logic

- exactly two tab triggers exist;
- no Translate / Compare / Build Proof option;
- old proof/equivalence lab URLs redirect to a valid module/lesson;
- truth table and argument tester remain functional.

### Optimization removal

- `/workbenches/applications` redirects;
- home/course have four workbench cards;
- no learner-facing “Optimization & Strategy” workbench CTA;
- old `/labs/linear-programming`, `/labs/game-theory`, `/labs/markov` resolve to non-broken instructional destinations.

### Notation

- generated logic questions contain `↔/→/∧/∨/∼`, not raw `<->/->/&/~` in visible prompt;
- finance trace never shows `a-angle-n` or `s-angle-n`;
- `ℝ³`, `A⁻¹`, and row subscripts render correctly;
- fallback accessible text remains meaningful.

### Finance layout

- no overlapping timeline labels in standard fixtures;
- mobile timeline uses semantic fallback/ledger;
- no horizontal overflow.

---

# 18. Detailed implementation phases

## Phase A — lock truth and tests

1. Snapshot screenshots/routes and current known failures.
2. Add failing interaction tests for probability decorative tabs.
3. Add failing interaction tests for matrix decorative tabs.
4. Add registry tests for requested 4-workbench model.
5. Add notation leakage tests.
6. Add route tests for Optimization removal.

## Phase B — shared UI foundations

7. Add `BlueprintTabs` styling over existing Radix wrapper.
8. Add Blueprint panel/result/toolbar primitives or canonical class contracts.
9. Add KaTeX display layer and controlled math CSS.
10. Add notation helpers/formatters.

## Phase C — Logic simplification

11. Contract Logic mode type to `table | argument`.
12. Remove translation/comparison/proof panels from workbench.
13. Remove `FormalProofLab` import from Logic workbench.
14. Restyle Truth Table panel.
15. Restyle Argument panel.
16. Migrate old aliases/skill links.
17. Normalize mixed-practice logic notation.

## Phase D — Probability rebuild

18. Delete decorative `activeTab` state and unconditional Venn hero.
19. Introduce canonical probability tab model.
20. Implement Conditional Probability panel from one canonical table state.
21. Rebuild Venn diagram as a derived representation.
22. Implement Distributions panel using existing exact distribution engine.
23. Implement Random Variables mapping panel.
24. Add a domain-level supplemental inference engine with explicit method/assumptions.
25. Implement Inference panel.
26. Migrate persistence/query aliases.
27. Remove duplicate WorkbenchTaskPicker from flagship probability tabs.

## Phase E — Matrix rebuild

28. Delete mockup matrix state/sidebar/3D panel.
29. Bind Radix tabs to real `goal` state.
30. Migrate Matrix Operations UI to exact domain engine.
31. Migrate Solve Systems UI.
32. Migrate Row Reduction UI.
33. Migrate Inverse UI.
34. Add determinant as subordinate Operations result if retained.
35. Remove Eigenvalues from learner-facing lab.

## Phase F — Finance reconciliation

36. Remove/merge duplicate mockup finance state.
37. Implement collision-safe Timeline.
38. Add semantic timeline event ledger.
39. Add structured/display finance notation.
40. Render actuarial formulas through MathFormula.
41. Restyle controls/results and remove inline layout styles.

## Phase G — global redesign consistency

42. Fix Course filtered-directory layout.
43. Migrate mixed practice to Blueprint components.
44. Migrate Progress/Study residual old cards.
45. Replace remaining workbench `.apple-*` markup where safe.
46. Remove redundant CSS overrides after markup migration.

## Phase H — Optimization removal

47. Remove Applications from canonical workbench registry.
48. Introduce `WorkbenchId` separate from `ModuleId`.
49. Update Home to iterate four workbenches.
50. Update Course directory/filter copy/count.
51. Redirect `/workbenches/applications`.
52. Redirect old applications lab aliases to module/lesson destinations.
53. Remove `OptimizationStrategyWorkbench` learner bundle.
54. Replace/remove Optimization E2E suite.
55. Update mixed-assessment links that point to removed workbench.

## Phase I — final verification/deployment

56. update PWA/offline route list;
57. audit all query aliases and old bookmarks;
58. run static/unit/build;
59. run core E2E;
60. run full Chromium/Firefox/WebKit;
61. run production-PWA test;
62. screenshot desktop/mobile routes;
63. perform manual notation audit;
64. merge only after green checks;
65. ensure Vercel production branch is either changed to `main` or explicitly synchronized from `main` before calling deployment complete.

---

# 19. Atomic commit plan

Implementation should happen on a branch such as:

`fix/blueprint-workbench-reconciliation`

Do **not** combine unrelated UI, math, registry, and removal changes into one giant commit.

Recommended atomic commits:

1. `docs(plan): add Blueprint workbench reconciliation guardrail`
2. `test(probability): expose decorative tab regression`
3. `test(linear): expose decorative matrix tab regression`
4. `test(logic): require table and argument only`
5. `test(course): require four canonical workbenches`
6. `test(notation): guard learner-facing ASCII leakage`
7. `feat(ui): style canonical Radix Blueprint tabs`
8. `feat(math-ui): add accessible display math renderer`
9. `feat(notation): normalize logic display symbols`
10. `refactor(logic): reduce workbench modes to table and argument`
11. `refactor(logic): remove formal-proof learner surface`
12. `fix(logic): migrate retired logic lab aliases`
13. `fix(practice): render formatted logic expressions`
14. `refactor(probability): remove decorative activeTab state`
15. `feat(probability): bind canonical Blueprint tabs to view state`
16. `feat(probability): derive conditional Venn from event data`
17. `feat(probability): add discrete distribution panel`
18. `feat(probability): add random-variable mapping panel`
19. `feat(probability): add supplemental inference engine`
20. `feat(probability): add inference panel`
21. `fix(probability): migrate legacy routes and persistence`
22. `refactor(linear): remove flagship mockup duplicate state`
23. `feat(linear): bind matrix tabs to canonical goal state`
24. `feat(linear): rebuild matrix operations panel`
25. `feat(linear): rebuild solve-systems panel`
26. `feat(linear): rebuild row-reduction panel`
27. `feat(linear): rebuild inverse panel`
28. `fix(linear): normalize matrix and row-operation notation`
29. `refactor(finance): remove duplicate flagship calculator state`
30. `fix(finance): add collision-safe timeline label layout`
31. `feat(finance): add accessible timeline event ledger`
32. `feat(finance): render actuarial notation correctly`
33. `fix(finance): sync Blueprint controls and result panels`
34. `fix(course): remove empty filtered-directory field`
35. `fix(practice): sync mixed practice to Blueprint Orange`
36. `fix(progress): sync progress surfaces to Blueprint Orange`
37. `refactor(course): remove applications workbench registry entry`
38. `refactor(course): separate ModuleId and WorkbenchId`
39. `fix(home): render four canonical workbenches`
40. `fix(course): update workbench counts filters and study path links`
41. `refactor(applications): retire optimization workbench route`
42. `refactor(applications): migrate legacy lab destinations`
43. `refactor(applications): remove optimization learner component`
44. `test(a11y): extend workbench tab and visualization coverage`
45. `test(responsive): cover 320px and short-landscape workbenches`
46. `fix(pwa): update canonical offline workbench routes`
47. `docs(redesign): record final verified reconciliation state`

If any commit becomes large enough to contain multiple independently revertible ideas, split it further.

---

# 20. Files expected to change

## High-impact

- `apps/web/src/components/workbenches/LogicProofWorkbench.tsx`
- `apps/web/src/components/workbenches/ProbabilityModelBuilder.tsx`
- `apps/web/src/components/workbenches/RowOperationsCoach.tsx`
- `apps/web/src/components/workbenches/MoneyTimelineWorkbench.tsx`
- `apps/web/src/components/math/Timeline.tsx`
- `apps/web/src/components/math/StepTrace.tsx`
- `apps/web/src/components/ui/Tabs.tsx`
- `apps/web/src/styles/editorial-grid.css`
- `packages/course-content/src/index.ts`
- `packages/course-content/src/skill-graph.ts`

## New likely files

- `apps/web/src/components/math/MathInline.tsx`
- `apps/web/src/components/math/MathBlock.tsx`
- probability view subcomponents if the current 33k-line component is split;
- matrix view subcomponents if the current 44k-line component is split;
- `packages/domain-probability/src/inference.ts` if inference is implemented as planned.

## Removal/redirect

- `apps/web/src/components/workbenches/OptimizationStrategyWorkbench.tsx`
- `apps/web/src/pages/workbenches/applications.astro`
- related tests.

## Tests

- `tests/e2e/logic-workbench.spec.ts`
- `tests/e2e/probability-workbench.spec.ts`
- `tests/e2e/linear-workbench.spec.ts`
- `tests/e2e/applications-workbench.spec.ts`
- `tests/e2e/workbench-aliases.spec.ts`
- `tests/e2e/workbench-task-picker.spec.ts`
- `tests/e2e/pass9-course-map.spec.ts`
- `tests/e2e/app-shell.spec.ts`
- `tests/node/workbench-registry.test.ts`
- content/notation contract tests.

---

# 21. Acceptance criteria

Implementation is not complete until all of the following are true.

## Logic

- exactly two learner-facing lab tabs;
- Truth Table works;
- Test an Argument works;
- no Formal Proof/Translate/Compare app modes in lab;
- old routes do not break;
- visible logic uses normalized symbols.

## Probability

- four visible tabs all change actual content;
- Venn appears only where pedagogically appropriate;
- Distributions computes exact PMF statistics;
- Random Variables shows mapping + derived distribution;
- Inference is functional and honestly labeled Supplemental;
- no disconnected `activeTab`/`mode` systems.

## Matrices

- visible tabs all work;
- no decorative duplicate sidebar;
- no hard-coded Determinant selected state;
- no unsupported Eigenvalues tab;
- row operations/system/inverse remain exact;
- no decorative 3D panel disconnected from task.

## Finance

- no timeline label collisions in standard scenarios;
- mobile has readable fallback;
- no `a-angle-n` learner-facing text;
- actuarial formula display is correct and accessible;
- no misleading “exact” decimal wording.

## Course

- four canonical workbenches;
- Applications module may remain but Optimization workbench is gone;
- no giant empty navy field when filters show one card;
- no dead links.

## Visual consistency

- practice, progress, finance, logic, probability, linear all read as the same Blueprint Orange system;
- no obsolete glass blur or giant decorative gradients on migrated surfaces;
- no unexpected horizontal overflow.

## Accessibility

- axe serious/critical = 0 on target routes;
- keyboard tab behavior conforms to APG/Radix semantics;
- forced colors passes;
- reduced motion passes;
- target sizes pass project rules.

## CI

- `pnpm verify` passes;
- core E2E passes;
- full Chromium passes;
- Firefox + WebKit passes;
- production-PWA passes.

---

# 22. Anti-hallucination guardrails for implementation

1. **Do not invent a course skill because a mockup has a button.**
   - Example: Eigenvalues is currently a mockup tab but not a current skill/engine.

2. **Do not present inference as core AMAT 19 unless course evidence supports it.**
   - It may be implemented as explicitly Supplemental because the user requested a functional panel.

3. **Do not delete domain engines merely because a lab UI is removed.**
   - Remove learner-facing surface first; preserve reusable math where safe.

4. **Do not treat a styling state variable as a feature.**
   - A tab is only real if it switches a distinct mathematical panel/state.

5. **Do not use raw parser strings for final display.**
   - Parse -> canonical AST/domain result -> formatter/typesetter.

6. **Do not allow visuals to own separate values from the mathematical engine.**
   - Venn, timelines, matrices, and charts derive from canonical state.

7. **Do not claim exactness for rounded decimal calculations.**

8. **Do not remove Applications course content unless explicitly requested.**
   - Current directive removes Optimization lab/workbench; module content can remain.

9. **Do not merge until full CI is green.**

10. **Do not call production deployed merely because `main` has a green preview.**
    - Current Vercel project has historically used `pass1/truth-table-vertical-slice` as its Production Branch. Either reconfigure Vercel to `main` or synchronize the actual production branch and verify `Vercel – amat19` success for the exact target tree.

---

# 23. Research/source shortlist

## Accessibility / UI

- W3C WAI-ARIA Tabs Pattern — https://www.w3.org/WAI/ARIA/apg/patterns/tabs/
- W3C automatic tabs example — https://www.w3.org/WAI/ARIA/apg/patterns/tabs/examples/tabs-automatic/
- W3C manual tabs example — https://www.w3.org/WAI/ARIA/apg/patterns/tabs/examples/tabs-manual/
- WCAG 2.2 — https://www.w3.org/TR/wcag/
- What's New in WCAG 2.2 — https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/
- Radix Tabs — https://www.radix-ui.com/primitives/docs/components/tabs
- MDN SVG title — https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/title

## Math rendering

- KaTeX options — https://katex.org/docs/options
- MathLive — https://mathlive.io/mathlive/
- W3C Math — https://www.w3.org/Math/

## Logic

- OpenStax Constructing Truth Tables — https://openstax.org/books/contemporary-mathematics/pages/2-3-constructing-truth-tables
- OpenStax Logical Arguments — https://openstax.org/books/contemporary-mathematics/pages/2-7-logical-arguments

## Probability / statistics

- Seeing Theory — https://github.com/seeingtheory/Seeing-Theory
- OpenStax conditional probability terminology — https://openstax.org/books/statistics/pages/3-1-terminology
- OpenStax expected value/variance — https://openstax.org/books/introductory-statistics-2e/pages/4-2-mean-or-expected-value-and-standard-deviation
- OpenStax population proportion interval — https://openstax.org/books/introductory-statistics-2e/pages/8-3-a-population-proportion
- OpenStax inference introduction — https://openstax.org/books/introductory-statistics-2e/pages/8-introduction

## Linear algebra

- Mathigon matrices — https://mathigon.org/course/linear-algebra/matrices
- Mathigon linear transformations — https://mathigon.org/course/linear-algebra/linear-transformations
- Matrix Visualizer — https://github.com/jaasonw/matrix-visualizer
- Interactive elementary row operations — https://breazeal.com/matrix/
- OpenStax systems using matrices — https://openstax.org/books/intermediate-algebra/pages/4-5-solve-systems-of-equations-using-matrices

## Finance

- Society of Actuaries Exam FM notation — https://www.soa.org/globalassets/assets/Files/Edu/2018/exam-fm-notation-terminology-3.pdf

## Learning design

- Cognitive Load Theory development — https://link.springer.com/article/10.1007/s10648-023-09817-2
- Instructional approach / split attention — https://journals.sagepub.com/doi/full/10.1177/27527263241266765
- Segmentation of worked examples — https://onlinelibrary.wiley.com/doi/abs/10.1002/acp.1832

---

# 24. Recommended next action

On implementation approval:

1. create `fix/blueprint-workbench-reconciliation` from the then-current `main`;
2. commit this document first as the anti-hallucination layer;
3. write the failing interaction/registry/notation tests before changing production components;
4. implement phase-by-phase with the atomic commits above;
5. run full multi-browser + PWA verification;
6. merge only after a clean compare against current `main`;
7. deploy through the **actual Vercel Production Branch configuration** and verify the public `amat19.vercel.app` origin rather than only a preview deployment.

