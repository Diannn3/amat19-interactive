import assert from 'node:assert/strict';
import test from 'node:test';
import { simulateBernoulli,
  Rational, analyzeDiscreteDistribution, analyzeTwoWayTable, arrangementsWithRepetition, combinations, combinationsWithRepetition, factorial,
  inclusionExclusion2, makeTwoWayTable, permutations, probabilityFromCounts, recommendCountingMethod
} from '../src/index.ts';

test('Rational reduces and performs exact arithmetic', () => {
  assert.equal(new Rational(2n, 4n).toString(), '1/2');
  assert.equal(Rational.parse('0.125').toString(), '1/8');
  assert.equal(new Rational(1n, 3n).add(new Rational(1n, 6n)).toString(), '1/2');
  assert.equal(new Rational(3n, 5n).multiply(new Rational(10n, 9n)).toString(), '2/3');
});
test('counting functions stay exact with BigInt', () => {
  assert.equal(factorial(0), 1n);
  assert.equal(factorial(20), 2432902008176640000n);
  assert.equal(permutations(5, 3), 60n);
  assert.equal(combinations(20, 2), 190n);
  assert.equal(arrangementsWithRepetition(4, 3), 64n);
  assert.equal(combinationsWithRepetition(4, 3), 20n);
});
test('counting decision helper distinguishes order and repetition', () => {
  assert.equal(recommendCountingMethod({ orderMatters: true, repetitionAllowed: false }).method, 'permutation');
  assert.equal(recommendCountingMethod({ orderMatters: false, repetitionAllowed: false }).method, 'combination');
  assert.equal(recommendCountingMethod({ orderMatters: true, repetitionAllowed: true }).method, 'arrangements-with-repetition');
  assert.equal(recommendCountingMethod({ orderMatters: false, repetitionAllowed: true }).method, 'combination-with-repetition');
});
test('inclusion-exclusion and count probability are exact', () => {
  assert.equal(inclusionExclusion2(12, 9, 4), 17n);
  assert.equal(probabilityFromCounts(4, 20).toString(), '1/5');
});
test('two-way analysis keeps conditioning direction explicit', () => {
  const analysis = analyzeTwoWayTable(makeTwoWayTable({ aAndB: 20, aAndNotB: 30, notAAndB: 10, notAAndNotB: 40 }));
  assert.equal(analysis.total, 100n);
  assert.equal(analysis.pAGivenB?.toString(), '2/3');
  assert.equal(analysis.pBGivenA?.toString(), '2/5');
  assert.equal(analysis.independent, false);
});
test('two-way analysis detects independence exactly', () => {
  const analysis = analyzeTwoWayTable(makeTwoWayTable({ aAndB: 25, aAndNotB: 25, notAAndB: 25, notAAndNotB: 25 }));
  assert.equal(analysis.independent, true);
  assert.equal(analysis.pIntersection.toString(), '1/4');
});


test('discrete distribution returns exact expected value and variance', () => {
  const result = analyzeDiscreteDistribution([
    { value: 0, probability: '1/4' },
    { value: 1, probability: '1/2' },
    { value: 2, probability: '1/4' }
  ]);
  assert.equal(result.expectedValue.toString(), '1');
  assert.equal(result.variance.toString(), '1/2');
});


test('seeded Bernoulli simulation is reproducible and frequency remains a rational count',()=>{const a=simulateBernoulli({seed:'amat19-demo',probability:'1/3',trials:1200});const b=simulateBernoulli({seed:'amat19-demo',probability:'1/3',trials:1200});assert.equal(a.successes,b.successes);assert.equal(a.frequency.toString(),b.frequency.toString());assert.equal(a.checkpoints.at(-1)?.trials,1200);});
