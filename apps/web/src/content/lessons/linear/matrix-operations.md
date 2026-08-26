---
title: "Matrix operations and compatibility"
module: linear
order: 0
source: "Current course guide + original explanation"
status: implemented
---

## Dimensions are part of the mathematics
Two matrices can be added only when their dimensions match. For multiplication `AB`, the number of columns of `A` must equal the number of rows of `B`.

## Row by column
Each product cell is a dot product: take one row from `A`, one column from `B`, multiply corresponding entries, then add. Selecting a result cell in the lab reveals exactly those contributing entries.
