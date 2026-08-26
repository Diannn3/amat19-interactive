import assert from 'node:assert/strict';
import test from 'node:test';
import { buildTruthTable, checkEquivalence } from '../src/index.ts';

const atoms = ['P', 'Q', 'R'];
const binaries = ['&', '|', '->', '<->'];

function expressions(depth: number): string[] {
  if (depth === 0) return [...atoms, ...atoms.map((atom) => `~${atom}`)];
  const previous = expressions(depth - 1).slice(0, 6);
  const generated: string[] = [...previous];
  for (let i = 0; i < previous.length; i += 1) {
    const left = previous[i]!;
    const right = previous[(i + 1) % previous.length]!;
    generated.push(`(${left} ${binaries[i % binaries.length]} ${right})`);
  }
  return generated;
}

test('every n-symbol truth table has exactly 2^n rows', () => {
  for (const expression of expressions(3)) {
    const table = buildTruthTable(expression);
    assert.equal(table.rows.length, 2 ** table.symbols.length, expression);
  }
});

test('double negation is equivalent across generated expressions', () => {
  for (const expression of expressions(2)) {
    assert.equal(checkEquivalence(expression, `~~(${expression})`).equivalent, true, expression);
  }
});

test('commutativity holds for AND and OR over generated formulas', () => {
  const samples = expressions(1).slice(0, 8);
  for (let i = 0; i < samples.length - 1; i += 1) {
    const a = samples[i]!;
    const b = samples[i + 1]!;
    assert.equal(checkEquivalence(`(${a}) & (${b})`, `(${b}) & (${a})`).equivalent, true);
    assert.equal(checkEquivalence(`(${a}) | (${b})`, `(${b}) | (${a})`).equivalent, true);
  }
});
