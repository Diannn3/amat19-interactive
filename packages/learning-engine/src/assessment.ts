import type { Difficulty, ModuleId } from './contracts.ts';

export type AssessmentResultKind = 'correct' | 'incorrect' | 'revealed' | 'abandoned';

export type AssessmentResultInput = {
  exerciseId: string;
  problemFingerprint: string;
  module: ModuleId;
  skillId: string;
  result: AssessmentResultKind;
  firstAttemptCorrect: boolean;
  incorrectAttempts: number;
  hintsUsed: number;
  revealsUsed: number;
  difficulty?: Difficulty;
};

export type NormalizedAssessmentEvidence = {
  score: 0 | 1;
  independent: boolean;
  assisted: boolean;
  revealed: boolean;
  hintsUsed: number;
};

export type NormalizedAssessmentResult = {
  finalState: 'correct' | 'incomplete' | 'abandoned' | 'revealed';
  evidence?: NormalizedAssessmentEvidence;
};

function requireNonEmpty(name: string, value: string): void {
  if (!value.trim()) throw new RangeError(`${name} must be a non-empty string.`);
}

function requireNonnegativeInteger(name: string, value: number): void {
  if (!Number.isInteger(value) || value < 0) throw new RangeError(`${name} must be a nonnegative integer.`);
}

/**
 * Convert one learner-facing assessment outcome into persistence/mastery semantics.
 *
 * This function deliberately does not tune mastery thresholds or invent partial-credit
 * weights. A correct result contributes score 1; an incorrect/revealed result contributes
 * score 0; abandoned work is persisted as an attempt without mastery evidence. The
 * independent/assisted distinction carries retry/hint/reveal information separately.
 */
export function normalizeAssessmentResult(input: AssessmentResultInput): NormalizedAssessmentResult {
  requireNonEmpty('Exercise id', input.exerciseId);
  requireNonEmpty('Problem fingerprint', input.problemFingerprint);
  requireNonEmpty('Skill id', input.skillId);
  requireNonnegativeInteger('Incorrect attempts', input.incorrectAttempts);
  requireNonnegativeInteger('Hints used', input.hintsUsed);
  requireNonnegativeInteger('Reveals used', input.revealsUsed);

  if (input.firstAttemptCorrect && input.incorrectAttempts > 0) {
    throw new RangeError('firstAttemptCorrect cannot be true after an incorrect attempt.');
  }
  if (input.firstAttemptCorrect && input.result !== 'correct') {
    throw new RangeError('firstAttemptCorrect can only be true for a correct result.');
  }

  const finalState = input.result === 'correct'
    ? 'correct'
    : input.result === 'revealed'
      ? 'revealed'
      : input.result === 'abandoned'
        ? 'abandoned'
        : 'incomplete';

  if (input.result === 'abandoned') return { finalState };

  const correct = input.result === 'correct';
  const revealed = input.result === 'revealed' || input.revealsUsed > 0;
  const independent = correct
    && input.firstAttemptCorrect
    && input.incorrectAttempts === 0
    && input.hintsUsed === 0
    && input.revealsUsed === 0;

  return {
    finalState,
    evidence: {
      score: correct ? 1 : 0,
      independent,
      assisted: correct && !independent,
      revealed,
      hintsUsed: input.hintsUsed,
    },
  };
}

/**
 * Repeating the exact same problem cannot create a second independent-success count.
 * The score remains a successful score, but the repetition is classified as assisted
 * so Secure mastery still requires evidence from distinct problem fingerprints.
 */
export function suppressRepeatedIndependentEvidence(result:NormalizedAssessmentResult,hasPriorIndependentSuccess:boolean):NormalizedAssessmentResult{
 if(!hasPriorIndependentSuccess||!result.evidence?.independent)return result;
 return{...result,evidence:{...result.evidence,independent:false,assisted:true}};
}

export function payloadRepresentsIndependentSuccess(payload:unknown,problemFingerprint:string):boolean{
 if(!payload||typeof payload!=='object'||Array.isArray(payload))return false;
 const record=payload as Record<string,unknown>;
 if(record.problemFingerprint!==problemFingerprint)return false;
 const assessment=record.assessment;
 if(!assessment||typeof assessment!=='object'||Array.isArray(assessment))return false;
 const data=assessment as Record<string,unknown>;
 return data.result==='correct'&&data.firstAttemptCorrect===true&&data.incorrectAttempts===0&&data.hintsUsed===0&&data.revealsUsed===0;
}
