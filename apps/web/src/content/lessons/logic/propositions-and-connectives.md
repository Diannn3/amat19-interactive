---
title: Propositions and Connectives
module: logic
order: 1
source: Original study note aligned to the current AMAT 19 course outline
status: implemented
---

A **proposition** is a declarative statement that has a truth value: true or false. Questions, commands, and open statements whose truth cannot yet be determined are not propositions in the same sense.

## Read the connective as a relationship

- `∼P` means **not P**.
- `P ∧ Q` means **P and Q**. Both parts must be true.
- `P ∨ Q` means **P or Q**, inclusively: at least one part is true.
- `P → Q` means **if P, then Q**. It is false only when P is true and Q is false.
- `P ↔ Q` means **P if and only if Q**. The two truth values must match.

A common translation trap is **only if**. “P only if Q” means `P → Q`: Q is required whenever P happens.

Use the [Logic Basics lab](/labs/logic-basics) to practice controlled examples before moving to full formulas.
