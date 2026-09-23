import { formatLogic } from './format.ts';
import { parseLogic } from './parser.ts';
import { astEquals, binary, not } from './structural.ts';
import type { LogicNode } from './types.ts';
import { validateProofLine, type CheckedProofLine, type ProofLineInput } from './proof.ts';

export type ProofMethod='direct'|'conditional'|'indirect';
export type ScopeKind='root'|'conditional'|'indirect';
export type ProofScope={id:string;parentId?:string;kind:ScopeKind;assumptionLine?:number;openedAtLine:number;closedAtLine?:number;goal?:string};
export type ScopedProofLine=CheckedProofLine&{scopeId:string;scopeDepth:number;role?:'assumption'|'closure'};
export type ScopedProofState={method:ProofMethod;goal:string;lines:ScopedProofLine[];scopes:ProofScope[];currentScopeId:string};

function rootScope():ProofScope{return{id:'root',kind:'root',openedAtLine:1}}
function scopeById(state:ScopedProofState,id:string){const scope=state.scopes.find(item=>item.id===id);if(!scope)throw new Error(`Unknown proof scope ${id}.`);return scope}
function scopeDepth(state:ScopedProofState,id:string){let depth=0,current=scopeById(state,id);while(current.parentId){depth+=1;current=scopeById(state,current.parentId)}return depth}
function ancestors(state:ScopedProofState,id:string):string[]{const ids:string[]=[];let current=scopeById(state,id);while(true){ids.push(current.id);if(!current.parentId)break;current=scopeById(state,current.parentId)}return ids}
function lineAccessible(state:ScopedProofState,line:ScopedProofLine,currentScopeId:string){return ancestors(state,currentScopeId).includes(line.scopeId)}
function contradiction(node:LogicNode):boolean{
 if(node.kind!=='and')return false;
 const pairs:[[LogicNode,LogicNode],[LogicNode,LogicNode]]=[[node.left,node.right],[node.right,node.left]];
 return pairs.some(([a,b])=>b.kind==='not'&&astEquals(a,b.operand));
}
function expectedIndirectAssumption(goal:string):LogicNode{return not(parseLogic(goal));}

export function createScopedProof(method:ProofMethod,premises:string[],goal:string):ScopedProofState{
 let state:ScopedProofState={method,goal,lines:[],scopes:[rootScope()],currentScopeId:'root'};
 for(const expression of premises){const base=validateProofLine(state.lines,{expression,ruleId:'Premise',references:[]});state={...state,lines:[...state.lines,{...base,scopeId:'root',scopeDepth:0}]};}
 return state;
}

export function addScopedProofLine(state:ScopedProofState,input:ProofLineInput):ScopedProofState{
 if(input.ruleId==='Premise'||input.ruleId==='PA'||input.ruleId==='CP'||input.ruleId==='IP')throw new Error('Use the scoped proof controls for assumptions and method closures.');
 const inaccessible=input.references.find(ref=>{const line=state.lines[ref-1];return !line||!lineAccessible(state,line,state.currentScopeId)});
 if(inaccessible!==undefined){const failed:ScopedProofLine={...input,lineNumber:state.lines.length+1,ok:false,message:`Line ${inaccessible} is outside the current proof scope.`,scopeId:state.currentScopeId,scopeDepth:scopeDepth(state,state.currentScopeId)};return{...state,lines:[...state.lines,failed]};}
 const checked=validateProofLine(state.lines,input);
 return{...state,lines:[...state.lines,{...checked,scopeId:state.currentScopeId,scopeDepth:scopeDepth(state,state.currentScopeId)}]};
}

export function openProofAssumption(state:ScopedProofState,expression?:string):ScopedProofState{
 if(state.currentScopeId!=='root')throw new Error('This learner workspace supports one method subproof at a time.');
 if(state.method==='direct')throw new Error('Direct proof does not open a preliminary-assumption scope.');
 const parsedGoal = parseLogic(state.goal);
 const defaultConditionalAssumption = parsedGoal.kind === 'implies' ? formatLogic(parsedGoal.left) : 'P';
 const assumption = expression?.trim() || (state.method === 'conditional' ? defaultConditionalAssumption : formatLogic(expectedIndirectAssumption(state.goal)));
 if(state.method==='conditional'){
   const goal=parseLogic(state.goal);if(goal.kind!=='implies')throw new Error('Conditional Proof requires an implication as the target.');
   if(!astEquals(parseLogic(assumption),goal.left))throw new Error(`For this CP goal, the preliminary assumption must be ${formatLogic(goal.left)}.`);
 }else if(!astEquals(parseLogic(assumption),expectedIndirectAssumption(state.goal))){throw new Error(`For Indirect Proof, assume the negation of the goal: ${formatLogic(expectedIndirectAssumption(state.goal))}.`);}
 const id=`scope-${state.lines.length+1}`;const lineNumber=state.lines.length+1;const line:ScopedProofLine={expression:assumption,ruleId:'PA',references:[],lineNumber,ok:true,message:'Preliminary assumption opens a subproof.',scopeId:id,scopeDepth:1,role:'assumption'};
 const scope:ProofScope={id,parentId:'root',kind:state.method,assumptionLine:lineNumber,openedAtLine:lineNumber,goal:state.goal};
 return{...state,lines:[...state.lines,line],scopes:[...state.scopes,scope],currentScopeId:id};
}

export function closeProofScope(state:ScopedProofState):ScopedProofState{
 if(state.currentScopeId==='root')throw new Error('There is no open subproof to close.');
 const scope=scopeById(state,state.currentScopeId);const assumption=state.lines[(scope.assumptionLine??0)-1];if(!assumption)throw new Error('The subproof assumption is missing.');
 const inScope=state.lines.filter(line=>line.scopeId===scope.id&&line.ok);const last=inScope.at(-1);if(!last||last.lineNumber===assumption.lineNumber)throw new Error('Derive at least one valid line inside the subproof before closing it.');
 let expression:string,ruleId:'CP'|'IP',message:string;
 if(scope.kind==='conditional'){
   const goal=parseLogic(state.goal);if(goal.kind!=='implies')throw new Error('The CP target must be an implication.');
   if(!astEquals(parseLogic(last.expression),goal.right))throw new Error(`Derive ${formatLogic(goal.right)} inside the subproof before closing Conditional Proof.`);
   expression=formatLogic(binary('implies',parseLogic(assumption.expression),parseLogic(last.expression)));ruleId='CP';message='Conditional Proof discharges the preliminary assumption.';
   if(!astEquals(parseLogic(expression),goal))throw new Error('The closed conditional does not match the current goal.');
 }else{
   if(!contradiction(parseLogic(last.expression)))throw new Error('Indirect Proof must end the subproof with an explicit contradiction such as Q ∧ ∼Q.');
   expression=formatLogic(parseLogic(state.goal));ruleId='IP';message='Indirect Proof discharges the negated-goal assumption after a contradiction.';
 }
 const lineNumber=state.lines.length+1;const closure:ScopedProofLine={expression,ruleId,references:[assumption.lineNumber,last.lineNumber],lineNumber,ok:true,message,scopeId:'root',scopeDepth:0,role:'closure'};
 const scopes=state.scopes.map(item=>item.id===scope.id?{...item,closedAtLine:lineNumber}:item);
 return{...state,lines:[...state.lines,closure],scopes,currentScopeId:'root'};
}

export function scopedProofComplete(state:ScopedProofState):boolean{
 const last=state.lines.at(-1);if(!last?.ok||last.scopeId!=='root')return false;try{return astEquals(parseLogic(last.expression),parseLogic(state.goal))}catch{return false}
}

export function scopedProofAvailableReferences(state:ScopedProofState):number[]{return state.lines.filter(line=>line.ok&&lineAccessible(state,line,state.currentScopeId)).map(line=>line.lineNumber)}
