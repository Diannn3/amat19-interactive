# Security and correctness guardrails

## Mathematical execution

- No `eval`, `Function`, dynamic JavaScript compilation, or `mathjs` universal evaluator.
- Only the AMAT propositional grammar is tokenized and parsed.
- Unsupported characters fail with source positions.
- Truth-table symbols are capped at eight in the learner-facing Pass 1 to bound `2^n` growth.
- Larger supported tables use a Worker seam with timeout/fallback.
- Assignment order and solution traces are deterministic.

## Dependency boundaries

- Domain code imports no React/Astro/DOM/persistence APIs.
- Third-party UI/runtime packages live in the web/persistence edges.
- Future visualization/solver dependencies must sit behind adapters rather than leak across domain modules.
- No remote CDN is required for fonts, runtime JS, or mathematical functionality.

## Data/privacy

- No account, analytics beacon, or backend exists in Pass 1.
- Browser data is local-first and schema-versioned.
- The persistence port makes later explicit export/sync possible without changing solver semantics.

## Remaining browser gates

A Content Security Policy, production asset headers, full offline precache validation, and dependency advisory audit belong to the first networked build/deployment pass. They are not falsely marked complete in this snapshot.
