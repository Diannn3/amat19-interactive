# Security & Correctness Guardrails

## Mathematical execution
- No `eval`, `new Function`, or unrestricted expression evaluator.
- Logic accepts only the controlled propositional grammar and reports unsupported tokens with source position.
- Truth-table enumeration is bounded.
- Probability/matrix/game rational computations use exact arithmetic where mathematically appropriate.
- Formal proof checks the cited rule and scope, not merely semantic equivalence.
- LP/simplex/game helpers expose their supported boundaries instead of presenting themselves as universal solvers.
- Finance uses a high-precision fixed-point decimal layer; remaining non-integer power/root fallbacks require explicit release tolerance review.

## Learning correctness
- Deterministic engines decide correctness; no LLM grades mathematical work.
- Generated questions retain the skill they actually assess.
- Leaf mastery evidence rolls up to its parent course skill through one central mapping.
- Mastery read/modify/write is atomic at the persistence adapter boundary.
- `Secure` requires repeated, high-scoring independent evidence.
- The exam-like surface remains a study diagnostic, not an official course examination.

## Browser/data
- No auth, remote analytics, or cloud backend is required.
- Drafts, attempts, mastery, sessions, settings, and saved items remain browser-local.
- Snapshot imports are schema-validated and collection-bounded before destructive replacement.
- Snapshot replacement is transactional in Dexie.
- Service-worker update activation remains learner controlled.
- Navigation fallback ignores query strings and uses a bounded network-first wait.
- Core fonts and runtime math do not require third-party CDNs.

## Deployment and supply chain
- GitHub workflow token is read-only unless a future job explicitly requires more.
- External GitHub Actions are pinned to reviewed commit SHAs.
- pnpm 11 uses the pnpm 11-native setup path.
- High-severity dependency audit is release-blocking.
- Vercel responses define explicit CSP, framing, MIME-sniffing, referrer, and permissions headers.
- Service worker is configured for revalidation.

## Content/IP
- Learner-facing examples are original/generated.
- Historical handouts/exams are not published as a public question bank.
- Content audit is a heuristic safeguard; human review remains required.
- React Bits adaptations/inspirations are documented in `THIRD_PARTY_NOTICES.md`.

## Remaining release checks
- Exact merged-tree CI must be green.
- Real installed PWA update/offline testing on production browsers remains required.
- Browser-level screen-reader/keyboard review remains required.
- Public Finance tolerance/certification must be decided.
- Repository-level license must be chosen by the owner if redistribution is intended.
