import assert from 'node:assert/strict';
import test from 'node:test';
import { createSeededRandom, createSeededUint32, UINT32_RANGE, stableHash } from '../src/index.ts';

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


test('floating seeded RNG is exactly the raw uint32 stream divided by 2^32', () => {
  const floatRandom = createSeededRandom('amat19-grid');
  const uint32Random = createSeededUint32('amat19-grid');
  for (let index = 0; index < 32; index += 1) {
    assert.equal(floatRandom(), uint32Random() / UINT32_RANGE);
  }
});
