export type ModuleId = 'logic' | 'probability' | 'finance' | 'linear' | 'applications';

export type CheckResult = {
  ok: boolean;
  scope: { objectId?: string; stepId?: string };
  kind: 'correct' | 'partial' | 'invalid-step' | 'wrong-result' | 'format' | 'strategy';
  message: string;
  misconceptionId?: string;
  nextHintId?: string;
  acceptedAlternative?: boolean;
};

export type DomainAction = {
  type: string;
  at: string;
  payload?: unknown;
};

export type AttemptRecord = {
  attemptId: string;
  exerciseId: string;
  module: ModuleId;
  startedAt: string;
  updatedAt: string;
  actions: DomainAction[];
  checks: CheckResult[];
  hintsUsed: string[];
  finalState: 'correct' | 'incomplete' | 'abandoned' | 'revealed';
};

export type AttemptEvent =
  | { type: 'action'; action: DomainAction }
  | { type: 'check'; check: CheckResult; at: string }
  | { type: 'hint-used'; hintId: string; at: string }
  | { type: 'finish'; state: AttemptRecord['finalState']; at: string };
