import assert from 'node:assert/strict';
import test from 'node:test';
import { checkMoneyStep } from '../../apps/web/src/lib/money-step-feedback.ts';

const step = { amount: '2500', time: '3', focalDate: '0', rate: '0.05' };

test('cash-flow feedback accepts the course decimal result rounded to cents', () => {
  assert.equal(checkMoneyStep(step, { exponent: '-3', value: '2159.59' }).status, 'correct');
  assert.equal(checkMoneyStep(step, { exponent: '-3', value: '2159.59399632869' }).status, 'correct');
});

test('cash-flow feedback distinguishes invalid input, direction, sign, and arithmetic', () => {
  assert.deepEqual(checkMoneyStep(step, { exponent: '', value: '2159.59' }).code, 'invalid-exponent');
  assert.equal(checkMoneyStep(step, { exponent: '3', value: '2894.0625' }).code, 'time-shift');
  assert.equal(checkMoneyStep(step, { exponent: '-3', value: '' }).code, 'invalid-value');
  assert.equal(checkMoneyStep(step, { exponent: '-3', value: '-2159.59' }).code, 'cash-flow-sign');
  assert.equal(checkMoneyStep(step, { exponent: '-3', value: '2894.06' }).code, 'arithmetic');
  assert.equal(checkMoneyStep(step, { exponent: '-3', value: '2159.60' }).code, 'arithmetic');
});

test('cash-flow feedback respects negative, zero-rate, and fractional-time models', () => {
  assert.equal(checkMoneyStep({ amount: '-2000', time: '0', focalDate: '2', rate: '0.05' }, { exponent: '2', value: '-2205' }).status, 'correct');
  assert.equal(checkMoneyStep({ amount: '100', time: '1', focalDate: '3', rate: '0' }, { exponent: '2', value: '100' }).status, 'correct');
  assert.equal(checkMoneyStep({ amount: '100', time: '0', focalDate: '0.5', rate: '0.21' }, { exponent: '0.5', value: '110' }).status, 'correct');
});

test('decimal grading does not lose cents beyond the safe JavaScript integer range', () => {
  const large = { amount: '9007199254740993.01', time: '0', focalDate: '0', rate: '0' };
  assert.equal(checkMoneyStep(large, { exponent: '0', value: '9007199254740993.01' }).status, 'correct');
  assert.equal(checkMoneyStep(large, { exponent: '0', value: '9007199254740993.02' }).code, 'arithmetic');
});

test('invalid models are not reported as learner arithmetic mistakes', () => {
  assert.equal(checkMoneyStep({ ...step, rate: '-1' }, { exponent: '-3', value: '0' }).status, 'model-error');
  assert.equal(checkMoneyStep({ ...step, time: 'oops' }, { exponent: '-3', value: '0' }).status, 'model-error');
});
