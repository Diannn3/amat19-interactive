# AMAT 19 Math & Backend Audit v1.3

Date: 2026-09-02
Baseline authority: protected `main` at `a8c3277eaab828933e94951daa6a21afbfa7feb8`.

## Status rule

This audit extends the anti-hallucination blueprint. Local candidate evidence does **not** mean merged-main evidence. Items below are implementation candidates with local regression evidence until the exact integrated commit passes protected CI.

## Proven findings fixed in the v1.3 candidate

1. **HANDOFF-001 — hybrid-reference provenance.** The v1.2 `reference-implementation` contained some unchanged UI files from an older snapshot and therefore must not be used as a wholesale replacement of live `a8c3277`. v1.3 ships a v1.2→v1.3 delta plus a separately baseline-locked live-main compatibility hotfix.
2. **VERIFY-001 — clean archive could not self-run node tests.** Workspace aliases depended on pre-existing links. `scripts/setup-workspace-links.mjs` now makes dependency-free verification reproducible after extraction.
3. **TYPE-001 — runtime-green TypeScript defects.** Conflicting learning-engine exports and package-level type errors were repaired; framework-independent packages pass offline `tsc --noEmit`.
4. **LOGIC-001 — deep expression stack overflow.** Logic text/token/depth budgets now reject pathological nesting with a controlled parse error.
5. **FIN-001 — malformed/magnitude-unbounded FinanceDecimal input.** Whole-string grammar and text/exponent/value budgets prevent malformed mantissas and pathological exact-number work.
6. **MATRIX-001 — operation closure.** Public input budgets are separated from larger internal workspaces so transpose and Gauss-Jordan/inverse can legally return/use their own valid intermediate shapes.
7. **DATA-001 — destructive partial restore.** Snapshot scope is persisted and enforced by Memory/Dexie import; progress/saved restores preserve unrelated collections and current content metadata.
8. **LEARN-001 — non-atomic assessment commit.** Duplicate-fingerprint check, attempt write, and mastery update now share one atomic persistence operation.
9. **LEARN-002 — equivalent logic text could bypass replay identity.** Problem fingerprints canonicalize parsed logic while preserving semantically relevant premise order.
10. **INPUT-001 — strict-integer seams.** Proof references, truth-table row controls, row-operation indices, and simplex pivot inputs no longer silently accept loose numeric coercion.
11. **LP-001 — resource/runtime contract gaps.** Graphical constraint/literal and simplex tableau budgets are explicit; invalid runtime relation/sense values and unsupported free-variable graphical solve are rejected.
12. **PROB-001 — unsafe exact counts and unbounded tree work.** Unsafe JS count integers are rejected; probability-tree depth/node limits are preflighted before wide-map work.
13. **GAME-001 — unbounded payoff matrices.** Strategy/cell/literal budgets are enforced by the domain package.
14. **PWA-001 — stale cache namespace.** The service-worker cache name is bumped for the audited backend generation.
15. **FINVIS-001 — invalid finance text could still drive diagrams.** Interest/cash-flow/annuity/bond visuals now render only from validated domain state rather than coercing invalid text to visual zero/indices.
16. **EXACT-001 — unsafe JS numbers could become fake exact rationals/finance values.** Exact domains reject numbers outside the safe numeric range; larger exact values require string/`bigint`. Rational input/result/power growth is budgeted.
17. **COMPAT-001 — Firefox 44px fractional rounding.** Live CI measured 43.9998779px and 43.9999695px on two tested controls. The compatibility layer uses a 45px integral floor.
18. **COMPAT-002 — Firefox LP 2px overflow.** Live CI measured 250px scroll width against a 248px tolerance. Intrinsic LP widths are contained and narrow constraint fields may shrink/wrap while retaining the 44px minimum.

## Recovered live CI evidence

The `a8c3277` browser-compat job ran 80 Firefox/WebKit core tests: 77 passed and 3 failed. All three failures were Firefox presentation measurements; the corresponding WebKit tests passed. This removes the earlier ambiguity around the release blocker but does not prove the candidate hotfix until rerun on an integrated commit.

## Local verification evidence

Final candidate gates after the v1.3 audit:

- dependency-free Node/source-contract suite: **204/204 passing**;
- dedicated math certification: **138/138 passing**, including the deterministic 10,000-seed / 80,000-generated-question corpus;
- architecture audit: PASS;
- public-content audit: PASS;
- offline `tsc --noEmit`: PASS for math-core, domain-logic, domain-probability, domain-finance, domain-linear, domain-games, learning-engine, and course-content;
- syntax parse: 181 TS/TSX files, 0 syntax errors (before the audit record itself, which is Markdown only).

## Not promoted to merged-main status

The following remain required on the exact integrated commit: frozen pnpm install, repository `check/build`, Vitest, Chromium, Firefox, WebKit, production-PWA Playwright, and all protected GitHub checks. GitHub write access available to this assistant still returns HTTP 403 for branch creation.

## Decisions still intentionally unresolved

- D-001 negative simple-interest course policy;
- D-002 implicit commutation convention;
- D-003 pedagogical bond `par` equality convention;
- published finance approximation tolerance/error standard;
- repository redistribution license.
