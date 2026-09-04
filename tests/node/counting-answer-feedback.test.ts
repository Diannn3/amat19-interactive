import assert from 'node:assert/strict';
import test from 'node:test';
import { checkCountingModel } from '../../apps/web/src/lib/counting-answer-feedback.ts';

test('counting model feedback accepts the exact recommended model', () => {
  assert.equal(checkCountingModel('permutation', 'permutation').status, 'correct');
});

test('counting model feedback stays local for a wrong model', () => {
  const feedback = checkCountingModel('combination', 'permutation');
  assert.equal(feedback.status, 'incorrect');
  assert.doesNotMatch(feedback.message, /permutation|P\(/i);
});

test('counting model feedback asks for a choice before checking', () => {
  assert.equal(checkCountingModel('', 'combination').status, 'incomplete');
});
