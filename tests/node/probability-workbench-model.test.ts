import assert from 'node:assert/strict';
import test from 'node:test';
import { coinMappingDistribution, resolveProbabilityView } from '../../apps/web/src/components/workbenches/probability-model.ts';

test('canonical view query overrides persisted view and legacy mode links remain usable', () => {
  assert.equal(resolveProbabilityView('?view=distribution', 'conditional'), 'distribution');
  assert.equal(resolveProbabilityView('?view=random-variable', 'inference'), 'random-variable');
  assert.equal(resolveProbabilityView('?mode=conditioning', 'inference'), 'conditional');
  assert.equal(resolveProbabilityView('', 'inference'), 'inference');
});

test('two-coin outcome mappings aggregate equal values into one exact PMF', () => {
  const result = coinMappingDistribution(['0', '1', '1', '2']);
  assert.deepEqual(result.outcomes.map((row) => [row.value.toString(), row.probability.toString()]), [['0', '1/4'], ['1', '1/2'], ['2', '1/4']]);
  assert.equal(result.expectedValue.toString(), '1');
  assert.equal(result.variance.toString(), '1/2');
});
