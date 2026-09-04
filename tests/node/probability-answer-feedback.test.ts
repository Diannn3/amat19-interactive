import assert from 'node:assert/strict';
import test from 'node:test';
import { Rational } from '@amat19/math-core';
import { checkProbabilityAnswer } from '../../apps/web/src/lib/probability-answer-feedback.ts';

test('probability answer feedback accepts an exact rational answer', () => {
  assert.deepEqual(checkProbabilityAnswer('4/5', new Rational(4n, 5n), 'conditional probability'), {
    status: 'correct',
    message: 'Correct. Your conditional probability is exact.',
  });
});

test('probability answer feedback localizes a wrong answer without revealing the target', () => {
  const result = checkProbabilityAnswer('3/5', new Rational(4n, 5n), 'posterior');
  assert.equal(result.status, 'incorrect');
  assert.match(result.message, /recheck/i);
  assert.doesNotMatch(result.message, /4\/5/);
});

test('probability answer feedback rejects malformed input locally', () => {
  const result = checkProbabilityAnswer('four fifths', new Rational(4n, 5n), 'conditional probability');
  assert.equal(result.status, 'invalid');
  assert.match(result.message, /enter an exact probability/i);
});
