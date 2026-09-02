import assert from 'node:assert/strict';
import test from 'node:test';
import { parseNonnegativeIntegerInput, parsePositiveIntegerList } from '../../apps/web/src/lib/integer-input.ts';

test('nonnegative integer input distinguishes valid, incomplete, and invalid text without coercion',()=>{
 assert.deepEqual(parseNonnegativeIntegerInput('12'),{status:'valid',raw:'12',value:12});
 assert.equal(parseNonnegativeIntegerInput('').status,'incomplete');
 for(const raw of ['2.9','-1','1e3','abc','+2'])assert.equal(parseNonnegativeIntegerInput(raw).status,'invalid',raw);
});

test('nonnegative integer input enforces positive and maximum policies',()=>{
 assert.equal(parseNonnegativeIntegerInput('0',{positive:true}).status,'invalid');
 assert.equal(parseNonnegativeIntegerInput('10',{max:10}).status,'valid');
 assert.equal(parseNonnegativeIntegerInput('11',{max:10}).status,'invalid');
});


test('positive integer list rejects decimal/exponent references instead of silently dropping them',()=>{
 assert.deepEqual(parsePositiveIntegerList('1, 2, 10'),{status:'valid',raw:'1, 2, 10',value:[1,2,10]});
 assert.equal(parsePositiveIntegerList('1, 2.5').status,'invalid');
 assert.equal(parsePositiveIntegerList('1e2, 3').status,'invalid');
 assert.equal(parsePositiveIntegerList('0').status,'invalid');
 assert.deepEqual(parsePositiveIntegerList(''),{status:'valid',raw:'',value:[]});
});
