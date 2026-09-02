import assert from 'node:assert/strict';import test from 'node:test';
import { buildTruthTable, parseLogic } from '@amat19/domain-logic';
import { argumentProblemFingerprint, canonicalLogicExpression, truthTableProblemFingerprint } from '../../apps/web/src/lib/problem-fingerprint.ts';

test('logic fingerprints collapse whitespace and keyboard/unicode aliases',()=>{
 assert.equal(canonicalLogicExpression('P->Q'),canonicalLogicExpression(' P → Q '));
 const a=buildTruthTable('P->Q'),b=buildTruthTable(' P → Q ');
 assert.equal(truthTableProblemFingerprint(a,'classify'),truthTableProblemFingerprint(b,'classify'));
 assert.equal(truthTableProblemFingerprint(a,'practice',a.columns.at(-1)!.id),truthTableProblemFingerprint(b,'practice',b.columns.at(-1)!.id));
});

test('argument fingerprints normalize each proposition while retaining premise order',()=>{
 const a=argumentProblemFingerprint([parseLogic('P->Q'),parseLogic('P')],parseLogic('Q'));
 const b=argumentProblemFingerprint([parseLogic(' P → Q '),parseLogic('P')],parseLogic(' Q '));
 assert.equal(a,b);
 const reordered=argumentProblemFingerprint([parseLogic('P'),parseLogic('P->Q')],parseLogic('Q'));
 assert.notEqual(a,reordered);
});
