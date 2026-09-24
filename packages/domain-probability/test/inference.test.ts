import assert from 'node:assert/strict';
import test from 'node:test';
import * as probability from '../src/index.ts';

test('Wilson interval uses the observed sample proportion and stays inside probability bounds', () => {
  const result = probability.wilsonProportionInterval(40, 100, 95);
  assert.equal(result.sampleProportion.toString(), '2/5');
  assert.equal(result.method, 'Wilson score interval');
  assert.ok(Math.abs(result.lower - 0.3094) < 0.001);
  assert.ok(Math.abs(result.upper - 0.4980) < 0.001);
});

test('Wilson interval rejects invalid samples and preserves bounded all-success results', () => {
  assert.throws(() => probability.wilsonProportionInterval(3, 2, 95), /successes/i);
  assert.throws(() => probability.wilsonProportionInterval(0, 0, 95), /sample size/i);
  assert.throws(() => probability.wilsonProportionInterval(2, 10, 97 as 95), /confidence level/i);
  const result = probability.wilsonProportionInterval(10, 10, 95);
  assert.equal(result.upper, 1);
  assert.ok(result.lower > 0 && result.lower < 1);
});
