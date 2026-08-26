import assert from 'node:assert/strict';
import test from 'node:test';
import { createSeededRandom, stableHash } from '../src/index.ts';

test('seeded RNG reproduces the same sequence', () => {
  const a = createSeededRandom('amat19');
  const b = createSeededRandom('amat19');
  const valuesA = Array.from({ length: 12 }, () => a());
  const valuesB = Array.from({ length: 12 }, () => b());
  assert.deepEqual(valuesA, valuesB);
});

test('stableHash is deterministic and input-sensitive', () => {
  assert.equal(stableHash('P -> Q'), stableHash('P -> Q'));
  assert.notEqual(stableHash('P -> Q'), stableHash('Q -> P'));
});
