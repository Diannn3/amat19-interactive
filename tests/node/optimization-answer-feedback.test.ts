import test from 'node:test';
import assert from 'node:assert/strict';
import { Rational } from '@amat19/math-core';
import {
  checkBestCornerAnswer,
  checkDominanceAnswer,
  checkModelStatus,
} from '../../apps/web/src/lib/optimization-answer-feedback.ts';

const corners = [
  { x: Rational.from(3), y: Rational.from(1) },
  { x: Rational.from(2), y: Rational.from(2) },
];

test('best-corner feedback accepts an exact feasible corner', () => {
  assert.deepEqual(checkBestCornerAnswer('3', '1', corners), {
    status: 'correct',
    message: 'Correct. That corner gives the best feasible objective value.',
  });
});

test('best-corner feedback stays local when the chosen corner is wrong', () => {
  const feedback = checkBestCornerAnswer('1', '1', corners);
  assert.equal(feedback.status, 'incorrect');
  assert.match(feedback.message, /recheck|objective|corner/i);
  assert.doesNotMatch(feedback.message, /3|2|best feasible objective/i);
});

test('best-corner feedback rejects malformed coordinates', () => {
  assert.equal(checkBestCornerAnswer('?', '1', corners).status, 'invalid');
});

test('dominance feedback accepts the absence of strict dominance', () => {
  assert.equal(checkDominanceAnswer('none', []).status, 'correct');
});

test('dominance feedback accepts a valid dominated strategy comparison', () => {
  assert.equal(checkDominanceAnswer('row:2>1', [{ kind: 'row', dominated: 1, by: 0 }]).status, 'correct');
});

test('dominance feedback does not reveal the valid comparison on a wrong choice', () => {
  const feedback = checkDominanceAnswer('none', [{ kind: 'row', dominated: 1, by: 0 }]);
  assert.equal(feedback.status, 'incorrect');
  assert.doesNotMatch(feedback.message, /row 2|row 1|dominated by/i);
});

test('model-status feedback accepts the classification needed for non-finite LPs', () => {
  assert.equal(checkModelStatus('unbounded', 'unbounded').status, 'correct');
  assert.equal(checkModelStatus('optimal', 'infeasible').status, 'incorrect');
});
