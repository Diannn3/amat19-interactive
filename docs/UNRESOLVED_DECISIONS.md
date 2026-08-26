# Unresolved Decisions — after Pass 3

1. **Finance decimal precision** — current deterministic Finance traces use JavaScript numeric exponentiation. Before public correctness sign-off, adopt an audited arbitrary-precision decimal implementation or establish independent course-tolerance cross-checks.
2. **Conditional/indirect proof learner scopes** — core proof-rule validation exists; enable these modes only after preliminary-assumption scope/reference rules are fully enforced and course-reviewed.
3. **General LP oracle** — current graphical 2D solver plus bounded educational simplex is enough for implemented scope. Add HiGHS WASM only when a real requirement exceeds that boundary.
4. **Game Theory depth** — current guide explicitly names Game Theory, but the supplied older Chapter 4 search did not expose a dedicated Game Theory section. Keep the current zero-sum foundation original and seek instructor/current-material confirmation before adding broader equilibrium theory.
5. **Graph theory** — course description mentions graphs but no authoritative unit is supplied. Do not invent one.
6. **Branding** — continue using neutral “AMAT 19 Study Lab” wording unless institutional mark/branding use is explicitly approved.
7. **Cloud sync/instructor features** — remain deferred until local-first student workflows are validated.
8. **Pass 3 lockfile/browser certification** — must run on a networked environment; current container cannot resolve npm registry.
