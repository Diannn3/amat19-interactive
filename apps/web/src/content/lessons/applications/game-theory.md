---
title: "Game theory foundations"
module: applications
order: 1
source: "Current course guide + original zero-sum foundation"
status: implemented
---

## Security before mixing
For a zero-sum payoff matrix, the row player protects against the worst payoff in each row and chooses the largest row minimum: the **maximin**. The column player chooses the smallest column maximum: the **minimax**.

If maximin equals minimax at a cell, that cell is a saddle point and pure strategies suffice. Without a saddle point, a 2×2 interior game may require mixed strategies that make the opponent indifferent.
