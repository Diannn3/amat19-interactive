import { Rational, sumRationals, type RationalLike } from '@amat19/math-core';
export type DiscreteOutcome = { value: Rational; probability: Rational };
export type DistributionAnalysis = {
  outcomes: DiscreteOutcome[];
  expectedValue: Rational;
  secondMoment: Rational;
  variance: Rational;
};

export function canonicalizeDiscreteOutcomes(entries:Array<{value:RationalLike;probability:RationalLike}>):DiscreteOutcome[]{
 if(entries.length===0)throw new RangeError('A distribution needs at least one outcome.');
 const grouped=new Map<string,DiscreteOutcome>();
 for(const entry of entries){const value=Rational.from(entry.value),probability=Rational.from(entry.probability);if(!probability.isProbability())throw new RangeError('Every probability must be between 0 and 1.');const key=value.toString(),previous=grouped.get(key);grouped.set(key,{value,probability:previous?previous.probability.add(probability):probability});}
 return [...grouped.values()].sort((a,b)=>a.value.compare(b.value));
}
export function analyzeDiscreteDistribution(entries: Array<{ value: RationalLike; probability: RationalLike }>): DistributionAnalysis {
  const outcomes=canonicalizeDiscreteOutcomes(entries);
  const total = sumRationals(outcomes.map(item => item.probability));
  if (!total.equals(1)) throw new RangeError(`Probabilities must sum to 1; the current total is ${total.toString()}.`);
  const expectedValue = sumRationals(outcomes.map(item => item.value.multiply(item.probability)));
  const secondMoment = sumRationals(outcomes.map(item => item.value.multiply(item.value).multiply(item.probability)));
  const variance = secondMoment.subtract(expectedValue.multiply(expectedValue));
  return { outcomes, expectedValue, secondMoment, variance };
}

/** Exact finite Binomial(n,p) distribution for moderate educational n. */
export function binomialDistribution(n:number,p:RationalLike):DistributionAnalysis{
 if(!Number.isInteger(n)||n<0||n>200)throw new RangeError('Binomial n must be an integer from 0 to 200.');
 const probability=Rational.from(p);if(!probability.isProbability())throw new RangeError('Binomial p must lie between 0 and 1.');
 const complement=Rational.one().subtract(probability);
 const choose=(nn:number,rr:number)=>{const k=Math.min(rr,nn-rr);let out=1n;for(let i=1;i<=k;i++)out=out*BigInt(nn-k+i)/BigInt(i);return out;};
 return analyzeDiscreteDistribution(Array.from({length:n+1},(_,k)=>({value:k,probability:new Rational(choose(n,k)).multiply(probability.pow(k)).multiply(complement.pow(n-k))})));
}
export function distributionCdf(analysis:DistributionAnalysis):Array<{value:Rational;probability:Rational;cumulative:Rational}>{
 let cumulative=Rational.zero();return analysis.outcomes.map(outcome=>{cumulative=cumulative.add(outcome.probability);return{...outcome,cumulative};});
}
