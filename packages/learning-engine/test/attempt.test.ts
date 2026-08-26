import assert from 'node:assert/strict';
import test from 'node:test';
import { checkTruthGuess, createAttempt, reduceAttempt } from '../src/index.ts';

test('attempt reducer keeps an append-only action/check trace', () => {
  let state = createAttempt({
    attemptId: 'a1',
    exerciseId: 'truth-table',
    module: 'logic',
    now: '2026-08-26T00:00:00Z'
  });
  state = reduceAttempt(state, {
    type: 'action',
    action: { type: 'select-cell', at: '2026-08-26T00:01:00Z', payload: { row: 0 } }
  });
  const check = checkTruthGuess({ expected: true, guess: true, rowIndex: 0, objectId: 'final' });
  state = reduceAttempt(state, { type: 'check', check, at: '2026-08-26T00:02:00Z' });
  assert.equal(state.actions.length, 1);
  assert.equal(state.checks.length, 1);
  assert.equal(state.finalState, 'correct');
});

test('wrong truth guess returns targeted feedback rather than a generic boolean', () => {
  const result = checkTruthGuess({ expected: false, guess: true, rowIndex: 2, objectId: 'final' });
  assert.equal(result.ok, false);
  assert.equal(result.kind, 'wrong-result');
  assert.equal(result.scope.stepId, 'row-2');
  assert.ok(result.nextHintId);
});
