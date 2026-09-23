import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeAssessmentResult, payloadRepresentsIndependentSuccess, suppressRepeatedIndependentEvidence } from '../src/assessment.ts';

const base = {
  exerciseId: 'logic.truth-table.classify',
  problemFingerprint: 'P->Q::classification',
  module: 'logic' as const,
  skillId: 'logic.truth-table.classify',
  incorrectAttempts: 0,
  hintsUsed: 0,
  revealsUsed: 0,
};

test('first-pass correct work is independent evidence', () => {
  const out = normalizeAssessmentResult({ ...base, result: 'correct', firstAttemptCorrect: true });
  assert.equal(out.finalState, 'correct');
  assert.deepEqual(out.evidence, { score: 1, independent: true, assisted: false, revealed: false, hintsUsed: 0 });
});

test('correct work after a wrong attempt is assisted, not independent', () => {
  const out = normalizeAssessmentResult({ ...base, result: 'correct', firstAttemptCorrect: false, incorrectAttempts: 1 });
  assert.equal(out.evidence?.score, 1);
  assert.equal(out.evidence?.independent, false);
  assert.equal(out.evidence?.assisted, true);
});

test('incorrect work becomes explicit zero evidence and an incomplete attempt', () => {
  const out = normalizeAssessmentResult({ ...base, result: 'incorrect', firstAttemptCorrect: false, incorrectAttempts: 1 });
  assert.equal(out.finalState, 'incomplete');
  assert.deepEqual(out.evidence, { score: 0, independent: false, assisted: false, revealed: false, hintsUsed: 0 });
});

test('revealed work is never independent', () => {
  const out = normalizeAssessmentResult({ ...base, result: 'revealed', firstAttemptCorrect: false, revealsUsed: 1 });
  assert.equal(out.finalState, 'revealed');
  assert.equal(out.evidence?.score, 0);
  assert.equal(out.evidence?.independent, false);
  assert.equal(out.evidence?.revealed, true);
});

test('abandoned work persists without manufacturing mastery evidence', () => {
  const out = normalizeAssessmentResult({ ...base, result: 'abandoned', firstAttemptCorrect: false });
  assert.equal(out.finalState, 'abandoned');
  assert.equal(out.evidence, undefined);
});

test('contradictory first-attempt metadata is rejected', () => {
  assert.throws(
    () => normalizeAssessmentResult({ ...base, result: 'correct', firstAttemptCorrect: true, incorrectAttempts: 1 }),
    /firstAttemptCorrect/,
  );
  assert.throws(
    () => normalizeAssessmentResult({ ...base, result: 'incorrect', firstAttemptCorrect: true }),
    /firstAttemptCorrect/,
  );
});

test('negative or fractional counters are rejected', () => {
  assert.throws(() => normalizeAssessmentResult({ ...base, result: 'incorrect', firstAttemptCorrect: false, incorrectAttempts: -1 }), /Incorrect attempts/);
  assert.throws(() => normalizeAssessmentResult({ ...base, result: 'correct', firstAttemptCorrect: false, hintsUsed: 0.5 }), /Hints used/);
});


test('repeating the same problem fingerprint cannot create another independent success',()=>{
 const base=normalizeAssessmentResult({exerciseId:'x',problemFingerprint:'problem-a',module:'logic',skillId:'logic.truth-table.classify',result:'correct',firstAttemptCorrect:true,incorrectAttempts:0,hintsUsed:0,revealsUsed:0});
 assert.equal(base.evidence?.independent,true);
 const repeated=suppressRepeatedIndependentEvidence(base,true);
 assert.equal(repeated.evidence?.independent,false);
 assert.equal(repeated.evidence?.assisted,true);
 assert.equal(repeated.evidence?.score,1);
});

test('stored assessment payload identifies prior independent success only for the same fingerprint',()=>{
 const payload={problemFingerprint:'p1',assessment:{result:'correct',firstAttemptCorrect:true,incorrectAttempts:0,hintsUsed:0,revealsUsed:0}};
 assert.equal(payloadRepresentsIndependentSuccess(payload,'p1'),true);
 assert.equal(payloadRepresentsIndependentSuccess(payload,'p2'),false);
 assert.equal(payloadRepresentsIndependentSuccess({...payload,assessment:{...payload.assessment,hintsUsed:1}},'p1'),false);
});
