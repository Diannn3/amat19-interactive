import assert from 'node:assert/strict';import test from 'node:test';
import {addMatrices,determinant,distribution,distributionAfter,feasibleVertices,inverse,matrix,matrixPower,matrixToStrings,multiplicationCellTrace,multiplyMatrices,rref,simplexMax,solveGraphicalLP,solveLinearSystem,stationaryTwoState,transitionMatrix} from '../src/index.ts';
test('matrix addition and multiplication are exact',()=>{const A=matrix([[1,2],[3,4]]),B=matrix([[2,0],[1,2]]);assert.deepEqual(matrixToStrings(addMatrices(A,B)),[['3','2'],['4','6']]);assert.deepEqual(matrixToStrings(multiplyMatrices(A,B)),[['4','4'],['10','8']]);});
test('multiplication cell trace exposes row by column products',()=>{const t=multiplicationCellTrace(matrix([[1,2]]),matrix([[3],[4]]),0,0);assert.equal(t.value.toString(),'11');assert.deepEqual(t.terms.map(x=>x.product.toString()),['3','8']);});
test('determinant is exact',()=>assert.equal(determinant(matrix([[2,4],[0,-2]])).toString(),'-4'));
test('RREF uses legal row operations and reaches canonical form',()=>{const out=rref(matrix([[1,2,5],[3,4,11]]));assert.deepEqual(matrixToStrings(out.matrix),[['1','0','1'],['0','1','2']]);assert.ok(out.steps.length>0);});
test('inverse by Gauss-Jordan returns exact fractions',()=>{const out=inverse(matrix([[2,4],[0,-2]]));assert.ok(out);assert.deepEqual(matrixToStrings(out!.inverse),[['1/2','1'],['0','-1/2']]);});
test('singular matrix has no inverse',()=>assert.equal(inverse(matrix([[1,2],[2,4]])),null));
test('linear systems classify unique, infinite, and inconsistent cases',()=>{assert.equal(solveLinearSystem(matrix([[1,1,3],[1,-1,1]])).kind,'unique');assert.equal(solveLinearSystem(matrix([[1,1,2],[2,2,4]])).kind,'infinite');assert.equal(solveLinearSystem(matrix([[1,1,2],[1,1,3]])).kind,'inconsistent');});
test('graphical LP finds a bounded optimum',()=>{const constraints=[{a:1,b:1,relation:'<=' as const,c:4},{a:1,b:0,relation:'<=' as const,c:3},{a:0,b:1,relation:'<=' as const,c:2}];const result=solveGraphicalLP(constraints,{x:3,y:2,sense:'max'});assert.equal(result.status,'optimal');assert.equal(result.optima[0]?.value,11);assert.deepEqual(result.optima[0]?.point,{x:3,y:1});});
test('graphical LP detects infeasibility',()=>{const result=solveGraphicalLP([{a:1,b:0,relation:'>=' as const,c:2},{a:1,b:0,relation:'<=' as const,c:1}],{x:1,y:0,sense:'max'});assert.equal(result.status,'infeasible');});
test('graphical LP detects an improving recession direction',()=>{const result=solveGraphicalLP([{a:1,b:-1,relation:'<=' as const,c:1}],{x:1,y:1,sense:'max'});assert.equal(result.status,'unbounded');});
test('simplex trace reaches standard-form optimum',()=>{const result=simplexMax({objective:[3,2],constraints:[{coefficients:[1,1],bound:4},{coefficients:[1,0],bound:3},{coefficients:[0,1],bound:2}]});assert.equal(result.status,'optimal');assert.equal(result.objectiveValue?.toString(),'11');assert.deepEqual(result.solution?.map(v=>v.toString()),['3','1']);assert.ok(result.steps.length>=2);});
test('Markov transition validation and k-step evolution remain exact',()=>{const P=transitionMatrix([['3/4','1/4'],['1/2','1/2']]),d=distribution([1,0]);assert.deepEqual(distributionAfter(d,P,2).map(v=>v.toString()),['11/16','5/16']);assert.deepEqual(stationaryTwoState(P).map(v=>v.toString()),['2/3','1/3']);assert.deepEqual(matrixToStrings(matrixPower(P,0)),[['1','0'],['0','1']]);});

test('graphical LP reports multiple optimal corners on an optimal edge',()=>{
 const result=solveGraphicalLP([{a:1,b:1,relation:'<=' as const,c:4}],{x:1,y:1,sense:'max'});
 assert.equal(result.status,'optimal');assert.equal(result.optima.length,2);assert.match(result.message,/Multiple corner points/i);
 assert.deepEqual(new Set(result.optima.map(item=>`${item.point.x},${item.point.y}`)),new Set(['4,0','0,4']));
});

test('graphical LP tolerates redundant parallel constraints without duplicating vertices',()=>{
 const result=solveGraphicalLP([{a:1,b:1,relation:'<=' as const,c:4},{a:2,b:2,relation:'<=' as const,c:8}],{x:2,y:1,sense:'max'});
 assert.equal(result.status,'optimal');assert.deepEqual(result.optima[0]?.point,{x:4,y:0});
 assert.equal(new Set(result.vertices.map(item=>`${item.point.x},${item.point.y}`)).size,result.vertices.length);
});
