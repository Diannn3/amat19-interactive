# AMAT 19 Mathematical Correctness Contract

Version 1.3 — 2026-09-02

This file is a durable authority boundary for future AMAT 19 implementation passes. It is subordinate to the current course guide and verified source code, but it prevents future agents from casually changing mathematical semantics, precision claims, input rules, or mastery behavior.

## 1. Authority hierarchy

1. Current AMAT 19 course guide and explicitly approved course conventions.
2. Deterministic domain/math packages in this repository.
3. Automated regression/property/oracle tests.
4. React/Astro presentation code.
5. Explanatory prose and visual styling.

Presentation code must never become an independent mathematical authority.

## 2. Exact versus approximate arithmetic

### Rational / exact domains

Logic truth semantics, finite probability/counting, matrices, graphical LP correctness, supported simplex, zero-sum game calculations, and Markov probability algebra use exact deterministic representations where their domain permits it.

`Rational` accepts exact integer, fraction, decimal, and decimal-exponent text. Decimal rendering is derived with BigInt arithmetic. JavaScript `number` inputs are accepted only inside the safe exact numeric range; larger exact values must be supplied as strings or `bigint`. Exact rational text, intermediate result growth, and power work have explicit budgets. `toNumber()` is explicitly an approximate interoperability/rendering boundary.

### Finance

Finance uses a 30-decimal fixed-point `FinanceDecimal` layer. Every public `FinanceResult` identifies its numerical certainty:

- `exact` — reserved for results genuinely represented exactly by the contract.
- `fixed-point-rounded` — deterministic fixed-point computation with the documented scale/rounding policy.
- `iterative-approximation` — fractional powers/roots or other operations that require numerical approximation.

The deprecated `exactValue` field is compatibility-only and must not be interpreted as a universal exactness claim. `decimalValue`, `certainty`, `precisionDigits`, and `roundingMode` are authoritative.

Integer-period powers must use the integer fixed-point power path. Fractional powers/roots use deterministic fixed-point/rational reduction and Newton iteration; native `Math.pow` is not mathematical authority. Irrational roots remain labeled `iterative-approximation`.

## 3. Input contract

Mathematical inputs have three states: valid, incomplete, invalid. Blank text is not silently converted to zero.

- Counts and discrete trial counts must be whole-number text before conversion. Exact integer APIs reject unsafe JavaScript integers; callers must use text or `bigint` for larger exact values.
- Exact scalar text may use integers, fractions, decimals, or supported exponent form where the domain accepts Rational input.
- Matrix input must be rectangular. Missing cells are not silently padded.
- Rational, matrix, counting, probability-tree, game, finance, LP, and simulation workloads have domain-level budgets; HTML input limits are not the security/correctness boundary.
- Invalid input cannot write mastery evidence.

## 4. Learning/mastery contract

All assessed UI components route terminal outcomes through `recordAssessmentResult`.

Every assessment event records:

- canonical leaf skill ID;
- mathematical problem fingerprint;
- correct/incorrect/revealed/abandoned state;
- first-attempt correctness;
- incorrect retry count;
- hints/reveals;
- difficulty and contextual payload.

Parent mastery is derived; it is not directly written by individual labs.

A repeated perfect completion of the same problem fingerprint cannot count as another independent success. It may be stored as assisted evidence, but Secure mastery must not be obtained by replaying one memorized item.

Wrong answers must create explicit evidence rather than disappear from history.

## 5. Logic

- Parser/evaluator and truth-table semantics are deterministic.
- Argument invalidity means there exists an assignment where all premises are true and the conclusion is false.
- Accepted equivalence/proof rules follow the AMAT rule system.
- Whether commuted operands may be treated as implicit within one named equivalence step remains Decision D-002; do not broaden rule matching by guesswork.

## 6. Counting and probability

- Counting functions use exact BigInt arithmetic inside explicit work budgets.
- Probabilities represented as Rational must lie in [0,1].
- Joint probability triples must satisfy Fréchet bounds before independence/conditional analysis.
- Conditional probability with a zero-probability conditioning event is undefined.
- Discrete distributions canonicalize duplicate support values before moments/CDF evaluation.
- A valid finite PMF sums exactly to 1; its CDF is nondecreasing and ends at 1.
- Seeded Bernoulli simulation uses the exact uint32 threshold `floor(p*2^32)`; empirical frequency is never proof of theoretical probability.
- Worker code delegates Bernoulli mathematics to the shared probability-domain kernel.

## 7. Finance

- Simple interest: `A = P(1 + it)` under the course model.
- Compound interest: `A = P(1+i)^t`.
- Nominal/effective conversions and focal-date valuation use one consistent rate/time basis.
- Annuity immediate/due timing must agree between value engine and timeline. `n=0` means zero payments and value 0.
- Bond price is coupon-annuity PV plus redemption PV.
- D-001 remains unresolved: whether nonpositive simple-interest accumulation factors should be prohibited in course mode. Current behavior warns and treats the result as algebraic, not endorsed financial practice.
- D-003 remains unresolved: exact equality versus currency-rounded equality for the pedagogical meaning of “par.” The implementation exposes its current classification policy rather than hiding it.

## 8. Matrices and linear systems

- Matrices are exact Rational rectangular arrays.
- The editor and engine consume the same canonical matrix text parser.
- Addition/subtraction require equal dimensions; multiplication requires A columns = B rows.
- RREF/inverse/system classification are exact and expose legal row-operation traces.
- Oversized raw matrix paste is rejected before expensive exact work.

## 9. Graphical linear programming

Correctness decisions are exact Rational decisions. Fixed absolute floating EPS values are forbidden as mathematical authority for:

- nonzero coefficients;
- feasibility;
- line intersection/parallelism;
- vertex equality;
- objective comparisons;
- multiple optima;
- recession improvement.

Positive scaling of a constraint or objective must preserve the corresponding mathematical solution geometry/status.

An unbounded feasible region must expose recession geometry. The visual layer must not close finite vertices into a fake bounded polygon.

Conversion to JavaScript `number` is allowed only at the display/SVG boundary. The learner-facing graphical solver supports nonnegative decision variables only; callers requesting free-variable mode are rejected rather than receiving a misleading corner classification.

## 10. Simplex

The supplemental simplex routine remains intentionally limited to its documented educational standard form. It is not a universal LP solver.

Tie-breaking uses Bland-style indexed choices and basis fingerprints. A repeated basis is reported as a cycle condition rather than being silently hidden behind an iteration limit.

## 11. Game theory

The current solver is two-person zero-sum only. Maximin <= minimax is invariant. A pure saddle exists when the security values meet appropriately; supported interior 2x2 mixed solutions must make each opponent indifferent and agree on one exact game value.

Do not broaden to general Nash-equilibrium theory without an explicit course/product decision.

## 12. Markov chains

Transition matrices and probability vectors are validated stochastic objects. Evolution preserves exact total probability mass. Public APIs must not accept arbitrary unvalidated matrices/vectors as if they were stochastic.

Two-state stationary analysis returns typed outcomes such as unique/nonunique/unsupported; a nonunique stationary family must be explained rather than silently omitted.

## 13. Generated assessment contract

Every generated question must have:

- exactly four distinct choices;
- exactly one correct answer;
- valid `correctIndex`;
- canonical leaf `skillId` matching its module;
- valid registered `/labs/*` repair route;
- stable mathematical problem fingerprint;
- domain oracle able to recompute the keyed answer;
- no NaN/Infinity/undefined/malformed output.

A 10,000-seed deterministic corpus is the minimum current generator certification gate.

Unanswered submitted exam items are `abandoned`; they do not manufacture incorrect mastery evidence.

## 14. Verification and release claims

A local source candidate may be described as `implementation + node/property regression verified` after the relevant tests pass.

Do not describe a candidate as release-complete or CI-green until the exact candidate commit passes:

- `math-core` certification;
- quality/static/unit/build checks;
- Chromium browser suite;
- Firefox/WebKit core compatibility suite;
- production PWA suite.

“No more bugs” is never an authorized claim. Use “no additional defects found in the tested scope.”
