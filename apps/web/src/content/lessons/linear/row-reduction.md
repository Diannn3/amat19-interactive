---
title: "Row reduction and RREF"
module: linear
order: 1
source: "Current matrices scope + original explanation"
status: implemented
---

## Legal elementary row operations
You may swap two rows, multiply a row by a nonzero scalar, or add a scalar multiple of one row to another. These operations preserve the solution set of a linear system.

## Why RREF is useful
Reduced row echelon form exposes pivots and free variables. In an augmented matrix it also reveals contradictions such as a zero coefficient row with a nonzero constant.
