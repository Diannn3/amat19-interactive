---
title: "Inverse matrices and systems"
module: linear
order: 2
source: "Current course guide + older Gauss–Jordan depth"
status: implemented
---

## Inverse by augmentation
For a square matrix `A`, augment with the identity: `[A | I]`. If row reduction reaches `[I | B]`, then `B = A⁻¹`. If the left block cannot become the identity, `A` is singular.

## System classification
A pivot in every variable column gives a unique solution. Missing variable pivots without contradiction produce infinitely many solutions. A contradiction row means the system is inconsistent.
