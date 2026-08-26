# Security & Correctness Guardrails — Pass 3

## Mathematical execution
- no `eval`, `new Function`, or unrestricted expression evaluator
- Logic parses only the AMAT propositional grammar
- unsupported Logic tokens fail with source position
- truth-table enumeration capped to bound `2^n` growth
- heavy truth tables and probability simulations have Worker seams
- probability/matrix/game rational computations are exact
- RREF and proof lines preserve deterministic operation histories
- graphical LP and simplex expose their supported problem boundaries instead of pretending universal solver coverage

## Learning correctness
- deterministic engines decide correctness; no LLM grades mathematical work
- mixed practice answers are generated from the same canonical engines used by labs
- exam-like surface is explicitly a study diagnostic, not an official assessment
- current vs supplemental curriculum status is visible in the course-content profile

## Browser/data
- no auth, remote analytics or cloud backend
- drafts/attempts/mastery remain browser-local
- import snapshots are schema-validated
- service-worker update activation is learner controlled
- fonts/runtime math do not require third-party CDNs

## Content/IP
- learner-facing examples are original/generated
- historical handouts/exams are not published as a public archive/question bank
- content audit checks obvious assessment leakage; human review remains required

## Remaining release checks
- fresh dependency advisory audit
- real CSP/security headers at deployment
- real browser install/update/offline testing
- arbitrary-precision or independent Finance numeric verification
- browser-level accessibility and keyboard review
