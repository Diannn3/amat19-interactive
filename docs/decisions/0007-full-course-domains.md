# ADR-007 — Domain packages expand only with real course implementations

Status: accepted.

Pass 3 adds Probability, Finance, Linear/LP/Markov and Game Theory packages because working learner-facing modules now consume them. Each package remains framework-independent and testable in Node. Future domains should follow the same rule rather than creating empty architectural placeholders.
