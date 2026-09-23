---
title: "Bayes and Total Probability"
module: "probability"
order: 8
status: "supplemental"
source: "Original AMAT 19 study explanation; extends conditional-probability structure"
---

Bayes' rule is easiest to understand as **re-restricting the sample space after evidence arrives**.

If an event `A` can produce evidence `B`, then the path `A` followed by `B` has joint probability

`P(A ∩ B) = P(A)P(B | A)`.

If several mutually exclusive starting cases can all produce `B`, add their joint paths to obtain `P(B)`.

Then

`P(A | B) = P(A ∩ B) / P(B)`.

The numerator is the part of the observed evidence that came through `A`. The denominator is **all** observed evidence. The Bayes lab keeps the tree, joint paths, evidence denominator, and posterior synchronized so the formula never becomes a symbol swap.
