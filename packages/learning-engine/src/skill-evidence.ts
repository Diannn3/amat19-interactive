import type { LearningSession } from './session.ts';

export type SkillEvidence = {
  skillId: string;
  at: string;
  score: number;
  independent: boolean;
  assisted: boolean;
  revealed: boolean;
  sourceExerciseId: string;
  sourceSessionId: string;
};

export function evidenceFromSession(session: LearningSession): SkillEvidence[] {
  const checks = session.checks.map((entry) => entry.result);
  const best = checks.reduce((score, check) => Math.max(score, check.ok ? 1 : check.kind === 'partial' ? 0.55 : 0), 0);
  const hintPenalty = Math.min(0.25, session.hintsUsed.length * 0.05);
  const revealPenalty = session.reveals.length ? 0.35 : 0;
  const score = Math.max(0, Math.min(1, best - hintPenalty - revealPenalty));
  const independent = session.outcome === 'completed' && session.hintsUsed.length === 0 && session.reveals.length === 0 && best === 1;
  const assisted = !independent && best > 0;
  return session.skillIds.map((skillId) => ({
    skillId,
    at: session.updatedAt,
    score,
    independent,
    assisted,
    revealed: session.reveals.length > 0,
    sourceExerciseId: session.exerciseId,
    sourceSessionId: session.sessionId
  }));
}
