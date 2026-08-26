import { mergeMasteryEvidence } from '@amat19/learning-engine';
import { DexiePersistence, type MasteryRecord, type PersistedAttempt } from '@amat19/persistence';

export async function recordSkillEvidence(skillId: string, score: number): Promise<MasteryRecord> {
  const db = new DexiePersistence();
  const previous = await db.getMastery(skillId);
  const next = mergeMasteryEvidence(previous?.evidenceScore ?? 0, previous?.attempts ?? 0, score);
  const record: MasteryRecord = {
    skillId,
    evidenceScore: next.evidenceScore,
    attempts: next.attempts,
    lastPracticed: new Date().toISOString()
  };
  await db.saveMastery(record);
  return record;
}

export function masteryLabel(record?: Pick<MasteryRecord, 'evidenceScore' | 'attempts'>): 'New' | 'Developing' | 'Secure' {
  if (!record || record.attempts === 0) return 'New';
  return record.attempts >= 3 && record.evidenceScore >= 0.78 ? 'Secure' : 'Developing';
}

function attemptId(prefix: string): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return `${prefix}-${crypto.randomUUID()}`;
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export async function recordAttempt<T>(input: {
  prefix: string;
  exerciseId: string;
  module: string;
  finalState: PersistedAttempt['finalState'];
  payload: T;
  startedAt?: string;
}): Promise<void> {
  const now = new Date().toISOString();
  const db = new DexiePersistence();
  await db.saveAttempt({
    attemptId: attemptId(input.prefix),
    exerciseId: input.exerciseId,
    module: input.module,
    startedAt: input.startedAt ?? now,
    updatedAt: now,
    finalState: input.finalState,
    payload: input.payload
  });
}
