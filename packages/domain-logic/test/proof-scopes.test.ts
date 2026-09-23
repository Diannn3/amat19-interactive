import assert from 'node:assert/strict';
import test from 'node:test';
import {addScopedProofLine,closeProofScope,createScopedProof,openProofAssumption,scopedProofAvailableReferences,scopedProofComplete} from '../src/index.ts';

test('conditional proof opens the required antecedent and discharges only after the consequent',()=>{
 let state=createScopedProof('conditional',['P -> Q','Q -> R'],'P -> R');
 state=openProofAssumption(state);
 assert.equal(state.lines.at(-1)?.expression,'P');
 assert.throws(()=>openProofAssumption(state),/one method subproof/i);
 state=addScopedProofLine(state,{expression:'Q',ruleId:'MP',references:[1,3]});
 assert.throws(()=>closeProofScope(state),/Derive R/i);
 state=addScopedProofLine(state,{expression:'R',ruleId:'MP',references:[2,4]});
 state=closeProofScope(state);
 assert.equal(state.lines.at(-1)?.ruleId,'CP');
 assert.equal(scopedProofComplete(state),true);
 assert.deepEqual(scopedProofAvailableReferences(state),[1,2,6]);
});

test('conditional proof rejects a preliminary assumption that is not the goal antecedent',()=>{
 const state=createScopedProof('conditional',['P -> Q'],'P -> Q');
 assert.throws(()=>openProofAssumption(state,'Q'),/must be P/i);
});

test('closed subproof lines cannot be cited from the root scope',()=>{
 let state=createScopedProof('conditional',['P -> Q','Q -> R'],'P -> R');
 state=openProofAssumption(state);
 state=addScopedProofLine(state,{expression:'Q',ruleId:'MP',references:[1,3]});
 state=addScopedProofLine(state,{expression:'R',ruleId:'MP',references:[2,4]});
 state=closeProofScope(state);
 state=addScopedProofLine(state,{expression:'R',ruleId:'SP',references:[5]});
 const last=state.lines.at(-1)!;
 assert.equal(last.ok,false);assert.match(last.message,/outside the current proof scope/i);
});

test('indirect proof requires an explicit contradiction before discharge',()=>{
 let state=createScopedProof('indirect',['P -> Q','~Q'],'~P');
 state=openProofAssumption(state);
 state=addScopedProofLine(state,{expression:'P',ruleId:'DN',references:[3]});
 state=addScopedProofLine(state,{expression:'Q',ruleId:'MP',references:[1,4]});
 assert.throws(()=>closeProofScope(state),/explicit contradiction/i);
 state=addScopedProofLine(state,{expression:'Q & ~Q',ruleId:'CJ',references:[5,2]});
 state=closeProofScope(state);
 assert.equal(state.lines.at(-1)?.ruleId,'IP');
 assert.equal(scopedProofComplete(state),true);
});

test('direct proof cannot open a preliminary-assumption scope',()=>{
 const state=createScopedProof('direct',['P'],'P');
 assert.throws(()=>openProofAssumption(state),/Direct proof/i);
});
