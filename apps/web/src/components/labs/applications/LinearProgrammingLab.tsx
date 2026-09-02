import { useMemo, useState } from 'react';
import { Eye, Goal, Layers3 } from 'lucide-react';
import { Rational } from '@amat19/math-core';
import { MAX_GRAPHICAL_LP_CONSTRAINTS, simplexMax, solveGraphicalLP, type Constraint2D, type LpRecessionRay, type Point2D } from '@amat19/domain-linear';
import { Button } from '../../ui/Button';
import { Feedback } from '../../ui/Feedback';
import { Badge } from '../../ui/Badge';
import { recordAssessmentResult } from '../../../lib/local-progress';
import { parseNonnegativeIntegerInput } from '../../../lib/integer-input';

type Row={id:number;a:string;b:string;relation:Constraint2D['relation'];c:string};
type Stage=1|2|3|4;

export default function LinearProgrammingLab(){
 const[constraints,setConstraints]=useState<Row[]>([
  {id:1,a:'1',b:'1',relation:'<=',c:'4'},
  {id:2,a:'1',b:'0',relation:'<=',c:'3'},
  {id:3,a:'0',b:'1',relation:'<=',c:'2'}
 ]);
 const[cx,setCx]=useState('3'),[cy,setCy]=useState('2'),[sense,setSense]=useState<'max'|'min'>('max'),[prediction,setPrediction]=useState<'optimal'|'unbounded'|'infeasible'>(),[checked,setChecked]=useState(false),[statusMisses,setStatusMisses]=useState(0),[stage,setStage]=useState<Stage>(4),[simplexStep,setSimplexStep]=useState(0),[entering,setEntering]=useState(''),[leaving,setLeaving]=useState(''),[pivotFeedback,setPivotFeedback]=useState<boolean>();
 const result=useMemo(()=>{try{return{value:solveGraphicalLP(constraints,{x:cx,y:cy,sense}),error:undefined}}catch(error){return{value:undefined,error:error instanceof Error?error.message:'LP could not be solved.'}}},[constraints,cx,cy,sense]);
 const simplex=useMemo(()=>{try{if(sense!=='max'||constraints.some(q=>q.relation!=='<='))return undefined;return simplexMax({objective:[cx,cy],constraints:constraints.map(q=>({coefficients:[q.a,q.b],bound:q.c}))})}catch{return undefined}},[constraints,cx,cy,sense]);
 const resetAssessment=()=>{setChecked(false);setStatusMisses(0);setPrediction(undefined)};
 const update=(id:number,patch:Partial<Row>)=>{setConstraints(rows=>rows.map(row=>row.id===id?{...row,...patch}:row));resetAssessment()};
 const nextPivot=simplex?.steps[simplexStep+1];const pivotRequired=Boolean(nextPivot?.enteringColumn!==undefined&&nextPivot?.leavingRow!==undefined);
 async function check(){
  if(!prediction||!result.value)return;
  const ok=prediction===result.value.status;
  const nextMisses=statusMisses+(ok?0:1);
  setChecked(true);if(!ok)setStatusMisses(nextMisses);
  await recordAssessmentResult({
   prefix:'lp',exerciseId:'applications.lp.status',problemFingerprint:JSON.stringify({constraints,cx,cy,sense}),module:'applications',skillId:'applications.lp.corner-point',result:ok?'correct':'incorrect',firstAttemptCorrect:ok&&statusMisses===0,incorrectAttempts:nextMisses,hintsUsed:0,revealsUsed:0,difficulty:'standard',payload:{prediction,status:result.value.status,constraints,cx,cy,sense}
  }).catch(()=>undefined);
 }
 function checkPivot(){if(!nextPivot)return;const e=parseNonnegativeIntegerInput(entering,{label:'Entering column',positive:true,max:100}),l=parseNonnegativeIntegerInput(leaving,{label:'Leaving row',positive:true,max:100});if(e.status!=='valid'||l.status!=='valid'){setPivotFeedback(false);return}const ok=e.value===nextPivot.enteringColumn!+1&&l.value===nextPivot.leavingRow!+1;setPivotFeedback(ok)}
 function moveSimplex(delta:number){setSimplexStep(current=>Math.max(0,Math.min((simplex?.steps.length??1)-1,current+delta)));setEntering('');setLeaving('');setPivotFeedback(undefined)}
 return <section className="lp-lab" data-testid="lp-lab">
  <div className="lp-lab__controls">
   <h2>Build the geometry before asking the objective to optimize it.</h2><p className="section-context">Graphical linear programming · exact rational geometry</p>
   <div className="objective-row">
    <select className="select-input" aria-label="Objective direction" value={sense} onChange={e=>{setSense(e.target.value as 'max'|'min');resetAssessment()}}><option value="max">Maximize</option><option value="min">Minimize</option></select>
    <label className="form-field"><span className="form-field__label">x coefficient</span><input className="text-input" inputMode="decimal" value={cx} onChange={e=>{setCx(e.target.value);resetAssessment()}}/></label>
    <label className="form-field"><span className="form-field__label">y coefficient</span><input className="text-input" inputMode="decimal" value={cy} onChange={e=>{setCy(e.target.value);resetAssessment()}}/></label>
   </div>
   <p className="form-field__hint">Exact integers, decimals, fractions, and exponent-form decimals are accepted. Correctness is decided with Rational arithmetic.</p>
   <div className="constraint-editor">{constraints.map((q,i)=><div className="constraint-row" key={q.id}><span>C{i+1}</span><input aria-label={`Constraint ${i+1} x coefficient`} inputMode="decimal" value={q.a} onChange={e=>update(q.id,{a:e.target.value})}/><span>x +</span><input aria-label={`Constraint ${i+1} y coefficient`} inputMode="decimal" value={q.b} onChange={e=>update(q.id,{b:e.target.value})}/><span>y</span><select aria-label={`Constraint ${i+1} relation`} value={q.relation} onChange={e=>update(q.id,{relation:e.target.value as Constraint2D['relation']})}><option value="<=">≤</option><option value=">=">≥</option><option value="=">=</option></select><input aria-label={`Constraint ${i+1} bound`} inputMode="decimal" value={q.c} onChange={e=>update(q.id,{c:e.target.value})}/><Button variant="ghost" disabled={constraints.length<=1} onClick={()=>{setConstraints(rows=>rows.filter(row=>row.id!==q.id));resetAssessment()}}>Remove</Button></div>)}</div>
   <Button variant="ghost" disabled={constraints.length>=MAX_GRAPHICAL_LP_CONSTRAINTS} onClick={()=>{setConstraints(rows=>[...rows,{id:Math.max(0,...rows.map(row=>row.id))+1,a:'1',b:'1',relation:'<=',c:'5'}]);resetAssessment()}}>+ Add constraint</Button>
   {result.error&&<Feedback tone="error" role="alert">{result.error}</Feedback>}
   <fieldset className="prediction-fieldset"><legend>Predict the model status</legend>{(['optimal','unbounded','infeasible'] as const).map(value=><label key={value}><input type="radio" checked={prediction===value} onChange={()=>{setPrediction(value);setChecked(false)}}/> {value}</label>)}<Button disabled={!prediction||!result.value} onClick={()=>void check()}>Check prediction</Button>{checked&&result.value&&<Feedback tone={prediction===result.value.status?'success':'error'}>{prediction===result.value.status?'Correct.':`The exact feasible geometry is ${result.value.status}.`}</Feedback>}</fieldset>
  </div>
  <div className="lp-lab__visual">{result.error?<Feedback tone="error">Fix the exact coefficient input before graphing this model.</Feedback>:result.value&&<>
   <div className="lp-guided-steps" aria-label="Graph construction layers"><button data-active={stage===1} onClick={()=>setStage(1)}><Layers3 size={14}/> 1 Boundaries</button><button data-active={stage===2} onClick={()=>setStage(2)}><Eye size={14}/> 2 Feasible region</button><button data-active={stage===3} onClick={()=>setStage(3)}>3 Corners</button><button data-active={stage===4} onClick={()=>setStage(4)}><Goal size={14}/> 4 Objective</button></div>
   <LpPlot constraints={constraints} vertices={result.value.vertices.map(v=>v.point)} optima={result.value.optima.map(v=>v.point)} rays={result.value.recessionRays} regionBounded={result.value.regionBounded} cx={cx} cy={cy} optimumValue={result.value.optima[0]?.value} stage={stage}/>
   <div className="formula-callout"><span>Status</span><strong>{result.value.status}</strong><small>{result.value.message}</small></div>
   {!result.value.regionBounded&&<div className="formula-callout"><span>Feasible-region geometry</span><strong>Unbounded region · {result.value.recessionRays.length} exact recession direction{result.value.recessionRays.length===1?'':'s'}</strong><small>Arrowed rays remain open; no closed polygon is used to imply a finite feasible region.</small></div>}
   {stage>=3&&<div className="vertex-table-wrap"><table className="vertex-table"><thead><tr><th>Corner</th><th>x</th><th>y</th><th>Z = {cx}x + {cy}y</th></tr></thead><tbody>{result.value.vertices.map((v,i)=><tr key={i} data-optimum={result.value!.optima.some(o=>pointEquals(o.point,v.point))}><td>V{i+1}</td><td>{displayRational(v.point.x)}</td><td>{displayRational(v.point.y)}</td><td>{displayRational(v.value)}</td></tr>)}</tbody></table></div>}
  </>}</div>
  <aside className="lp-lab__simplex"><div className="math-panel__head"><div><h3>Predict the pivot, then reveal the next tableau.</h3><p className="section-context">Simplex synchronization</p></div>{simplex&&<Badge>{simplex.status}</Badge>}</div>{simplex?<><p>Shown only for the supported standard maximization form. The tableau remains a separate exact Rational teaching engine.</p><div className="step-toolbar"><Button variant="ghost" disabled={simplexStep===0} onClick={()=>moveSimplex(-1)}>←</Button><span>Tableau {simplexStep+1} / {simplex.steps.length}</span><Button variant="ghost" disabled={simplexStep>=simplex.steps.length-1||(pivotRequired&&pivotFeedback!==true)} onClick={()=>moveSimplex(1)}>→</Button></div><p><strong>{simplex.steps[simplexStep]?.label}</strong></p><SimplexTable tableau={simplex.steps[simplexStep]!.tableau}/>{pivotRequired&&simplexStep<simplex.steps.length-1&&<div className="row-op-builder"><p>Before revealing the next tableau, predict the pivot:</p><div className="row-op-builder__controls"><label>Entering column<input type="number" min="1" value={entering} onChange={e=>{setEntering(e.target.value);setPivotFeedback(undefined)}}/></label><label>Leaving row<input type="number" min="1" value={leaving} onChange={e=>{setLeaving(e.target.value);setPivotFeedback(undefined)}}/></label><Button variant="secondary" onClick={checkPivot}>Check pivot</Button></div>{pivotFeedback!==undefined&&<Feedback tone={pivotFeedback?'success':'error'}>{pivotFeedback?'Correct. Reveal the next tableau.':'Use the objective-row coefficient rule, then the positive minimum-ratio test.'}</Feedback>}</div>}{simplex.status==='optimal'&&<div className="formula-callout"><span>Simplex optimum</span><strong>Z = {simplex.objectiveValue?.toString()}</strong><small>x = {simplex.solution?.map(v=>v.toString()).join(', ')}</small></div>}</>:<p className="experimental-note">The simplex trace appears only for the supported standard maximization form.</p>}</aside>
 </section>
}

function pointEquals(left:Point2D,right:Point2D){return left.x.equals(right.x)&&left.y.equals(right.y)}
function displayRational(value:Rational){return value.denominator===1n?value.toString():`${value.toDecimal(4)} (${value.toString()})`}
function displayNumber(value:Rational){return value.toNumber()}
function cleanNumber(value:number){return value.toFixed(4).replace(/0+$/,'').replace(/\.$/,'')}
function SimplexTable({tableau}:{tableau:any[][]}){return <div className="matrix-wrap" role="region" tabIndex={0} aria-label="Simplex tableau; scroll horizontally to inspect all columns"><table className="matrix-table"><tbody>{tableau.map((row,i)=><tr key={i}>{row.map((value,j)=><td key={j}>{value.toString()}</td>)}</tr>)}</tbody></table></div>}

function LpPlot({constraints,vertices,optima,rays,regionBounded,cx,cy,optimumValue,stage}:{constraints:Row[];vertices:Point2D[];optima:Point2D[];rays:LpRecessionRay[];regionBounded:boolean;cx:string;cy:string;optimumValue?:Rational;stage:Stage}){
 const displayVertices=vertices.map(point=>({point,x:displayNumber(point.x),y:displayNumber(point.y)}));
 const finitePositive=displayVertices.flatMap(v=>[v.x,v.y]).filter(Number.isFinite).map(v=>Math.max(0,v));
 const max=Math.max(5,...finitePositive)*1.25;
 const sx=(x:number)=>50+(x/max)*500,sy=(y:number)=>550-(y/max)*500;
 const line=(q:Row)=>{try{const a=Rational.from(q.a).toNumber(),b=Rational.from(q.b).toNumber(),c=Rational.from(q.c).toNumber();const pts=[] as Array<{x:number;y:number}>;if(b!==0)for(const x of [0,max]){const y=(c-a*x)/b;if(y>=0&&y<=max)pts.push({x,y})}if(a!==0)for(const y of [0,max]){const x=(c-b*y)/a;if(x>=0&&x<=max)pts.push({x,y})}return uniqueDisplayPoints(pts).slice(0,2)}catch{return[]}};
 const hull=[...displayVertices].sort((a,b)=>Math.atan2(a.y-avg(displayVertices,'y'),a.x-avg(displayVertices,'x'))-Math.atan2(b.y-avg(displayVertices,'y'),b.x-avg(displayVertices,'x')));
 let objective:Array<{x:number;y:number}>=[];
 try{if(optimumValue){objective=clipLine(Rational.from(cx).toNumber(),Rational.from(cy).toNumber(),optimumValue.toNumber(),max)}}catch{}
 return <figure className="lp-plot"><svg viewBox="0 0 620 610" role="img" aria-label="Linear programming coordinate plane"><defs><linearGradient id="feasibleFill" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="var(--primary)" stopOpacity=".18"/><stop offset="1" stopColor="var(--accent)" stopOpacity=".24"/></linearGradient><marker id="lpRayArrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="var(--primary)"/></marker></defs><line className="axis" x1="50" y1="550" x2="570" y2="550"/><line className="axis" x1="50" y1="550" x2="50" y2="30"/><text x="580" y="555">x</text><text x="38" y="25">y</text>
  {stage>=2&&regionBounded&&hull.length>=3&&<polygon points={hull.map(v=>`${sx(v.x)},${sy(v.y)}`).join(' ')} fill="url(#feasibleFill)" stroke="var(--primary)" strokeWidth="1.5"/>}
  {constraints.map((q,i)=>{const pts=line(q);return pts.length===2?<g key={i}><line className="constraint-line" x1={sx(pts[0]!.x)} y1={sy(pts[0]!.y)} x2={sx(pts[1]!.x)} y2={sy(pts[1]!.y)}/><text x={sx(pts[0]!.x)+6} y={sy(pts[0]!.y)-6}>C{i+1}</text></g>:null})}
  {stage>=2&&!regionBounded&&rays.map((ray,index)=>{const start={x:ray.origin.x.toNumber(),y:ray.origin.y.toNumber()},direction={x:ray.direction.x.toNumber(),y:ray.direction.y.toNumber()},end=rayDisplayEnd(start,direction,max);return <line key={`ray-${index}`} x1={sx(start.x)} y1={sy(start.y)} x2={sx(end.x)} y2={sy(end.y)} stroke="var(--primary)" strokeWidth="2.5" strokeDasharray="7 5" markerEnd="url(#lpRayArrow)"/>})}
  {stage>=4&&objective.length===2&&<line x1={sx(objective[0]!.x)} y1={sy(objective[0]!.y)} x2={sx(objective[1]!.x)} y2={sy(objective[1]!.y)} stroke="var(--accent)" strokeWidth="3" strokeDasharray="9 7"/>}
  {stage>=3&&displayVertices.map((v,i)=><g key={`v${i}`}><circle className={stage>=4&&optima.some(o=>pointEquals(o,v.point))?'optimum-point':'vertex-point'} cx={sx(v.x)} cy={sy(v.y)} r="7"/><text x={sx(v.x)+8} y={sy(v.y)-8}>({cleanNumber(v.x)},{cleanNumber(v.y)})</text></g>)}
 </svg><figcaption>{stage===1?'Boundary lines only: each inequality still needs a feasible side.':stage===2?regionBounded?'The filled polygon is the exact intersection of all feasible half-planes.':'The feasible set is unbounded. Arrowed recession directions stay open; no closed polygon is drawn.':stage===3?'Exact feasible corners are the candidates for a finite linear objective.':'The dashed objective line uses the exact optimum value from the domain engine; coordinate conversion here is display-only.'}</figcaption></figure>
}
function avg(points:Array<{x:number;y:number}>,key:'x'|'y'){return points.length?points.reduce((sum,p)=>sum+p[key],0)/points.length:0}
function uniqueDisplayPoints(points:Array<{x:number;y:number}>){return points.filter((point,index,self)=>self.findIndex(other=>Math.abs(point.x-other.x)<1e-10&&Math.abs(point.y-other.y)<1e-10)===index)}
function clipLine(a:number,b:number,c:number,max:number){const pts:Array<{x:number;y:number}>=[];if(b!==0)for(const x of [0,max]){const y=(c-a*x)/b;if(y>=0&&y<=max)pts.push({x,y})}if(a!==0)for(const y of [0,max]){const x=(c-b*y)/a;if(x>=0&&x<=max)pts.push({x,y})}return uniqueDisplayPoints(pts).slice(0,2)}
function rayDisplayEnd(origin:{x:number;y:number},direction:{x:number;y:number},max:number){const magnitude=Math.max(Math.abs(direction.x),Math.abs(direction.y),Number.EPSILON),scale=(max*.42)/magnitude;return{x:Math.min(max,Math.max(0,origin.x+direction.x*scale)),y:Math.min(max,Math.max(0,origin.y+direction.y*scale))}}
