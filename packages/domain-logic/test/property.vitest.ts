import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { buildTruthTable, checkEquivalence } from '../src/index.ts';

const atomArb = fc.constantFrom('P', 'Q', 'R', 'S');
const expressionArb = fc.letrec((tie) => ({
  expr: fc.oneof(
    { depthSize: 'small', maxDepth: 3 },
    atomArb,
    tie('expr').map((value) => `~(${value})`),
    fc.tuple(tie('expr'), fc.constantFrom('&', '|', '->', '<->'), tie('expr'))
      .map(([left, operator, right]) => `(${left} ${operator} ${right})`)
  )
})).expr as fc.Arbitrary<string>;

describe('propositional properties', () => {
  it('double negation preserves every generated proposition', () => {
    fc.assert(fc.property(expressionArb, (expression) => {
      expect(checkEquivalence(expression, `~~(${expression})`).equivalent).toBe(true);
    }), { numRuns: 150 });
  });

  it('row count is exactly 2^n for generated propositions', () => {
    fc.assert(fc.property(expressionArb, (expression) => {
      const table = buildTruthTable(expression);
      expect(table.rows).toHaveLength(2 ** table.symbols.length);
    }), { numRuns: 150 });
  });
});
