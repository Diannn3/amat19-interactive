import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { Rational, combinations, probabilityFromCounts } from '../src/index.ts';

describe('exact probability properties', () => {
  it('combination counts are symmetric', () => {
    fc.assert(fc.property(
      fc.integer({ min: 0, max: 70 }),
      fc.integer({ min: 0, max: 70 }),
      (n, rawR) => {
        const r = n === 0 ? 0 : rawR % (n + 1);
        expect(combinations(n, r)).toBe(combinations(n, n - r));
      }
    ), { numRuns: 200 });
  });

  it('Pascal identity holds exactly', () => {
    fc.assert(fc.property(
      fc.integer({ min: 2, max: 60 }),
      fc.integer({ min: 1, max: 59 }),
      (n, rawR) => {
        const r = 1 + (rawR % (n - 1));
        expect(combinations(n, r)).toBe(combinations(n - 1, r - 1) + combinations(n - 1, r));
      }
    ), { numRuns: 200 });
  });

  it('count-based probabilities stay inside [0,1]', () => {
    fc.assert(fc.property(
      fc.integer({ min: 1, max: 100000 }),
      fc.integer({ min: 0, max: 100000 }),
      (total, rawFavorable) => {
        const favorable = rawFavorable % (total + 1);
        const p = probabilityFromCounts(favorable, total);
        expect(p.compare(new Rational(0n))).toBeGreaterThanOrEqual(0);
        expect(p.compare(new Rational(1n))).toBeLessThanOrEqual(0);
      }
    ), { numRuns: 250 });
  });
});
