# Course traceability — Logic Pass 1

The uploaded AMAT 19 materials remain the mathematical/course authority. Pass 1 deliberately implements the smallest slice that can be checked directly against those materials.

| Course concept | Supplied source area | Engine/UI implementation | Verification |
|---|---|---|---|
| A proposition is T or F | Chapter 1, Truth Values and Truth Table | boolean assignment model | semantic tests |
| 2 symbols → 4 assignments | Chapter 1, truth-table introduction | `generateAssignments()` | exact row-order test |
| 3 symbols → 8 assignments | Chapter 1, truth-table introduction | `generateAssignments()` | exact 8-row-order test |
| AND (`∧`) | Chapter 1 connective table | evaluator `and` branch | exact four-row test |
| inclusive OR (`∨`) | Chapter 1 connective table | evaluator `or` branch + explanation | exact four-row test |
| implication (`→`) | Chapter 1 connective table | evaluator `implies` branch + selected-cell explanation | exact four-row test |
| biconditional (`↔`) | Chapter 1 connective table | evaluator `iff` branch | exact four-row test |
| negation (`∼`) | Chapter 1 connective table | evaluator `not` branch | exact two-row test |
| argument validity by counterexample | Chapter 1 / Exam 1 style | validity engine + Argument mode | Modus Ponens + supplied-exam-style test |
| converse vs implication | blueprint misconception target | equivalence checker returns counterexample | invariant/example test |
| contrapositive equivalence | logic relationship | equivalence checker | explicit test |

No generic theorem prover, symbolic-JS `eval`, or LLM is used to decide correctness.
