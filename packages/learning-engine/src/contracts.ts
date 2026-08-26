export type ModuleId = 'logic' | 'probability' | 'finance' | 'linear' | 'applications';
export type Difficulty = 'intro' | 'standard' | 'challenge';
export type PracticeMode = 'guided' | 'practice' | 'mixed' | 'exam' | 'repair';
export type CheckKind =
  | 'correct'
  | 'partial'
  | 'incorrect'
  | 'invalid-step'
  | 'wrong-result'
  | 'wrong-method'
  | 'wrong-model'
  | 'arithmetic-error'
  | 'notation-error'
  | 'invalid-reference'
  | 'invalid-rule'
  | 'conceptual-error'
  | 'format'
  | 'strategy'
  | 'incomplete';

export type RepairTarget = {
  skillId: string;
  lessonHref?: string;
  labHref?: string;
  practicePreset?: string;
  reason: string;
};

export type CheckResult = {
  ok: boolean;
  scope: { objectId?: string; stepId?: string };
  kind: CheckKind;
  message: string;
  misconceptionId?: string;
  conceptId?: string;
  nextHintId?: string;
  acceptedAlternative?: boolean;
  repairTarget?: RepairTarget;
  evidence?: { score: number; independent: boolean; assisted: boolean };
};

export type DomainAction = { type: string; at: string; payload?: unknown };
export type MasteryEvidence = { skillId: string; score: number; reason: string; independent?: boolean; assisted?: boolean };
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
  masteryEvidence: MasteryEvidence[];
};
export type AttemptEvent =
  | { type: 'action'; action: DomainAction }
  | { type: 'check'; check: CheckResult; at: string }
  | { type: 'hint-used'; hintId: string; at: string }
  | { type: 'mastery-evidence'; evidence: MasteryEvidence; at: string }
  | { type: 'finish'; state: AttemptRecord['finalState']; at: string };

export type HintStep = {
  id: string;
  level: 1 | 2 | 3 | 4 | 5;
  title: string;
  body: string;
  revealsAnswer?: boolean;
};

export interface Exercise<TPrompt = unknown, TAnswer = unknown> {
  id: string;
  module: ModuleId;
  skillIds: string[];
  difficulty: Difficulty;
  prompt: TPrompt;
  mode?: PracticeMode;
  hints?: HintStep[];
  check(answer: TAnswer): CheckResult;
}
