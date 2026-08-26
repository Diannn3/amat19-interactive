---
title: Formal Proof as a Chain of Legal Steps
module: logic
order: 5
source: Original study note aligned to the current AMAT 19 course outline and configured rule catalog
status: implemented
---

A formal proof is a sequence of statements in which each new line follows from earlier lines by an allowed rule. The important question is not only whether the final statement is equivalent to the goal, but **why each particular step is legal**.

The current proof workspace includes the configured equivalence rules DM, DP, TR, MI, ME, EX, T, DN, AS, and CM, together with inference rules AD, CJ, SP, MP, MT, DS, HS, CD, and DD.

A good workflow is:

1. identify what the goal contains;
2. inspect premises for a directly usable rule;
3. cite only earlier lines;
4. apply one named transformation or inference at a time;
5. stop when the derived statement exactly reaches the goal.

The [Formal Proof Workspace](/labs/formal-proof) currently validates **direct proofs** production-style. Conditional and indirect proof scopes remain disabled until their assumption boundaries have equally strict validation.
