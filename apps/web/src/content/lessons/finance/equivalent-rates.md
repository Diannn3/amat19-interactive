---
title: "Nominal and equivalent rates"
module: finance
order: 1
source: "Older business-math terminology aligned to current interest measurement"
status: implemented
---

## Nominal quote versus effective growth
A nominal annual rate `j^(m)` convertible `m` times per year uses periodic rate `j^(m)/m`. Its one-year accumulation factor is `(1 + j^(m)/m)^m`.

An equivalent annual effective rate `i` therefore satisfies `1 + i = (1 + j^(m)/m)^m`.

## Why equivalence matters
Two rates are comparable only after they are placed on the same time basis. The lab shows the one-year accumulation side by side rather than treating rate conversion as a memorized substitution.
