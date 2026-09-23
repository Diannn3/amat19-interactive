---
title: "Annuities"
module: finance
order: 3
source: "Current course guide + original explanation"
status: implemented
---

## Timing before formula
An **annuity-immediate** pays at the end of each period. An **annuity-due** pays at the beginning. That one-period shift changes the value by one accumulation factor `(1+i)`.

For level payment `R`, rate `i`, and `n` payments, the immediate present-value factor is `(1-(1+i)^(-n))/i`; the future-value factor is `((1+i)^n-1)/i`.

## Useful habit
Draw the payment timeline before selecting a factor. Most annuity mistakes are timing mistakes disguised as algebra mistakes.
