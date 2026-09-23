---
title: Truth Values and Truth Tables
module: logic
order: 2
source: Original study note aligned to the current AMAT 19 course outline
status: implemented
---

A truth table lists every possible truth-value assignment for the simple propositions in a formula. If there are `n` distinct proposition letters, there are exactly **2ⁿ rows**.

For two letters P and Q, the standard ordering is TT, TF, FT, FF. For three letters, P changes every four rows, Q every two rows, and R every row. This repeating-block pattern is more reliable than memorizing a finished table.

## Evaluate from the inside out

Do not treat a long expression as one opaque operation. Identify its nested subexpressions, evaluate their children, and then apply the connective at each node. The final column can then be classified:

- **tautology** — final column is always true;
- **contradiction** — final column is always false;
- **contingent** — final column contains both truth values.

The [Truth Table lab](/labs/truth-table) exposes the same structure used by the deterministic evaluator, so selecting a cell shows the operand values that produced it.
