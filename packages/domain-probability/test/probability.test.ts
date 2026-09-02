import assert from 'node:assert/strict';
import test from 'node:test';
import {
  Rational, analyzeBinaryBayes, analyzeDiscreteDistribution, analyzeTwoWayTable, arrangementsWithRepetition, binomialDistribution,
  combinations, combinationsWithRepetition, distributionCdf, factorial, inclusionExclusion2, makeTwoWayTable, permutations,
  advanceBernoulliTrials, areIndependent, bernoulliUint32Threshold, conditionalProbability, probabilityFromCounts, recommendCountingMethod, simulateBernoulli, totalProbability, validateProbabilityTree
} from '../src/index.ts';

test('Rational reduces and performs exact arithmetic', () => {
  assert.equal(new Rational(2n, 4n).toString(), '1/2');
  assert.equal(Rational.parse('0.125').toString(), '1/8');
  assert.equal(new Rational(1n, 3n).add(new Rational(1n, 6n)).toString(), '1/2');
  assert.equal(new Rational(3n, 5n).multiply(new Rational(10n, 9n)).toString(), '2/3');
});
test('counting functions stay exact with BigInt', () => {
  assert.equal(factorial(0), 1n);assert.equal(factorial(20), 2432902008176640000n);assert.equal(permutations(5, 3), 60n);assert.equal(combinations(20, 2), 190n);assert.equal(arrangementsWithRepetition(4, 3), 64n);assert.equal(combinationsWithRepetition(4, 3), 20n);
});
test('counting decision helper distinguishes order and repetition', () => {
  assert.equal(recommendCountingMethod({ orderMatters: true, repetitionAllowed: false }).method, 'permutation');assert.equal(recommendCountingMethod({ orderMatters: false, repetitionAllowed: false }).method, 'combination');assert.equal(recommendCountingMethod({ orderMatters: true, repetitionAllowed: true }).method, 'arrangements-with-repetition');assert.equal(recommendCountingMethod({ orderMatters: false, repetitionAllowed: true }).method, 'combination-with-repetition');
});
test('inclusion-exclusion and count probability are exact', () => {assert.equal(inclusionExclusion2(12, 9, 4), 17n);assert.equal(probabilityFromCounts(4, 20).toString(), '1/5');});
test('two-way analysis keeps conditioning direction explicit', () => {const analysis = analyzeTwoWayTable(makeTwoWayTable({ aAndB: 20, aAndNotB: 30, notAAndB: 10, notAAndNotB: 40 }));assert.equal(analysis.total, 100n);assert.equal(analysis.pAGivenB?.toString(), '2/3');assert.equal(analysis.pBGivenA?.toString(), '2/5');assert.equal(analysis.independent, false);});
test('two-way analysis detects independence exactly', () => {const analysis = analyzeTwoWayTable(makeTwoWayTable({ aAndB: 25, aAndNotB: 25, notAAndB: 25, notAAndNotB: 25 }));assert.equal(analysis.independent, true);assert.equal(analysis.pIntersection.toString(), '1/4');});

test('discrete distribution returns exact expected value and variance', () => {const result = analyzeDiscreteDistribution([{ value: 0, probability: '1/4' },{ value: 1, probability: '1/2' },{ value: 2, probability: '1/4' }]);assert.equal(result.expectedValue.toString(), '1');assert.equal(result.variance.toString(), '1/2');});

test('CDF orders outcomes by random-variable value before accumulating',()=>{
 const analysis=analyzeDiscreteDistribution([{value:2,probability:'1/4'},{value:0,probability:'1/4'},{value:1,probability:'1/2'}]);
 const cdf=distributionCdf(analysis);
 assert.deepEqual(cdf.map(item=>[item.value.toString(),item.cumulative.toString()]),[['0','1/4'],['1','3/4'],['2','1']]);
});

test('binary Bayes and total probability preserve exact identities',()=>{
 const result=analyzeBinaryBayes({priorA:'1/5',positiveGivenA:'4/5',positiveGivenNotA:'1/10'});
 assert.equal(result.positive.toString(),'6/25');assert.equal(result.posteriorAGivenPositive.toString(),'2/3');
 assert.equal(totalProbability([{prior:'1/5',likelihood:'4/5'},{prior:'4/5',likelihood:'1/10'}]).toString(),'6/25');
 assert.throws(()=>totalProbability([{prior:'1/2',likelihood:'1/2'},{prior:'1/4',likelihood:'1/2'}]),/sum exactly to 1/i);
 assert.throws(()=>totalProbability([]),/at least one/i);
});

test('exact Binomial distribution has total mass 1 and textbook moments',()=>{
 const result=binomialDistribution(4,'1/2');
 assert.equal(result.outcomes.reduce((sum,item)=>sum.add(item.probability),Rational.zero()).toString(),'1');
 assert.equal(result.expectedValue.toString(),'2');
 assert.equal(result.variance.toString(),'1');
});

test('seeded Bernoulli simulation is reproducible and frequency remains a rational count',()=>{const a=simulateBernoulli({seed:'amat19-demo',probability:'1/3',trials:1200});const b=simulateBernoulli({seed:'amat19-demo',probability:'1/3',trials:1200});assert.equal(a.successes,b.successes);assert.equal(a.frequency.toString(),b.frequency.toString());assert.equal(a.checkpoints.at(-1)?.trials,1200);});

test('counting domain enforces an operation budget before expensive BigInt work', () => {
  assert.throws(() => factorial(10001), /interactive counting limit/i);
  assert.throws(() => permutations(10001, 1), /interactive counting limit/i);
  assert.throws(() => arrangementsWithRepetition(2, 10001), /interactive counting limit/i);
  assert.throws(() => combinationsWithRepetition(6000, 6000), /transformed n/i);
});


test('duplicate discrete support values are canonicalized before moments and CDF', () => {
  const result = analyzeDiscreteDistribution([
    { value: 1, probability: '1/4' },
    { value: '1.0', probability: '1/4' },
    { value: 2, probability: '1/2' }
  ]);
  assert.equal(result.outcomes.length, 2);
  assert.deepEqual(result.outcomes.map((item) => [item.value.toString(), item.probability.toString()]), [['1', '1/2'], ['2', '1/2']]);
  assert.equal(result.expectedValue.toString(), '3/2');
  assert.equal(result.variance.toString(), '1/4');
  const cdf = distributionCdf(result);
  assert.deepEqual(cdf.map((item) => [item.value.toString(), item.cumulative.toString()]), [['1', '1/2'], ['2', '1']]);
  for (let index = 1; index < cdf.length; index += 1) assert.ok(cdf[index]!.cumulative.compare(cdf[index - 1]!.cumulative) >= 0);
  assert.equal(cdf.at(-1)?.cumulative.toString(), '1');
});

test('conditional and independence APIs reject impossible probability models', () => {
  assert.throws(() => conditionalProbability(new Rational(3n, 4n), new Rational(1n, 2n)), /cannot exceed/i);
  assert.throws(() => areIndependent(new Rational(9n, 10n), new Rational(9n, 10n), new Rational(1n, 10n)), /intersection must satisfy/i);
  assert.throws(() => areIndependent(new Rational(1n, 4n), new Rational(1n, 2n), new Rational(3n, 8n)), /intersection must satisfy/i);
  assert.equal(areIndependent(new Rational(1n, 2n), new Rational(1n, 2n), new Rational(1n, 4n)), true);
});

test('Bernoulli thresholds are exact on the uint32 RNG grid', () => {
  assert.equal(bernoulliUint32Threshold(0), 0);
  assert.equal(bernoulliUint32Threshold(1), 4294967296);
  assert.equal(bernoulliUint32Threshold('1/2'), 2147483648);
  assert.equal(bernoulliUint32Threshold('1/3'), 1431655765);
  const threshold = bernoulliUint32Threshold('1/2');
  const samples = [threshold - 1, threshold, 0, 4294967295];
  let index = 0;
  const successes = advanceBernoulliTrials({ randomUint32: () => samples[index++]!, threshold, trials: samples.length });
  assert.equal(successes, 2, 'only raw uint32 samples strictly below the exact threshold succeed');
});


test('count-based probability APIs reject unsafe JS integers instead of treating rounded numbers as exact',()=>{
 assert.throws(()=>probabilityFromCounts(Number.MAX_SAFE_INTEGER+1,Number.MAX_SAFE_INTEGER+2),/safe integer/i);
});

test('probability trees enforce explicit node and nesting budgets',()=>{
 let branch:any={id:'leaf',label:'leaf',probability:'1'};for(let i=0;i<33;i++)branch={id:`n${i}`,label:`n${i}`,probability:'1',children:[branch]};
 assert.throws(()=>validateProbabilityTree([branch]),/depth 32/i);
 const wide=Array.from({length:4097},(_,i)=>({id:String(i),label:String(i),probability:i===0?'1':'0'}));
 assert.throws(()=>validateProbabilityTree(wide),/4,096 nodes/i);
});
