---
title: "Graphical linear programming"
module: applications
order: 0
source: "Current course guide + original explanation"
status: implemented
---

## Model first
A two-variable linear program has an objective and a collection of linear constraints. The constraints determine the feasible set; the objective only ranks feasible points.

## Corner-point principle
When a bounded feasible polygon has an optimum, a linear objective attains it at a corner (or along an entire edge connecting tied optimal corners). The lab enumerates boundary intersections, filters infeasible points, then evaluates the objective.
