import assert from 'node:assert/strict';
import test from 'node:test';
import { matrix } from '@amat19/domain-linear';
import { checkMatrixArithmetic, checkRowStep } from '../../apps/web/src/lib/row-step-feedback.ts';

test('row-step feedback accepts an exact candidate row', () => {
  const current = matrix([['1', '1', '3'], ['1', '-1', '1']]);
  const feedback = checkRowStep(current, { kind: 'replace', targetRow: 1, sourceRow: 0, factor: '-1' }, '0 -2 -2');

  assert.equal(feedback.status, 'correct');
  assert.equal(feedback.code, 'correct');
});

test('row-step feedback identifies the first arithmetic column without revealing the answer', () => {
  const current = matrix([['1', '1', '3'], ['1', '-1', '1']]);
  const feedback = checkRowStep(current, { kind: 'replace', targetRow: 1, sourceRow: 0, factor: '-1' }, '0 -1 -2');

  assert.equal(feedback.status, 'incorrect');
  assert.equal(feedback.code, 'wrong-column');
  assert.equal(feedback.field, 'candidate');
  assert.match(feedback.message, /Column 2/);
  assert.doesNotMatch(feedback.message, /-2 -2/);
});

test('row-step feedback rejects a candidate with the wrong row shape', () => {
  const current = matrix([['1', '1', '3'], ['1', '-1', '1']]);
  const feedback = checkRowStep(current, { kind: 'replace', targetRow: 1, sourceRow: 0, factor: '-1' }, '0 -2 -2\n1 2 3');

  assert.equal(feedback.status, 'invalid');
  assert.equal(feedback.code, 'invalid-row');
  assert.equal(feedback.field, 'candidate');
});

test('matrix arithmetic feedback checks exact addition and localizes a wrong cell', () => {
  const left = matrix([['1', '2'], ['3', '4']]);
  const right = matrix([['2', '1'], ['1', '2']]);
  const correct = checkMatrixArithmetic(left, right, 'add', '3 3\n4 6');
  const incorrect = checkMatrixArithmetic(left, right, 'add', '3 3\n5 6');

  assert.equal(correct.status, 'correct');
  assert.equal(incorrect.status, 'incorrect');
  assert.equal(incorrect.code, 'wrong-cell');
  assert.match(incorrect.message, /Row 2, column 1/);
});

test('matrix arithmetic feedback reports incompatible multiplication as a model error', () => {
  const left = matrix([['1', '2']]);
  const right = matrix([['1', '2']]);
  const feedback = checkMatrixArithmetic(left, right, 'multiply', '1');

  assert.equal(feedback.status, 'model-error');
  assert.equal(feedback.code, 'model');
  assert.match(feedback.message, /columns/);
});
