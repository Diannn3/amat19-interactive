---
title: Inclusion–Exclusion for Two Sets
module: probability
order: 2
source: Original study note aligned to the current AMAT 19 course outline
status: engine-ready
---

When two sets overlap, simply adding their sizes counts the overlap twice. For two finite sets,

`|A ∪ B| = |A| + |B| - |A ∩ B|`.

The subtraction is not a correction trick to memorize. It follows from tracking how many times each region was counted: elements in only A or only B were counted once, while intersection elements were counted twice and therefore need one copy removed.

The [Counting Explorer](/labs/counting) includes a small exact inclusion–exclusion workspace so you can change the region counts and see the union update immediately.
