import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

const read=(path:string)=>readFile(new URL(`../../${path}`,import.meta.url),'utf8');

test('finance timelines do not silently turn invalid cash-flow values into zero',async()=>{
 const source=await read('apps/web/src/components/labs/finance/CashflowTimelineLab.tsx');
 assert.doesNotMatch(source,/Number\.isFinite\(parsed\)\?parsed:0/);
 assert.match(source,/if\(!result\.value\)return undefined/);
 assert.match(source,/FinanceDecimal\.from\(flow\.time\)/);
});

test('annuity, bond, and interest timelines are gated by validated domain results',async()=>{
 const [annuity,bond,interest]=await Promise.all([read('apps/web/src/components/labs/finance/AnnuityLab.tsx'),read('apps/web/src/components/labs/finance/BondLab.tsx'),read('apps/web/src/components/labs/finance/InterestLab.tsx')]);
 assert.match(annuity,/result\.value\?<AnnuityTimeline/);
 assert.match(bond,/result\.value\?<BondTimeline/);
 assert.match(interest,/timelineModel&&result\.main\?<FinanceTimeline/);
 assert.doesNotMatch(interest,/principal=\{Number\(principal\)\}/);
});
