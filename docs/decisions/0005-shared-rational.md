# ADR-005 — Shared exact Rational core

Status: accepted for rational domains.

Probability, matrices, game theory and supported simplex operations share a small BigInt-backed Rational in `@amat19/math-core`. This avoids binary floating artifacts in hand-work domains and prevents each package from inventing a slightly different fraction type.

Finance is excluded from this ADR where rate conversion/roots require a decimal/numerical strategy beyond rational arithmetic.
