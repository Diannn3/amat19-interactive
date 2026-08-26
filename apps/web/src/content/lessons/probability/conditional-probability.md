---
title: Conditional Probability Changes the Universe
module: probability
order: 4
source: Original study note aligned to the current AMAT 19 course outline
status: implemented
---

Conditional probability answers a probability question **after restricting attention to an event that is already known to have occurred**.

`P(A | B) = P(A ∩ B) / P(B)`, provided `P(B) > 0`.

The denominator is the key idea. Once B is given, B becomes the active sample universe. This is why `P(A|B)` and `P(B|A)` generally differ: they use the same intersection but different denominators.

In a two-way table, highlight the conditioning row or column before calculating. In a tree, read a branch probability relative to its parent state rather than to the original root.

The [Conditional Probability lab](/labs/conditional-probability) lets you switch the conditioning event while keeping the same canonical counts.
