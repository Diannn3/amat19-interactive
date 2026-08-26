import { Rational, type RationalLike } from '@amat19/math-core';
export type Matrix = Rational[][];
export type MatrixShape = { rows:number; cols:number };
export type RowOperation =
  | { kind:'swap'; rowA:number; rowB:number; label:string }
  | { kind:'scale'; row:number; factor:Rational; label:string }
  | { kind:'replace'; targetRow:number; sourceRow:number; factor:Rational; label:string };
export type RowReductionStep = { operation:RowOperation; before:Matrix; after:Matrix; pivot?:{row:number;col:number} };
export type RrefResult = { matrix:Matrix; steps:RowReductionStep[]; pivotColumns:number[]; rank:number };
export type LinearSystemResult = { kind:'unique'|'infinite'|'inconsistent'; rref:Matrix; rank:number; variableCount:number; solution?:Rational[]; steps:RowReductionStep[] };
export function matrix(values:RationalLike[][]):Matrix {
  if(values.length===0||values[0]?.length===0)throw new RangeError('A matrix needs at least one row and one column.');
  const cols=values[0]!.length;if(values.some(row=>row.length!==cols))throw new RangeError('Every matrix row must have the same number of columns.');
  return values.map(row=>row.map(Rational.from));
}
export function cloneMatrix(input:Matrix):Matrix{return input.map(row=>row.slice());}
export function shape(input:Matrix):MatrixShape { if(input.length===0||input[0]?.length===0)throw new RangeError('A matrix cannot be empty.'); const cols=input[0]!.length;if(input.some(r=>r.length!==cols))throw new RangeError('Matrix rows must have equal length.');return{rows:input.length,cols}; }
export function identity(n:number):Matrix {if(!Number.isInteger(n)||n<=0)throw new RangeError('Identity order must be a positive integer.');return Array.from({length:n},(_,r)=>Array.from({length:n},(_,c)=>new Rational(r===c?1:0)));}
export function addMatrices(a:Matrix,b:Matrix):Matrix {const sa=shape(a),sb=shape(b);if(sa.rows!==sb.rows||sa.cols!==sb.cols)throw new RangeError('Matrix addition requires equal dimensions.');return a.map((row,r)=>row.map((v,c)=>v.add(b[r]![c]!)));}
export function subtractMatrices(a:Matrix,b:Matrix):Matrix {return addMatrices(a,b.map(row=>row.map(v=>v.negate())));}
export function scalarMultiply(a:Matrix,k:RationalLike):Matrix {const factor=Rational.from(k);return a.map(row=>row.map(v=>v.multiply(factor)));}
export function transpose(a:Matrix):Matrix {const s=shape(a);return Array.from({length:s.cols},(_,c)=>Array.from({length:s.rows},(_,r)=>a[r]![c]!));}
export function multiplyMatrices(a:Matrix,b:Matrix):Matrix {const sa=shape(a),sb=shape(b);if(sa.cols!==sb.rows)throw new RangeError(`Matrix multiplication requires A columns (${sa.cols}) = B rows (${sb.rows}).`);return Array.from({length:sa.rows},(_,r)=>Array.from({length:sb.cols},(_,c)=>a[r]!.reduce((sum,v,k)=>sum.add(v.multiply(b[k]![c]!)),Rational.zero())));}
export function multiplicationCellTrace(a:Matrix,b:Matrix,row:number,col:number){const sa=shape(a),sb=shape(b);if(sa.cols!==sb.rows)throw new RangeError('The matrices are not multiplication-compatible.');if(row<0||row>=sa.rows||col<0||col>=sb.cols)throw new RangeError('Output cell is outside the product matrix.');const terms=a[row]!.map((left,k)=>({left,right:b[k]![col]!,product:left.multiply(b[k]![col]!)}));const value=terms.reduce((s,t)=>s.add(t.product),Rational.zero());return{row,col,terms,value};}
export function determinant(input:Matrix):Rational {const s=shape(input);if(s.rows!==s.cols)throw new RangeError('A determinant is defined here only for square matrices.');const a=cloneMatrix(input);let sign=1;let det=Rational.one();for(let col=0;col<s.cols;col++){let pivot=col;while(pivot<s.rows&&a[pivot]![col]!.isZero())pivot++;if(pivot===s.rows)return Rational.zero();if(pivot!==col){[a[pivot],a[col]]=[a[col]!,a[pivot]!];sign*=-1;}const p=a[col]![col]!;det=det.multiply(p);for(let r=col+1;r<s.rows;r++){if(a[r]![col]!.isZero())continue;const factor=a[r]![col]!.divide(p);for(let c=col;c<s.cols;c++)a[r]![c]=a[r]![c]!.subtract(factor.multiply(a[col]![c]!));}}return sign===1?det:det.negate();}
function opSwap(a:Matrix,r1:number,r2:number):Matrix{const next=cloneMatrix(a);[next[r1],next[r2]]=[next[r2]!,next[r1]!];return next;}
function opScale(a:Matrix,row:number,factor:Rational):Matrix{const next=cloneMatrix(a);next[row]=next[row]!.map(v=>v.multiply(factor));return next;}
function opReplace(a:Matrix,target:number,source:number,factor:Rational):Matrix{const next=cloneMatrix(a);next[target]=next[target]!.map((v,c)=>v.add(factor.multiply(next[source]![c]!)));return next;}
export function rref(input:Matrix):RrefResult {const s=shape(input);let current=cloneMatrix(input);const steps:RowReductionStep[]=[];const pivotColumns:number[]=[];let pivotRow=0;for(let col=0;col<s.cols&&pivotRow<s.rows;col++){let found=pivotRow;while(found<s.rows&&current[found]![col]!.isZero())found++;if(found===s.rows)continue;if(found!==pivotRow){const before=current;current=opSwap(current,pivotRow,found);steps.push({operation:{kind:'swap',rowA:pivotRow,rowB:found,label:`R${pivotRow+1} ↔ R${found+1}`},before,after:current,pivot:{row:pivotRow,col}});}const pivot=current[pivotRow]![col]!;if(!pivot.equals(1)){const before=current,factor=pivot.reciprocal();current=opScale(current,pivotRow,factor);steps.push({operation:{kind:'scale',row:pivotRow,factor,label:`R${pivotRow+1} ← (${factor.toString()})R${pivotRow+1}`},before,after:current,pivot:{row:pivotRow,col}});}for(let r=0;r<s.rows;r++){if(r===pivotRow)continue;const entry=current[r]![col]!;if(entry.isZero())continue;const before=current,factor=entry.negate();current=opReplace(current,r,pivotRow,factor);steps.push({operation:{kind:'replace',targetRow:r,sourceRow:pivotRow,factor,label:`R${r+1} ← R${r+1} + (${factor.toString()})R${pivotRow+1}`},before,after:current,pivot:{row:pivotRow,col}});}pivotColumns.push(col);pivotRow++;}return{matrix:current,steps,pivotColumns,rank:pivotColumns.length};}
export function inverse(input:Matrix):{inverse:Matrix;steps:RowReductionStep[]}|null {const s=shape(input);if(s.rows!==s.cols)throw new RangeError('Only square matrices can have inverses.');const augmented=input.map((row,r)=>[...row,...identity(s.rows)[r]!]);const reduced=rref(augmented);const left=reduced.matrix.map(row=>row.slice(0,s.cols)),I=identity(s.rows);const okay=left.every((row,r)=>row.every((v,c)=>v.equals(I[r]![c]!)));if(!okay)return null;return{inverse:reduced.matrix.map(row=>row.slice(s.cols)),steps:reduced.steps};}
export function solveLinearSystem(augmented:Matrix):LinearSystemResult {const s=shape(augmented);if(s.cols<2)throw new RangeError('An augmented system needs at least one variable column and one constant column.');const variables=s.cols-1,reduced=rref(augmented);let inconsistent=false;for(const row of reduced.matrix){if(row.slice(0,variables).every(v=>v.isZero())&&!row[variables]!.isZero())inconsistent=true;}if(inconsistent)return{kind:'inconsistent',rref:reduced.matrix,rank:reduced.rank,variableCount:variables,steps:reduced.steps};const variablePivots=reduced.pivotColumns.filter(c=>c<variables);if(variablePivots.length<variables)return{kind:'infinite',rref:reduced.matrix,rank:variablePivots.length,variableCount:variables,steps:reduced.steps};const solution=Array.from({length:variables},()=>Rational.zero());for(let r=0;r<reduced.matrix.length;r++){const pivot=variablePivots[r];if(pivot===undefined)break;solution[pivot]=reduced.matrix[r]![variables]!;}return{kind:'unique',rref:reduced.matrix,rank:variables,variableCount:variables,solution,steps:reduced.steps};}
export function matrixToStrings(input:Matrix):string[][]{return input.map(row=>row.map(v=>v.toString()));}

export type RowOperationInput=
 | {kind:'swap';rowA:number;rowB:number}
 | {kind:'scale';row:number;factor:RationalLike}
 | {kind:'replace';targetRow:number;sourceRow:number;factor:RationalLike};
/** Apply one learner-selected elementary row operation and return the exact resulting matrix plus its normalized label. */
export function applyRowOperation(input:Matrix,operation:RowOperationInput):{matrix:Matrix;operation:RowOperation}{
 const s=shape(input);const validRow=(row:number)=>Number.isInteger(row)&&row>=0&&row<s.rows;
 if(operation.kind==='swap'){
  if(!validRow(operation.rowA)||!validRow(operation.rowB))throw new RangeError('Both swap rows must exist.');
  if(operation.rowA===operation.rowB)throw new RangeError('Choose two different rows to swap.');
  return{matrix:opSwap(input,operation.rowA,operation.rowB),operation:{...operation,label:`R${operation.rowA+1} ↔ R${operation.rowB+1}`}};
 }
 if(operation.kind==='scale'){
  if(!validRow(operation.row))throw new RangeError('The scaled row must exist.');const factor=Rational.from(operation.factor);if(factor.isZero())throw new RangeError('Scaling by 0 is not an elementary row operation.');
  return{matrix:opScale(input,operation.row,factor),operation:{kind:'scale',row:operation.row,factor,label:`R${operation.row+1} ← (${factor.toString()})R${operation.row+1}`}};
 }
 if(!validRow(operation.targetRow)||!validRow(operation.sourceRow))throw new RangeError('Both replacement rows must exist.');
 if(operation.targetRow===operation.sourceRow)throw new RangeError('The source and target rows must be different.');
 const factor=Rational.from(operation.factor);if(factor.isZero())throw new RangeError('Use a nonzero multiple of the source row for replacement.');
 return{matrix:opReplace(input,operation.targetRow,operation.sourceRow,factor),operation:{kind:'replace',targetRow:operation.targetRow,sourceRow:operation.sourceRow,factor,label:`R${operation.targetRow+1} ← R${operation.targetRow+1} + (${factor.toString()})R${operation.sourceRow+1}`}};
}
export function matricesEqual(a:Matrix,b:Matrix):boolean{const sa=shape(a),sb=shape(b);return sa.rows===sb.rows&&sa.cols===sb.cols&&a.every((row,r)=>row.every((value,c)=>value.equals(b[r]![c]!)));}
