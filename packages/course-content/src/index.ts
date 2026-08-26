export const COURSE_VERSION = 'amat19-2026-pass1';

export const logicSkills = [
  {
    id: 'logic.truth-values',
    title: 'Truth values and truth tables',
    source: 'AMAT 19 Chapter 1 — Logic handout',
    status: 'implemented'
  },
  {
    id: 'logic.equivalence',
    title: 'Logical equivalence',
    source: 'AMAT 19 Chapter 1 — Logic handout',
    status: 'engine-ready'
  },
  {
    id: 'logic.argument-validity',
    title: 'Argument validity by truth table',
    source: 'AMAT 19 Chapter 1 — Logic handout / sample exam',
    status: 'engine-ready'
  },
  {
    id: 'logic.formal-proof',
    title: 'Formal proof',
    source: 'AMAT 19 Chapter 1 — Logic handout / sample exam',
    status: 'planned'
  }
] as const;
