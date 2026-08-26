import assert from 'node:assert/strict';
import test from 'node:test';
import { buildTruthTable, generateAssignments } from '../src/index.ts';

function finals(expression: string): boolean[] {
  return buildTruthTable(expression).rows.map((row) => row.finalValue);
}

test('AMAT handout row order is TT, TF, FT, FF for P and Q', () => {
  const table = buildTruthTable('P & Q');
  assert.deepEqual(
    table.rows.map((row) => [row.assignment.P, row.assignment.Q]),
    [[true, true], [true, false], [false, true], [false, false]]
  );
});

test('AMAT handout row order is deterministic for three variables', () => {
  const table = buildTruthTable('P & (Q | R)');
  assert.deepEqual(
    table.rows.map((row) => [row.assignment.P, row.assignment.Q, row.assignment.R]),
    [
      [true, true, true],
      [true, true, false],
      [true, false, true],
      [true, false, false],
      [false, true, true],
      [false, true, false],
      [false, false, true],
      [false, false, false]
    ]
  );
});

test('conjunction matches the supplied AMAT Chapter 1 truth table', () => {
  assert.deepEqual(finals('P ∧ Q'), [true, false, false, false]);
});

test('inclusive disjunction matches the supplied AMAT Chapter 1 truth table', () => {
  assert.deepEqual(finals('P ∨ Q'), [true, true, true, false]);
});

test('material implication matches the supplied AMAT Chapter 1 truth table', () => {
  assert.deepEqual(finals('P → Q'), [true, false, true, true]);
});

test('biconditional matches the supplied AMAT Chapter 1 truth table', () => {
  assert.deepEqual(finals('P ↔ Q'), [true, false, false, true]);
});

test('negation matches the supplied AMAT Chapter 1 truth table', () => {
  assert.deepEqual(finals('∼P'), [false, true]);
});


test('assignment generation refuses unbounded exponential work', () => {
  assert.throws(
    () => generateAssignments(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I']),
    /at most 8 unique symbols/
  );
});
