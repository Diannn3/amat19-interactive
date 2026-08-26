import { Rational, sumRationals, type RationalLike } from '@amat19/math-core';
export type DiscreteOutcome = { value: Rational; probability: Rational };
export type DistributionAnalysis = {
  outcomes: DiscreteOutcome[];
  expectedValue: Rational;
  secondMoment: Rational;
  variance: Rational;
};
export function analyzeDiscreteDistribution(entries: Array<{ value: RationalLike; probability: RationalLike }>): DistributionAnalysis {
  if (entries.length === 0) throw new RangeError('A distribution needs at least one outcome.');
  const outcomes = entries.map(({value,probability}) => ({value:Rational.from(value), probability:Rational.from(probability)}));
  for (const item of outcomes) if (!item.probability.isProbability()) throw new RangeError('Every probability must be between 0 and 1.');
  const total = sumRationals(outcomes.map(item => item.probability));
  if (!total.equals(1)) throw new RangeError(`Probabilities must sum to 1; the current total is ${total.toString()}.`);
  const expectedValue = sumRationals(outcomes.map(item => item.value.multiply(item.probability)));
  const secondMoment = sumRationals(outcomes.map(item => item.value.multiply(item.value).multiply(item.probability)));
  const variance = secondMoment.subtract(expectedValue.multiply(expectedValue));
  return { outcomes, expectedValue, secondMoment, variance };
}
