import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildTruthTable,
  checkArgumentValidity,
  checkEquivalence,
  evaluateLogic,
  parseLogic
} from '../src/index.ts';

test('classifies tautology, contradiction, and contingent formulas', () => {
  assert.equal(buildTruthTable('P | ~P').classification, 'tautology');
  assert.equal(buildTruthTable('P & ~P').classification, 'contradiction');
  assert.equal(buildTruthTable('P -> Q').classification, 'contingent');
});

test('contrapositive equivalence succeeds', () => {
  assert.deepEqual(checkEquivalence('P -> Q', '~Q -> ~P'), {
    equivalent: true,
    symbols: ['P', 'Q']
  });
});

test('converse is not generally equivalent and returns a counterexample', () => {
  const result = checkEquivalence('P -> Q', 'Q -> P');
  assert.equal(result.equivalent, false);
  assert.ok(result.counterexample);
});

test('modus ponens is valid', () => {
  const result = checkArgumentValidity(['P -> Q', 'P'], 'Q');
  assert.equal(result.valid, true);
  assert.deepEqual(result.counterexamples, []);
});

test('affirming the consequent is invalid with counterexample', () => {
  const result = checkArgumentValidity(['P -> Q', 'Q'], 'P');
  assert.equal(result.valid, false);
  assert.ok(result.counterexamples.length > 0);
  assert.ok(result.counterexamples.every((row) => row.Q === true && row.P === false));
});

test('evaluation emits a trace for every AST node', () => {
  const ast = parseLogic('P -> Q');
  const result = evaluateLogic(ast, { P: true, Q: false });
  assert.equal(result.value, false);
  assert.equal(result.byNodeId[ast.id]?.value, false);
  assert.match(result.byNodeId[ast.id]?.explanation ?? '', /antecedent is true/i);
});

test('multi-premise valid argument has no counterexample', () => {
  const result = checkArgumentValidity(['A -> B', 'A | C'], 'B | C');
  assert.equal(result.valid, true);
  assert.deepEqual(result.counterexamples, []);
});
