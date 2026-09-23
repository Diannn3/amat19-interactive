import assert from 'node:assert/strict';
import test from 'node:test';
import { Rational, sumRationals } from '../src/index.ts';

test('Rational parses, reduces, and performs exact arithmetic', () => {
  assert.equal(new Rational(2n,4n).toString(),'1/2');
  assert.equal(Rational.parse('-1.25').toString(),'-5/4');
  assert.equal(Rational.parse('1/3').add('1/6').toString(),'1/2');
  assert.equal(Rational.parse('2/3').pow(-2).toString(),'9/4');
  assert.equal(sumRationals(['1/6','1/3','1/2']).toString(),'1');
});

test('Rational parses decimal exponent notation exactly', () => {
  assert.equal(Rational.parse('1e-7').toString(),'1/10000000');
  assert.equal(Rational.parse('1.25e3').toString(),'1250');
  assert.equal(Rational.parse('-.5E+2').toString(),'-50');
  assert.equal(Rational.parse('5.e-1').toString(),'1/2');
  assert.equal(Rational.from(0.0000001).toString(),'1/10000000');
});

test('Rational decimal formatting uses exact BigInt rounding instead of Number', () => {
  assert.equal(new Rational(1n,3n).toDecimal(6),'0.333333');
  assert.equal(new Rational(2n,3n).toDecimal(6),'0.666667');
  assert.equal(new Rational(-1n,8n).toDecimal(2),'-0.13');
  assert.equal(new Rational(1n,2n).toDecimal(0),'1');
  const huge = new Rational(10n ** 400n + 1n, 10n ** 400n);
  assert.equal(huge.toDecimal(20),'1');
  assert.equal(new Rational(100000000000000000001n, 100000000000000000000n).toDecimal(20),'1.00000000000000000001');
});

test('Rational input budgets reject pathological decimal text and exponent work', () => {
  assert.throws(()=>Rational.parse('1e10001'),/exponent magnitude/i);
  assert.throws(()=>Rational.parse('1'.repeat(10001)),/more than 10000 digits/i);
  assert.throws(()=>Rational.one().pow(10001),/power magnitude/i);
});


test('Rational rejects unsafe JavaScript integers and bounds exact result growth', () => {
  assert.throws(() => Rational.from(Number.MAX_SAFE_INTEGER + 1), /safe JavaScript numeric range/i);
  assert.throws(() => new Rational(Number.MAX_SAFE_INTEGER + 1), /safe integer/i);
  assert.throws(() => new Rational('1'.repeat(10001)), /more than 10000 digits/i);
  const hugeBase = Rational.parse('9'.repeat(10000));
  assert.throws(() => hugeBase.pow(3), /exact rational work budget/i);
  const hugeDenominator = new Rational(1n, 10n ** 15000n);
  assert.throws(() => hugeDenominator.add(hugeDenominator), /exact rational work budget/i);
  assert.equal(Rational.from('9007199254740993').toString(), '9007199254740993');
});
