import type { CheckResult, Difficulty, DomainAction, HintStep, ModuleId, PracticeMode } from './contracts.ts';

export type LearningSessionOutcome = 'active' | 'completed' | 'abandoned' | 'revealed';
export type SessionCheck = { at: string; result: CheckResult };

export type LearningSession = {
  sessionId: string;
  exerciseId: string;
  module: ModuleId;
  skillIds: string[];
  difficulty: Difficulty;
  mode: PracticeMode;
  startedAt: string;
  updatedAt: string;
  resumedAt?: string;
  completedAt?: string;
  actions: DomainAction[];
  checks: SessionCheck[];
  hintsUsed: string[];
  reveals: string[];
  outcome: LearningSessionOutcome;
};

export type LearningSessionEvent =
  | { type: 'resume'; at: string }
  | { type: 'action'; action: DomainAction }
  | { type: 'check'; result: CheckResult; at: string }
  | { type: 'hint'; hintId: string; at: string }
  | { type: 'reveal'; revealId: string; at: string }
  | { type: 'complete'; at: string }
  | { type: 'abandon'; at: string };

export function createLearningSession(input: {
  sessionId: string;
  exerciseId: string;
  module: ModuleId;
  skillIds: string[];
  difficulty?: Difficulty;
  mode?: PracticeMode;
  now: string;
}): LearningSession {
  return {
    sessionId: input.sessionId,
    exerciseId: input.exerciseId,
    module: input.module,
    skillIds: [...input.skillIds],
    difficulty: input.difficulty ?? 'standard',
    mode: input.mode ?? 'practice',
    startedAt: input.now,
    updatedAt: input.now,
    actions: [],
    checks: [],
    hintsUsed: [],
    reveals: [],
    outcome: 'active'
  };
}

export function reduceLearningSession(state: LearningSession, event: LearningSessionEvent): LearningSession {
  switch (event.type) {
    case 'resume':
      return { ...state, resumedAt: event.at, updatedAt: event.at, outcome: 'active' };
    case 'action':
      return { ...state, updatedAt: event.action.at, actions: [...state.actions, event.action] };
    case 'check':
      return { ...state, updatedAt: event.at, checks: [...state.checks, { at: event.at, result: event.result }] };
    case 'hint':
      return {
        ...state,
        updatedAt: event.at,
        hintsUsed: state.hintsUsed.includes(event.hintId) ? state.hintsUsed : [...state.hintsUsed, event.hintId]
      };
    case 'reveal':
      return {
        ...state,
        updatedAt: event.at,
        reveals: state.reveals.includes(event.revealId) ? state.reveals : [...state.reveals, event.revealId],
        outcome: 'revealed'
      };
    case 'complete':
      return { ...state, updatedAt: event.at, completedAt: event.at, outcome: state.reveals.length ? 'revealed' : 'completed' };
    case 'abandon':
      return { ...state, updatedAt: event.at, outcome: 'abandoned' };
  }
}

export function nextSessionHint(hints: HintStep[] | undefined, usedIds: string[]): HintStep | undefined {
  if (!hints?.length) return undefined;
  return [...hints].sort((a, b) => a.level - b.level).find((hint) => !usedIds.includes(hint.id));
}

export function sessionIndependentSuccess(session: LearningSession): boolean {
  return session.outcome === 'completed' && session.hintsUsed.length === 0 && session.reveals.length === 0 && session.checks.some((check) => check.result.ok);
}
