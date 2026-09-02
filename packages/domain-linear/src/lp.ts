import { Rational, type RationalLike } from '@amat19/math-core';
import { MAX_MATRIX_CELLS,MAX_MATRIX_COLS,MAX_MATRIX_ROWS,matrix, type Matrix } from './matrix.ts';

export const MAX_GRAPHICAL_LP_CONSTRAINTS=24;
export const MAX_LP_LITERAL_LENGTH=128;

export type Relation='<='|'>='|'=';
export type Constraint2D={a:RationalLike;b:RationalLike;relation:Relation;c:RationalLike;label?:string};
export type Objective2D={x:RationalLike;y:RationalLike;sense:'max'|'min'};
export type Point2D={x:Rational;y:Rational};
export type Point2DInput={x:RationalLike;y:RationalLike};
export type LpVertex={point:Point2D;value:Rational;activeConstraints:number[]};
export type LpRecessionRay={origin:Point2D;direction:Point2D};
export type GraphicalLpResult={
 status:'optimal'|'infeasible'|'unbounded';
 vertices:LpVertex[];
 optima:LpVertex[];
 regionBounded:boolean;
 recessionRays:LpRecessionRay[];
 message:string;
};

type ExactConstraint={a:Rational;b:Rational;relation:Relation;c:Rational;label?:string};
type ExactObjective={x:Rational;y:Rational;sense:'max'|'min'};
function boundedRational(name:string,value:RationalLike):Rational{
 const text=value instanceof Rational?value.toString():String(value);
 if(text.length>MAX_LP_LITERAL_LENGTH)throw new RangeError(`${name} cannot exceed ${MAX_LP_LITERAL_LENGTH} characters.`);
 return Rational.from(value);
}
function assertGraphicalConstraintBudget(count:number):void{if(count>MAX_GRAPHICAL_LP_CONSTRAINTS)throw new RangeError(`Graphical LP cannot exceed ${MAX_GRAPHICAL_LP_CONSTRAINTS} structural constraints.`);}


function exactPoint(input:Point2DInput):Point2D{return{x:boundedRational('Point x',input.x),y:boundedRational('Point y',input.y)};}
function exactConstraint(input:Constraint2D):ExactConstraint{
 if(input.relation!=='<='&&input.relation!=='>='&&input.relation!=='=')throw new RangeError('Constraint relation must be <=, >=, or =.');
 const a=boundedRational('Constraint x coefficient',input.a),b=boundedRational('Constraint y coefficient',input.b),c=boundedRational('Constraint bound',input.c);
 if(a.isZero()&&b.isZero())throw new RangeError('A constraint needs a nonzero x or y coefficient.');
 return{a,b,c,relation:input.relation,label:input.label};
}
function exactObjective(input:Objective2D):ExactObjective{if(input.sense!=='max'&&input.sense!=='min')throw new RangeError('Objective sense must be max or min.');return{x:boundedRational('Objective x coefficient',input.x),y:boundedRational('Objective y coefficient',input.y),sense:input.sense};}
function pointEquals(a:Point2D,b:Point2D):boolean{return a.x.equals(b.x)&&a.y.equals(b.y);}
function lhs(point:Point2D,constraint:ExactConstraint):Rational{return constraint.a.multiply(point.x).add(constraint.b.multiply(point.y));}
function satisfiesExact(point:Point2D,constraint:ExactConstraint):boolean{
 const comparison=lhs(point,constraint).compare(constraint.c);
 return constraint.relation==='<='?comparison<=0:constraint.relation==='>='?comparison>=0:comparison===0;
}
function isFeasibleExact(point:Point2D,constraints:ExactConstraint[],nonnegative:boolean):boolean{
 if(nonnegative&&(point.x.isNegative()||point.y.isNegative()))return false;
 return constraints.every(constraint=>satisfiesExact(point,constraint));
}
function lineIntersection(left:ExactConstraint,right:ExactConstraint):Point2D|null{
 const determinant=left.a.multiply(right.b).subtract(right.a.multiply(left.b));
 if(determinant.isZero())return null;
 return{
  x:left.c.multiply(right.b).subtract(right.c.multiply(left.b)).divide(determinant),
  y:left.a.multiply(right.c).subtract(right.a.multiply(left.c)).divide(determinant),
 };
}
function activeStructuralConstraints(point:Point2D,constraints:ExactConstraint[]):number[]{
 return constraints.flatMap((constraint,index)=>lhs(point,constraint).equals(constraint.c)?[index]:[]);
}

export function satisfiesConstraint(point:Point2DInput,constraint:Constraint2D):boolean{
 return satisfiesExact(exactPoint(point),exactConstraint(constraint));
}
export function isFeasiblePoint(point:Point2DInput,constraints:Constraint2D[],nonnegative=true):boolean{
 assertGraphicalConstraintBudget(constraints.length);const exactConstraints=constraints.map(exactConstraint);return isFeasibleExact(exactPoint(point),exactConstraints,nonnegative);
}

function exactFeasibleVertices(exactConstraints:ExactConstraint[],nonnegative:boolean):LpVertex[]{
 const boundaries=[...exactConstraints];
 if(nonnegative){
  boundaries.push({a:Rational.one(),b:Rational.zero(),relation:'=',c:Rational.zero(),label:'x=0'});
  boundaries.push({a:Rational.zero(),b:Rational.one(),relation:'=',c:Rational.zero(),label:'y=0'});
 }
 const unique:Point2D[]=[];
 for(let first=0;first<boundaries.length;first+=1){
  for(let second=first+1;second<boundaries.length;second+=1){
   const point=lineIntersection(boundaries[first]!,boundaries[second]!);
   if(point&&isFeasibleExact(point,exactConstraints,nonnegative)&&!unique.some(existing=>pointEquals(existing,point)))unique.push(point);
  }
 }
 unique.sort((left,right)=>left.x.compare(right.x)||left.y.compare(right.y));
 return unique.map(point=>({point,value:Rational.zero(),activeConstraints:activeStructuralConstraints(point,exactConstraints)}));
}
export function feasibleVertices(constraints:Constraint2D[],nonnegative=true):LpVertex[]{
 if(constraints.length===0)throw new RangeError('Add at least one structural constraint.');assertGraphicalConstraintBudget(constraints.length);
 return exactFeasibleVertices(constraints.map(exactConstraint),nonnegative);
}

function directionSatisfies(direction:Point2D,constraint:ExactConstraint):boolean{
 const value=constraint.a.multiply(direction.x).add(constraint.b.multiply(direction.y));
 return constraint.relation==='<='?value.compare(0)<=0:constraint.relation==='>='?value.compare(0)>=0:value.isZero();
}
function samePositiveRay(left:Point2D,right:Point2D):boolean{
 if(!left.x.multiply(right.y).subtract(left.y.multiply(right.x)).isZero())return false;
 return left.x.multiply(right.x).add(left.y.multiply(right.y)).isPositive();
}
function exactRecessionDirections(constraints:ExactConstraint[],nonnegative:boolean):Point2D[]{
 const candidates:Point2D[]=[
  {x:Rational.one(),y:Rational.zero()},{x:Rational.one().negate(),y:Rational.zero()},
  {x:Rational.zero(),y:Rational.one()},{x:Rational.zero(),y:Rational.one().negate()}
 ];
 for(const constraint of constraints){
  candidates.push({x:constraint.b,y:constraint.a.negate()},{x:constraint.b.negate(),y:constraint.a});
 }
 const accepted:Point2D[]=[];
 for(const direction of candidates){
  if(direction.x.isZero()&&direction.y.isZero())continue;
  if(nonnegative&&(direction.x.isNegative()||direction.y.isNegative()))continue;
  if(!constraints.every(constraint=>directionSatisfies(direction,constraint)))continue;
  if(!accepted.some(existing=>samePositiveRay(existing,direction)))accepted.push(direction);
 }
 return accepted;
}
function objectiveValue(point:Point2D,objective:ExactObjective):Rational{return objective.x.multiply(point.x).add(objective.y.multiply(point.y));}
function improves(direction:Point2D,objective:ExactObjective):boolean{
 const gain=objective.x.multiply(direction.x).add(objective.y.multiply(direction.y));
 return objective.sense==='max'?gain.isPositive():gain.isNegative();
}

export function solveGraphicalLP(constraints:Constraint2D[],objective:Objective2D,nonnegative=true):GraphicalLpResult{
 if(nonnegative!==true)throw new RangeError('The supported graphical LP solver requires nonnegative decision variables.');
 if(constraints.length===0)throw new RangeError('Add at least one structural constraint.');assertGraphicalConstraintBudget(constraints.length);
 const exactConstraints=constraints.map(exactConstraint),exactObj=exactObjective(objective);
 const vertices=exactFeasibleVertices(exactConstraints,nonnegative);
 const origin:Point2D={x:Rational.zero(),y:Rational.zero()};
 if(vertices.length===0&&!isFeasibleExact(origin,exactConstraints,nonnegative))return{status:'infeasible',vertices:[],optima:[],regionBounded:true,recessionRays:[],message:'The exact half-plane intersection is empty.'};
 const directions=exactRecessionDirections(exactConstraints,nonnegative);
 const regionBounded=directions.length===0;
 const anchor=vertices[0]?.point??origin;
 const recessionRays=directions.map(direction=>({origin:anchor,direction}));
 const scored=vertices.map(vertex=>({...vertex,value:objectiveValue(vertex.point,exactObj)}));
 if(directions.some(direction=>improves(direction,exactObj)))return{status:'unbounded',vertices:scored,optima:[],regionBounded:false,recessionRays,message:'The feasible region has an exact recession direction that improves the objective without bound.'};
 if(scored.length===0){
  // With the default nonnegative model a nonempty polyhedron is pointed and therefore has a vertex.
  // Keep a defensive result for custom nonnegative=false callers rather than inventing an optimum.
  return{status:'infeasible',vertices:[],optima:[],regionBounded,recessionRays,message:'A feasible point exists, but no finite corner is available in the supported graphical model.'};
 }
 let best=scored[0]!.value;
 for(const vertex of scored.slice(1)){
  const comparison=vertex.value.compare(best);
  if((exactObj.sense==='max'&&comparison>0)||(exactObj.sense==='min'&&comparison<0))best=vertex.value;
 }
 const optima=scored.filter(vertex=>vertex.value.equals(best));
 return{
  status:'optimal',vertices:scored,optima,regionBounded,recessionRays,
  message:optima.length>1?'Multiple corner points attain the same exact optimum; every feasible point on their connecting segment has the same objective value.':regionBounded?'The objective reaches its exact optimum at the highlighted feasible corner.':'The feasible region is unbounded, but none of its recession directions improves the objective; the displayed corner attains the finite optimum.'
 };
}

export type SimplexProblem={objective:RationalLike[];constraints:Array<{coefficients:RationalLike[];bound:RationalLike}>};
export type SimplexStep={iteration:number;tableau:Matrix;basis:number[];enteringColumn?:number;leavingRow?:number;pivot?:Rational;label:string};
export type SimplexResult={status:'optimal'|'unbounded'|'cycling-detected'|'iteration-limit';objectiveValue?:Rational;solution?:Rational[];steps:SimplexStep[]};
/** Exact educational primal simplex for max problems with <= constraints and a slack-variable starting basis. Bland-style pivot choices prevent cycling. */
export function simplexMax(problem:SimplexProblem,maxIterations=100):SimplexResult{
 const n=problem.objective.length,m=problem.constraints.length;
 if(n===0||m===0)throw new RangeError('Simplex needs variables and constraints.');
 if(problem.constraints.some(c=>c.coefficients.length!==n))throw new RangeError('Every simplex constraint needs one coefficient per decision variable.');
 if(m+1>MAX_MATRIX_ROWS||n+m+1>MAX_MATRIX_COLS||(m+1)*(n+m+1)>MAX_MATRIX_CELLS)throw new RangeError('Simplex problem exceeds the bounded educational tableau size.');
 if(!Number.isInteger(maxIterations)||maxIterations<1||maxIterations>1000)throw new RangeError('Simplex iteration limit must be an integer from 1 to 1000.');
 const c=problem.objective.map((value,index)=>boundedRational(`Objective coefficient ${index+1}`,value));
 const rows:RationalLike[][]=problem.constraints.map((q,r)=>[...q.coefficients.map((value,index)=>boundedRational(`Constraint ${r+1} coefficient ${index+1}`,value)),...Array.from({length:m},(_,k)=>r===k?1:0),boundedRational(`Constraint ${r+1} bound`,q.bound)]);
 rows.push([...c.map(v=>v.negate()),...Array.from({length:m},()=>0),0]);
 let tab=matrix(rows);
 if(tab.slice(0,m).some(row=>row.at(-1)!.isNegative()))throw new RangeError('This educational simplex routine expects nonnegative right-hand sides.');
 let basis=Array.from({length:m},(_,row)=>n+row);
 const signature=()=>basis.join(',');
 const seen=new Set<string>([signature()]);
 const steps:SimplexStep[]=[{iteration:0,tableau:tab,basis:[...basis],label:'Initial tableau with slack variables'}];
 for(let iteration=1;iteration<=maxIterations;iteration++){
  const objectiveRow=tab[m]!;
  // Bland entering rule: smallest-index nonbasic column with a negative reduced cost.
  let entering=-1;
  for(let column=0;column<n+m;column++){if(objectiveRow[column]!.isNegative()){entering=column;break;}}
  if(entering<0){
   const solution=Array.from({length:n},()=>Rational.zero());
   for(let row=0;row<m;row++){const variable=basis[row]!;if(variable<n)solution[variable]=tab[row]!.at(-1)!;}
   return{status:'optimal',objectiveValue:tab[m]!.at(-1)!,solution,steps};
  }
  let leaving=-1;let bestRatio:Rational|undefined;
  for(let row=0;row<m;row++){
   const coefficient=tab[row]![entering]!;if(!coefficient.isPositive())continue;
   const ratio=tab[row]!.at(-1)!.divide(coefficient);if(ratio.isNegative())continue;
   if(!bestRatio||ratio.compare(bestRatio)<0||(ratio.equals(bestRatio)&&basis[row]!<(leaving>=0?basis[leaving]!:Number.POSITIVE_INFINITY))){bestRatio=ratio;leaving=row;}
  }
  if(leaving<0)return{status:'unbounded',steps:[...steps,{iteration,tableau:tab,basis:[...basis],enteringColumn:entering,label:'Bland entering column has no positive pivot candidate'}]};
  const pivot=tab[leaving]![entering]!;let next=tab.map(row=>row.slice());
  next[leaving]=next[leaving]!.map(value=>value.divide(pivot));
  for(let row=0;row<next.length;row++){if(row===leaving)continue;const factor=next[row]![entering]!.negate();next[row]=next[row]!.map((value,column)=>value.add(factor.multiply(next[leaving]![column]!)));}
  tab=next;basis=[...basis];basis[leaving]=entering;
  const step:SimplexStep={iteration,tableau:tab,basis:[...basis],enteringColumn:entering,leavingRow:leaving,pivot,label:`Bland pivot on row ${leaving+1}, column ${entering+1}`};steps.push(step);
  const nextSignature=signature();if(seen.has(nextSignature))return{status:'cycling-detected',steps};seen.add(nextSignature);
 }
 return{status:'iteration-limit',steps};
}
