import assert from 'node:assert/strict'; import test from 'node:test';
import {createAttempt,masteryBand,mergeMasteryEvidence,nextHint,reduceAttempt,updateMastery} from '../src/index.ts';
test('attempt reducer records checks, hints, and mastery evidence',()=>{
 let s=createAttempt({attemptId:'a',exerciseId:'e',module:'logic',now:'2026-01-01'});
 s=reduceAttempt(s,{type:'check',at:'2026-01-02',check:{ok:true,scope:{},kind:'correct',message:'ok'}});
 s=reduceAttempt(s,{type:'hint-used',hintId:'h1',at:'2026-01-03'});
 s=reduceAttempt(s,{type:'mastery-evidence',at:'2026-01-04',evidence:{skillId:'logic.truth-values',score:1,reason:'done'}});
 assert.equal(s.finalState,'correct'); assert.deepEqual(s.hintsUsed,['h1']); assert.equal(s.masteryEvidence.length,1);
});
test('hint ladder reveals one unused step at a time',()=>{const p={skillId:'x',steps:[{id:'1',level:'nudge' as const,text:'a'},{id:'2',level:'focus' as const,text:'b'}]};assert.equal(nextHint(p,[])?.id,'1');assert.equal(nextHint(p,['1'])?.id,'2');});
test('mastery requires repeated evidence',()=>{const first=updateMastery({previousScore:0,previousAttempts:0,checks:[{ok:true,scope:{},kind:'correct',message:'ok'}],hintsUsed:0,revealed:false});assert.equal(first.band,'developing');assert.equal(masteryBand(.9,3),'secure');});

test('normalized evidence merges with the same transparent mastery thresholds', () => {
  const one = mergeMasteryEvidence(0, 0, 1);
  assert.equal(one.band, 'developing');
  const two = mergeMasteryEvidence(one.evidenceScore, one.attempts, 1);
  const three = mergeMasteryEvidence(two.evidenceScore, two.attempts, 1);
  assert.equal(three.band, 'secure');
});
