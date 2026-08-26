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
