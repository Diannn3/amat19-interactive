# Unresolved Decisions — after Pass 8 hardening

1. **Finance certification** — the fixed-point FinanceDecimal layer materially improves precision, and independent vectors now test representative calculations. Decide the exact public tolerance/certification standard and whether to replace remaining native-number root/power fallbacks with a fully audited arbitrary-precision implementation.
2. **Concept-specific practice coverage** — unsupported `?skill=` targets now fall back honestly within the same module without false mastery attribution. Decide whether to build generators for every current leaf skill or change the UI label/availability when exact generated practice is unavailable.
3. **Mastery aggregation semantics** — leaf evidence rolls up to parent course skills so Progress and Study agree. Before high-stakes use, decide whether a parent can become Secure from repeated evidence concentrated in one child skill or should require breadth across multiple child skills.
4. **Service-worker update flush** — the worker side is hardened, but the current UI update button still needs an explicit application-wide persistence-flush acknowledgement instead of relying on a fixed delay.
5. **General LP oracle** — retain current supported scope unless an actual AMAT requirement demands higher-dimensional/general LP.
6. **Game Theory depth** — keep the current zero-sum foundation until authoritative current-course material supports broader equilibrium theory.
7. **Graph theory** — do not invent a unit until authoritative course material is supplied.
8. **Institutional branding** — continue neutral “AMAT 19 Study Lab” wording unless institutional marks are approved.
9. **Cloud sync/instructor features** — remain deferred; they are not required for the local-first student product.
10. **Repository license** — third-party notices are present, but the repository owner must choose the project-level license.
11. **Release governance** — protect `main` and require CI checks before treating the deployment as a public beta.
