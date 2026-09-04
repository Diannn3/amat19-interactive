import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

const read=(path:string)=>readFile(new URL(`../../${path}`,import.meta.url),'utf8');

test('finance timelines do not silently turn invalid cash-flow values into zero',async()=>{
 const source=await read('apps/web/src/components/workbenches/MoneyTimelineWorkbench.tsx');
 assert.doesNotMatch(source,/Number\.isFinite\(parsed\)\?parsed:0/);
 assert.match(source,/return FinanceDecimal\.from\(raw\)\.toNumber\(\)/);
 assert.match(source,/computed\.result \? \(/);
});

test('annuity, bond, and interest timelines are gated by validated domain results',async()=>{
 const source=await read('apps/web/src/components/workbenches/MoneyTimelineWorkbench.tsx');
 assert.match(source,/if \(scenario === 'annuity'\)/);
 assert.match(source,/const result = annuityValue\(/);
 assert.match(source,/const result = bondPrice\(/);
 assert.match(source,/const result = valueCashflowsAt\(/);
 assert.match(source,/computed\.result && computed\.step && \(/);
 assert.doesNotMatch(source,/principal=\{Number\(principal\)\}/);
});
