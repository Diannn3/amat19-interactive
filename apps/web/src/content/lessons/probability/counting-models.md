---
title: Choosing a Counting Model
module: probability
order: 1
source: Original study note aligned to the current AMAT 19 course outline
status: implemented
---

Before using a permutation or combination formula, decide what makes two outcomes different.

Ask two questions:

1. **Does order matter?** If AB and BA represent different outcomes, order matters.
2. **Can an item be reused?** Repetition changes the model and the count.

For selecting `r` distinct items from `n` distinct items without repetition:

- order matters: `P(n,r) = n!/(n-r)!`;
- order does not matter: `C(n,r) = n!/[r!(n-r)!]`.

If each of `r` positions can independently use any of `n` choices, the count is `nʳ`.

The [Counting Explorer](/labs/counting) keeps counts as exact integers even when they exceed JavaScript's ordinary safe-integer range.
