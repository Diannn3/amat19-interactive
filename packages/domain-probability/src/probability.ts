import { Rational } from '@amat19/math-core';
function count(value: bigint | number, label: string): bigint {
  if(typeof value==='number'&&!Number.isSafeInteger(value))throw new RangeError(`${label} must be supplied as a safe integer number or exact bigint.`);
  const v = BigInt(value);
  if (v < 0n) throw new RangeError(`${label} cannot be negative.`);
  return v;
}
export function probabilityFromCounts(favorable: bigint | number, total: bigint | number): Rational {
  const good = count(favorable, 'Favorable count'), all = count(total, 'Total count');
  if (all === 0n) throw new RangeError('A sample space must contain at least one outcome.');
  if (good > all) throw new RangeError('Favorable outcomes cannot exceed the sample-space size.');
  return new Rational(good, all);
}
export function inclusionExclusion2(a: bigint | number, b: bigint | number, intersection: bigint | number): bigint {
  const A = count(a, 'A'), B = count(b, 'B'), I = count(intersection, 'Intersection');
  if (I > A || I > B) throw new RangeError('The intersection cannot exceed either set.');
  return A + B - I;
}
export type TwoWayTable = { aAndB: bigint; aAndNotB: bigint; notAAndB: bigint; notAAndNotB: bigint; };
export function makeTwoWayTable(input: { aAndB: bigint | number; aAndNotB: bigint | number; notAAndB: bigint | number; notAAndNotB: bigint | number; }): TwoWayTable {
  return {
    aAndB: count(input.aAndB, 'A∩B'), aAndNotB: count(input.aAndNotB, 'A∩Bᶜ'),
    notAAndB: count(input.notAAndB, 'Aᶜ∩B'), notAAndNotB: count(input.notAAndNotB, 'Aᶜ∩Bᶜ')
  };
}
export type TwoWayAnalysis = {
  total: bigint; countA: bigint; countB: bigint; intersection: bigint;
  pA: Rational; pB: Rational; pIntersection: Rational;
  pAGivenB: Rational | null; pBGivenA: Rational | null; independent: boolean;
};
export function analyzeTwoWayTable(table: TwoWayTable): TwoWayAnalysis {
  const total = table.aAndB + table.aAndNotB + table.notAAndB + table.notAAndNotB;
  if (total === 0n) throw new RangeError('The table must contain at least one observation.');
  const countA = table.aAndB + table.aAndNotB, countB = table.aAndB + table.notAAndB;
  const pA = new Rational(countA, total), pB = new Rational(countB, total), pIntersection = new Rational(table.aAndB, total);
  return {
    total, countA, countB, intersection: table.aAndB, pA, pB, pIntersection,
    pAGivenB: countB === 0n ? null : new Rational(table.aAndB, countB),
    pBGivenA: countA === 0n ? null : new Rational(table.aAndB, countA),
    independent: pIntersection.equals(pA.multiply(pB))
  };
}
export function conditionalProbability(intersection: Rational, given: Rational): Rational {
  if (!intersection.isProbability() || !given.isProbability()) throw new RangeError('Conditional-probability inputs must lie between 0 and 1.');
  if (given.numerator === 0n) throw new RangeError('Conditional probability is undefined when the conditioning event has probability 0.');
  if (intersection.compare(given) > 0) throw new RangeError('An intersection probability cannot exceed the conditioning-event probability.');
  return intersection.divide(given);
}
export function validateJointProbabilities(pA: Rational, pB: Rational, pIntersection: Rational): void {
  if (![pA, pB, pIntersection].every((p) => p.isProbability())) throw new RangeError('Probabilities must lie between 0 and 1.');
  const lower=pA.add(pB).subtract(1).compare(0)>0?pA.add(pB).subtract(1):Rational.zero();
  const upper=pA.compare(pB)<0?pA:pB;
  if(pIntersection.compare(lower)<0||pIntersection.compare(upper)>0)throw new RangeError(`The intersection must satisfy ${lower.toString()} ≤ P(A∩B) ≤ ${upper.toString()} for the supplied marginals.`);
}
export function areIndependent(pA: Rational, pB: Rational, pIntersection: Rational): boolean {
  validateJointProbabilities(pA,pB,pIntersection);
  return pIntersection.equals(pA.multiply(pB));
}

/** Approximate Wilson score interval for independent Bernoulli observations. */
export function wilsonProportionInterval(successes: number, sampleSize: number, confidenceLevel: 90 | 95 | 99) {
  if (!Number.isSafeInteger(sampleSize) || sampleSize < 1 || sampleSize > 1_000_000) throw new RangeError('Sample size must be a whole number from 1 to 1,000,000.');
  if (!Number.isSafeInteger(successes) || successes < 0 || successes > sampleSize) throw new RangeError('Successes must be a whole number from 0 to the sample size.');
  const critical = { 90: 1.6448536269514722, 95: 1.959963984540054, 99: 2.5758293035489004 }[confidenceLevel];
  if (!critical) throw new RangeError('Choose a 90%, 95%, or 99% confidence level.');
  const sampleProportion = new Rational(successes, sampleSize);
  const observed = successes / sampleSize;
  const zSquared = critical * critical;
  const denominator = 1 + zSquared / sampleSize;
  const center = (observed + zSquared / (2 * sampleSize)) / denominator;
  const halfWidth = critical * Math.sqrt(observed * (1 - observed) / sampleSize + zSquared / (4 * sampleSize * sampleSize)) / denominator;
  return { sampleProportion, lower: successes === 0 ? 0 : Math.max(0, center - halfWidth), upper: successes === sampleSize ? 1 : Math.min(1, center + halfWidth), confidenceLevel, method: 'Wilson score interval' as const };
}
