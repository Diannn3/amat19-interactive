---
title: "Time value of money"
module: finance
order: 2
source: "Current finance scope + original explanation"
status: implemented
---

## Choose one focal date
Money at different dates cannot be added directly. Move every cash flow to a common valuation date first.

For effective rate `i`, moving amount `C` from time `s` to time `t` gives `C(1+i)^(t-s)`. A positive exponent accumulates forward; a negative exponent discounts backward.

## Invariant
Changing the focal date changes the numerical representation of each cash flow, but an equivalent financial equation remains equivalent.
