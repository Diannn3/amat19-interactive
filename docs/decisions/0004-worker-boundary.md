# ADR 0004 — Worker boundary for exponential or simulation-heavy compute

**Status:** Accepted for Pass 1

Truth-table row counts grow as `2^n`. The current UI limits expressions to eight unique symbols and sends tables above a small threshold to a Web Worker. The worker returns a serializable canonical truth-table model. A synchronous fallback is retained for unsupported/failing Worker environments.

The same pattern is intended later for Monte Carlo probability simulation and high-cost optimization, without moving domain semantics into the worker wrapper.
