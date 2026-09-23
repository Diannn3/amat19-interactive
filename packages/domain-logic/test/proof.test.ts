import assert from 'node:assert/strict';
import test from 'node:test';
import { checkEquivalenceRewrite, checkInference, parseLogic, proofReachesConclusion, validateProofLine, type CheckedProofLine } from '../src/index.ts';
test('equivalence rules validate exact one-step rewrites', () => {
  assert.equal(checkEquivalenceRewrite('~(P | Q)', '~P & ~Q', 'DM').ok, true);
  assert.equal(checkEquivalenceRewrite('P -> Q', '~P | Q', 'MI').ok, true);
  assert.equal(checkEquivalenceRewrite('P -> Q', '~Q -> ~P', 'TR').ok, true);
  assert.equal(checkEquivalenceRewrite('P', '~~P', 'DN').ok, true);
  assert.equal(checkEquivalenceRewrite('P & (Q | R)', '(P & Q) | (P & R)', 'DP').ok, true);
});
test('equivalent but wrong-rule rewrite is rejected', () => {
  const result = checkEquivalenceRewrite('P -> Q', '~Q -> ~P', 'MI');
  assert.equal(result.ok, false); assert.match(result.message, /equivalent/i);
});
test('core inference rules validate AMAT-shaped steps', () => {
  assert.equal(checkInference('MP',[parseLogic('P -> Q'),parseLogic('P')],parseLogic('Q')).ok,true);
  assert.equal(checkInference('MT',[parseLogic('P -> Q'),parseLogic('~Q')],parseLogic('~P')).ok,true);
  assert.equal(checkInference('DS',[parseLogic('P | Q'),parseLogic('~P')],parseLogic('Q')).ok,true);
  assert.equal(checkInference('HS',[parseLogic('P -> Q'),parseLogic('Q -> R')],parseLogic('P -> R')).ok,true);
});
test('proof lines reject forward references and accept a short derivation', () => {
  const lines:CheckedProofLine[]=[];
  lines.push(validateProofLine(lines,{expression:'P -> Q',ruleId:'Premise',references:[]}));
  lines.push(validateProofLine(lines,{expression:'P',ruleId:'Premise',references:[]}));
  lines.push(validateProofLine(lines,{expression:'Q',ruleId:'MP',references:[1,2]}));
  assert.equal(lines.every(l=>l.ok),true); assert.equal(proofReachesConclusion(lines,'Q'),true);
  assert.equal(validateProofLine(lines,{expression:'Q',ruleId:'MP',references:[1,9]}).ok,false);
});
test('simplification can choose either conjunct', () => {
  assert.equal(checkInference('SP',[parseLogic('P & Q')],parseLogic('P')).ok,true);
  assert.equal(checkInference('SP',[parseLogic('P & Q')],parseLogic('Q')).ok,true);
});
