import assert from 'node:assert/strict';import test from 'node:test';
import {addMatrices,determinant,distribution,distributionAfter,feasibleVertices,identity,inverse,matrix,matrixPower,matrixToStrings,multiplicationCellTrace,multiplyMatrices,rref,shape,simplexMax,solveGraphicalLP,solveLinearSystem,stationaryTwoState,stationaryTwoStateResult,transitionMatrix,transpose} from '../src/index.ts';
test('matrix addition and multiplication are exact',()=>{const A=matrix([[1,2],[3,4]]),B=matrix([[2,0],[1,2]]);assert.deepEqual(matrixToStrings(addMatrices(A,B)),[['3','2'],['4','6']]);assert.deepEqual(matrixToStrings(multiplyMatrices(A,B)),[['4','4'],['10','8']]);});
test('multiplication cell trace exposes row by column products',()=>{const t=multiplicationCellTrace(matrix([[1,2]]),matrix([[3],[4]]),0,0);assert.equal(t.value.toString(),'11');assert.deepEqual(t.terms.map(x=>x.product.toString()),['3','8']);});
test('determinant is exact',()=>assert.equal(determinant(matrix([[2,4],[0,-2]])).toString(),'-4'));
test('RREF uses legal row operations and reaches canonical form',()=>{const out=rref(matrix([[1,2,5],[3,4,11]]));assert.deepEqual(matrixToStrings(out.matrix),[['1','0','1'],['0','1','2']]);assert.ok(out.steps.length>0);});
test('inverse by Gauss-Jordan returns exact fractions',()=>{const out=inverse(matrix([[2,4],[0,-2]]));assert.ok(out);assert.deepEqual(matrixToStrings(out!.inverse),[['1/2','1'],['0','-1/2']]);});
test('singular matrix has no inverse',()=>assert.equal(inverse(matrix([[1,2],[2,4]])),null));
test('linear systems classify unique, infinite, and inconsistent cases',()=>{assert.equal(solveLinearSystem(matrix([[1,1,3],[1,-1,1]])).kind,'unique');assert.equal(solveLinearSystem(matrix([[1,1,2],[2,2,4]])).kind,'infinite');assert.equal(solveLinearSystem(matrix([[1,1,2],[1,1,3]])).kind,'inconsistent');});
test('graphical LP finds a bounded optimum',()=>{const constraints=[{a:1,b:1,relation:'<=' as const,c:4},{a:1,b:0,relation:'<=' as const,c:3},{a:0,b:1,relation:'<=' as const,c:2}];const result=solveGraphicalLP(constraints,{x:3,y:2,sense:'max'});assert.equal(result.status,'optimal');assert.equal(result.optima[0]?.value.toString(),'11');assert.deepEqual({x:result.optima[0]?.point.x.toString(),y:result.optima[0]?.point.y.toString()},{x:'3',y:'1'});});
test('graphical LP detects infeasibility',()=>{const result=solveGraphicalLP([{a:1,b:0,relation:'>=' as const,c:2},{a:1,b:0,relation:'<=' as const,c:1}],{x:1,y:0,sense:'max'});assert.equal(result.status,'infeasible');});
test('graphical LP detects an improving recession direction',()=>{const result=solveGraphicalLP([{a:1,b:-1,relation:'<=' as const,c:1}],{x:1,y:1,sense:'max'});assert.equal(result.status,'unbounded');});
test('simplex trace reaches standard-form optimum',()=>{const result=simplexMax({objective:[3,2],constraints:[{coefficients:[1,1],bound:4},{coefficients:[1,0],bound:3},{coefficients:[0,1],bound:2}]});assert.equal(result.status,'optimal');assert.equal(result.objectiveValue?.toString(),'11');assert.deepEqual(result.solution?.map(v=>v.toString()),['3','1']);assert.ok(result.steps.length>=2);});
test('Markov transition validation and k-step evolution remain exact',()=>{const P=transitionMatrix([['3/4','1/4'],['1/2','1/2']]),d=distribution([1,0]);assert.deepEqual(distributionAfter(d,P,2).map(v=>v.toString()),['11/16','5/16']);assert.deepEqual(stationaryTwoState(P).map(v=>v.toString()),['2/3','1/3']);assert.deepEqual(matrixToStrings(matrixPower(P,0)),[['1','0'],['0','1']]);});

test('graphical LP reports multiple optimal corners on an optimal edge',()=>{
 const result=solveGraphicalLP([{a:1,b:1,relation:'<=' as const,c:4}],{x:1,y:1,sense:'max'});
 assert.equal(result.status,'optimal');assert.equal(result.optima.length,2);assert.match(result.message,/Multiple corner points/i);
 assert.deepEqual(new Set(result.optima.map(item=>`${item.point.x.toString()},${item.point.y.toString()}`)),new Set(['4,0','0,4']));
});

test('graphical LP tolerates redundant parallel constraints without duplicating vertices',()=>{
 const result=solveGraphicalLP([{a:1,b:1,relation:'<=' as const,c:4},{a:2,b:2,relation:'<=' as const,c:8}],{x:2,y:1,sense:'max'});
 assert.equal(result.status,'optimal');assert.deepEqual({x:result.optima[0]?.point.x.toString(),y:result.optima[0]?.point.y.toString()},{x:'4',y:'0'});
 assert.equal(new Set(result.vertices.map(item=>`${item.point.x.toString()},${item.point.y.toString()}`)).size,result.vertices.length);
});


test('graphical LP is invariant under exact positive constraint scaling',()=>{
 const base=[{a:1,b:1,relation:'<=' as const,c:4},{a:1,b:0,relation:'<=' as const,c:3},{a:0,b:1,relation:'<=' as const,c:2}];
 const scaled=[{a:'1e-10',b:'1e-10',relation:'<=' as const,c:'4e-10'},{a:'1e-10',b:0,relation:'<=' as const,c:'3e-10'},{a:0,b:'1e-10',relation:'<=' as const,c:'2e-10'}];
 const left=solveGraphicalLP(base,{x:3,y:2,sense:'max'}),right=solveGraphicalLP(scaled,{x:3,y:2,sense:'max'});
 const signature=(result:typeof left)=>({status:result.status,vertices:result.vertices.map(v=>`${v.point.x}:${v.point.y}`).sort(),optima:result.optima.map(v=>`${v.point.x}:${v.point.y}:${v.value}`).sort()});
 assert.deepEqual(signature(right),signature(left));
});

test('graphical LP is invariant under constraint ordering and positive objective scaling',()=>{
 const constraints=[{a:1,b:1,relation:'<=' as const,c:4},{a:1,b:0,relation:'<=' as const,c:3},{a:0,b:1,relation:'<=' as const,c:2}];
 const base=solveGraphicalLP(constraints,{x:3,y:2,sense:'max'});
 const reordered=solveGraphicalLP([...constraints].reverse(),{x:'3e-12',y:'2e-12',sense:'max'});
 assert.equal(reordered.status,base.status);
 assert.deepEqual(new Set(reordered.optima.map(v=>`${v.point.x}:${v.point.y}`)),new Set(base.optima.map(v=>`${v.point.x}:${v.point.y}`)));
});

test('tiny but nonzero objective differences remain exact rather than becoming false ties',()=>{
 const result=solveGraphicalLP([{a:1,b:0,relation:'<=' as const,c:1}],{x:'1e-10',y:0,sense:'max'});
 assert.equal(result.status,'optimal');
 assert.equal(result.optima.length,1);
 assert.equal(result.optima[0]?.point.x.toString(),'1');
 assert.equal(result.optima[0]?.value.toString(),'1/10000000000');
});

test('unbounded graphical LP exposes exact recession geometry instead of only finite corners',()=>{
 const result=solveGraphicalLP([{a:1,b:-1,relation:'<=' as const,c:1}],{x:1,y:1,sense:'max'});
 assert.equal(result.status,'unbounded');
 assert.equal(result.regionBounded,false);
 assert.ok(result.recessionRays.length>0);
 for(const ray of result.recessionRays){
  assert.ok(ray.direction.x.compare(0)>=0&&ray.direction.y.compare(0)>=0);
 }
});

test('an unbounded feasible region may still have a finite optimum when no recession ray improves it',()=>{
 const result=solveGraphicalLP([{a:1,b:0,relation:'>=' as const,c:1}],{x:-1,y:0,sense:'max'});
 assert.equal(result.status,'optimal');
 assert.equal(result.regionBounded,false);
 assert.equal(result.optima[0]?.point.x.toString(),'1');
 assert.equal(result.optima[0]?.value.toString(),'-1');
});


test('simplex uses Bland entering and leaving tie-breaking with explicit basis history',()=>{
 const result=simplexMax({objective:[1,1],constraints:[{coefficients:[1,0],bound:1},{coefficients:[0,1],bound:1},{coefficients:[1,1],bound:1}]});
 assert.equal(result.status,'optimal');
 const firstPivot=result.steps[1]!;
 assert.equal(firstPivot.enteringColumn,0,'smallest-index eligible entering variable is chosen');
 assert.equal(firstPivot.leavingRow,0,'ratio tie leaves the row with the smallest indexed basic variable');
 assert.deepEqual(firstPivot.basis,[0,3,4]);
 const signatures=result.steps.map(step=>step.basis.join(','));
 assert.equal(new Set(signatures).size,signatures.length,'basis signatures do not repeat');
});

test('Markov typed constructors protect public evolution operations and preserve total mass',()=>{
 const P=transitionMatrix([['3/4','1/4'],['1/2','1/2']]),d=distribution(['1/3','2/3']);
 const after=distributionAfter(d,P,17);
 assert.equal(after[0]!.add(after[1]!).toString(),'1');
 assert.throws(()=>distributionAfter(distribution([1]),P,1),/length.*match/i);
 assert.throws(()=>matrixPower(P,10001),/0 to 10000/i);
});

test('two-state stationary result distinguishes unique from nonunique chains',()=>{
 const unique=stationaryTwoStateResult(transitionMatrix([['3/4','1/4'],['1/2','1/2']]));
 assert.equal(unique.kind,'unique');if(unique.kind==='unique')assert.deepEqual(unique.vector.map(value=>value.toString()),['2/3','1/3']);
 const nonunique=stationaryTwoStateResult(transitionMatrix([[1,0],[0,1]]));
 assert.equal(nonunique.kind,'nonunique');if(nonunique.kind==='nonunique')assert.match(nonunique.reason,/every two-state distribution is stationary/i);
 const unsupported=stationaryTwoStateResult(transitionMatrix([[1,0,0],[0,1,0],[0,0,1]]));
 assert.equal(unsupported.kind,'unsupported-dimension');
});


test('matrix operations remain closed within the larger internal workspace budget',()=>{
 const wide=matrix(Array.from({length:12},(_,r)=>Array.from({length:16},(_,c)=>r===c?1:0)));
 const transposed=transpose(wide);
 assert.deepEqual(shape(transposed),{rows:16,cols:12});
 const I=identity(12);
 const inv=inverse(I);
 assert.ok(inv);
 assert.deepEqual(matrixToStrings(inv!.inverse),matrixToStrings(I));
});

test('public matrix construction still enforces the narrower input budget',()=>{
 assert.throws(()=>matrix(Array.from({length:13},()=>[1])),/cannot exceed 12 rows/i);
});


test('LP domains reject pathological constraint counts and coefficient literals before quadratic/exact work',()=>{
 const tooMany=Array.from({length:25},()=>({a:'1',b:'1',relation:'<=' as const,c:'1'}));
 assert.throws(()=>solveGraphicalLP(tooMany,{x:'1',y:'1',sense:'max'}),/cannot exceed 24/i);
 assert.throws(()=>solveGraphicalLP([{a:'1'.repeat(129),b:'1',relation:'<=',c:'1'}],{x:'1',y:'1',sense:'max'}),/cannot exceed 128 characters/i);
});

test('simplex rejects a tableau too large for the bounded educational matrix workspace',()=>{
 assert.throws(()=>simplexMax({objective:Array.from({length:8},()=>1),constraints:Array.from({length:9},()=>({coefficients:Array.from({length:8},()=>1),bound:10}))}),/bounded educational tableau size/i);
});


test('graphical LP runtime contract rejects invalid relation/sense and unsupported free-variable mode',()=>{
 const valid=[{a:1,b:1,relation:'<=' as const,c:4}];
 assert.throws(()=>solveGraphicalLP([{a:1,b:1,relation:'wat' as any,c:4}],{x:1,y:1,sense:'max'}),/relation must be/i);
 assert.throws(()=>solveGraphicalLP(valid,{x:1,y:1,sense:'sideways' as any}),/sense must be/i);
 assert.throws(()=>solveGraphicalLP(valid,{x:1,y:1,sense:'max'},false),/requires nonnegative decision variables/i);
});
