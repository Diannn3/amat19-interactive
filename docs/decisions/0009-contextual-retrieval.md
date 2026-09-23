# Decision 0009 — Contextual module retrieval

Date: 2026-08-27

## Decision

Remove the global Practice Center as a primary destination. Retrieval practice is entered from each module route at `/modules/:module?view=practice`, where the module scope and repair links remain visible. The old `/practice` path stays only as a compatibility handoff to Study (or to a matching module route for a known module drill). `/exam` remains a separate, intentional whole-course self-check with delayed feedback.

## Rationale

The former global entry point made the shell compete with Study and Course, and it forced the learner to infer what a generated question belonged to. A module-owned entry point keeps navigation compact and makes the exercise context legible without adding another dashboard surface.

## Constraints

- Do not remove the deterministic assessment engine or its persistence/evidence behavior.
- Do not describe generated items as official assessments.
- Preserve old links through the compatibility handoff; do not leave `/practice?...` as a dead route.
- Keep module retrieval one question at a time with immediate feedback and a direct lab repair link.
