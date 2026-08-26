# ADR 0003 — Local-first persistence with a replaceable repository port

**Status:** Accepted for Pass 1

The MVP must remain useful without an account or network connection. Attempts, settings, and lab drafts therefore persist locally first.

`@amat19/persistence` exposes `PersistencePort`. The browser implementation uses Dexie/IndexedDB. A memory adapter exists for tests and non-browser use.

Future cloud sync must be additive: a sync adapter may replicate local records, but solving or practicing mathematics must never require a server round trip.
