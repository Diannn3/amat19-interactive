import type { CheckResult } from './contracts.ts';
export type MasteryBand='new'|'learning'|'developing'|'secure';
export type RichMastery = {
  evidenceScore: number;
  attempts: number;
  independentSuccesses: number;
  assistedSuccesses: number;
  hintsUsed: number;
  revealsUsed: number;
  streak: number;
  band: MasteryBand;
};

export function masteryBand(score: number, attempts: number, independentSuccesses = 0): MasteryBand {
  if (attempts === 0) return 'new';
  if (score < 0.45) return 'learning';
  if (attempts >= 3 && score >= 0.78 && independentSuccesses >= 2) return 'secure';
  return 'developing';
}

export function updateMastery(input: {
  previousScore: number;
  previousAttempts: number;
  checks: CheckResult[];
  hintsUsed: number;
  revealed: boolean;
  previousIndependentSuccesses?: number;
  previousAssistedSuccesses?: number;
  previousRevealsUsed?: number;
  previousHintsUsed?: number;
  previousStreak?: number;
}) {
  const accuracy = input.checks.length ? input.checks.filter((c) => c.ok).length / input.checks.length : 0;
  const current = Math.max(0, Math.min(1, accuracy - Math.min(0.25, input.hintsUsed * 0.05) - (input.revealed ? 0.25 : 0)));
  const weight = Math.min(input.previousAttempts, 4);
  const evidenceScore = (input.previousScore * weight + current) / (weight + 1);
  const attempts = input.previousAttempts + 1;
  const independent = current >= 0.95 && input.hintsUsed === 0 && !input.revealed;
  const assisted = !independent && current > 0;
  const independentSuccesses = (input.previousIndependentSuccesses ?? 0) + (independent ? 1 : 0);
  const assistedSuccesses = (input.previousAssistedSuccesses ?? 0) + (assisted ? 1 : 0);
  const streak = independent ? (input.previousStreak ?? 0) + 1 : 0;
  return {
    evidenceScore,
    attempts,
    independentSuccesses,
    assistedSuccesses,
    hintsUsed: (input.previousHintsUsed ?? 0) + input.hintsUsed,
    revealsUsed: (input.previousRevealsUsed ?? 0) + (input.revealed ? 1 : 0),
    streak,
    band: masteryBand(evidenceScore, attempts, independentSuccesses)
  };
}

/** Merge one normalized evidence score into the transparent rolling mastery record. */
export function mergeMasteryEvidence(
  previousScore: number,
  previousAttempts: number,
  evidence: number,
  previousIndependentSuccesses = 0,
  independent = true
) {
  const normalized = Math.max(0, Math.min(1, evidence));
  const weight = Math.min(previousAttempts, 4);
  const evidenceScore = (previousScore * weight + normalized) / (weight + 1);
  const attempts = previousAttempts + 1;
  const isIndependent = independent && normalized >= 0.95;
  const independentSuccesses = previousIndependentSuccesses + (isIndependent ? 1 : 0);
  return {
    evidenceScore,
    attempts,
    independentSuccesses,
    band: masteryBand(evidenceScore, attempts, independentSuccesses)
  };
}
