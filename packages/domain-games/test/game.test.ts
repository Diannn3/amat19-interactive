import assert from 'node:assert/strict';import test from 'node:test';import {columnMaxima,maximin,minimax,payoffMatrix,saddlePoints,solveZeroSum2x2,strictlyDominatedColumns,strictlyDominatedRows} from '../src/index.ts';
test('pure saddle point satisfies maximin = minimax',()=>{const A=payoffMatrix([[3,1],[4,2]]);assert.equal(maximin(A).toString(),'2');assert.equal(minimax(A).toString(),'2');assert.deepEqual(saddlePoints(A).map(s=>[s.row,s.col,s.value.toString()]),[[1,1,'2']]);});
test('strict dominance is detected from each player perspective',()=>{const A=payoffMatrix([[1,2],[3,4]]);assert.deepEqual(strictlyDominatedRows(A),[{dominated:0,by:1}]);assert.deepEqual(strictlyDominatedColumns(A),[{dominated:1,by:0}]);});
test('matching-pennies style game has exact mixed equilibrium',()=>{const A=payoffMatrix([[1,-1],[-1,1]]);const out=solveZeroSum2x2(A);assert.equal(out.kind,'mixed');if(out.kind==='mixed'){assert.equal(out.pRow1.toString(),'1/2');assert.equal(out.qCol1.toString(),'1/2');assert.equal(out.value.toString(),'0');}});
test('row and column security values differ when no pure saddle exists',()=>{const A=payoffMatrix([[4,0],[1,3]]);assert.ok(maximin(A).compare(minimax(A))<0);assert.equal(saddlePoints(A).length,0);});


test('game domain bounds strategy counts and payoff literal size',()=>{
 assert.throws(()=>payoffMatrix(Array.from({length:13},()=>['1','2'])),/cannot exceed 12 strategies/i);
 assert.throws(()=>payoffMatrix([['9'.repeat(129),'0'],['0','1']]),/literal cannot exceed 128/i);
});
