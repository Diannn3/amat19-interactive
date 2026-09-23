import assert from 'node:assert/strict';
import test from 'node:test';
import { LogicParseError, formatLogic, parseLogic, tokenizeLogic } from '../src/index.ts';

test('tokenizer accepts AMAT Unicode symbols and keyboard aliases', () => {
  const kinds = tokenizeLogic('~P & Q | R -> S <-> T').map((token) => token.kind);
  assert.deepEqual(kinds, [
    'not', 'identifier', 'and', 'identifier', 'or', 'identifier', 'implies', 'identifier', 'iff', 'identifier', 'eof'
  ]);

  const unicodeKinds = tokenizeLogic('∼P ∧ Q ∨ R → S ↔ T').map((token) => token.kind);
  assert.deepEqual(unicodeKinds, kinds);
});

test('parser applies NOT > AND > OR > IMPLIES > IFF precedence', () => {
  const ast = parseLogic('~P & Q | R -> S <-> T');
  assert.equal(ast.kind, 'iff');
  if (ast.kind !== 'iff') return;
  assert.equal(ast.left.kind, 'implies');
});

test('implication is right-associative', () => {
  const ast = parseLogic('P -> Q -> R');
  assert.equal(ast.kind, 'implies');
  if (ast.kind !== 'implies') return;
  assert.equal(ast.right.kind, 'implies');
});

test('formatter normalizes keyboard aliases into AMAT Unicode notation', () => {
  assert.equal(formatLogic(parseLogic('~P & Q')), '∼P ∧ Q');
});

test('parser reports unsupported characters with source position', () => {
  assert.throws(
    () => parseLogic('P + Q'),
    (error) => error instanceof LogicParseError && error.code === 'unexpected-character' && error.span.start === 2
  );
});

test('parser reports missing closing parenthesis', () => {
  assert.throws(
    () => parseLogic('(P -> Q'),
    (error) => error instanceof LogicParseError && error.code === 'missing-rparen'
  );
});


test('logic input budgets reject pathological size before recursive parsing', () => {
  assert.throws(
    () => parseLogic('~'.repeat(10_000) + 'P'),
    (error) => error instanceof LogicParseError && error.code === 'expression-too-large'
  );
});

test('logic parser rejects excessive nesting with a controlled error instead of stack overflow', () => {
  const deeplyNested = '~'.repeat(300) + 'P';
  assert.throws(
    () => parseLogic(deeplyNested),
    (error) => error instanceof LogicParseError && error.code === 'expression-too-deep'
  );
});

test('logic tokenizer enforces a token budget independently of character length', () => {
  const manyTokens = Array.from({ length: 1100 }, () => 'P').join(' & ');
  assert.throws(
    () => tokenizeLogic(manyTokens),
    (error) => error instanceof LogicParseError && error.code === 'expression-too-large'
  );
});
