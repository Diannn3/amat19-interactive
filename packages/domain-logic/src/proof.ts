import { checkEquivalenceAst } from './equivalence.ts';
import { parseLogic } from './parser.ts';
import { astEquals, binary, logicSignature, not } from './structural.ts';
import type { LogicNode } from './types.ts';

export type EquivalenceRuleId = 'DM' | 'DP' | 'TR' | 'MI' | 'ME' | 'EX' | 'T' | 'DN' | 'AS' | 'CM';
export type InferenceRuleId = 'AD' | 'CJ' | 'SP' | 'MP' | 'MT' | 'DS' | 'HS' | 'CD' | 'DD';
export type ProofRuleId = EquivalenceRuleId | InferenceRuleId | 'Premise' | 'PA' | 'CP' | 'IP';
export type ProofRule = { id: ProofRuleId; name: string; family: 'equivalence' | 'inference' | 'method'; referenceCount: number | 'variable'; description: string; };
export const PROOF_RULES: readonly ProofRule[] = [
  { id:'DM', name:'De Morgan’s Law', family:'equivalence', referenceCount:1, description:'Move negation across ∧/∨ and switch the connective.' },
  { id:'DP', name:'Distributive Property', family:'equivalence', referenceCount:1, description:'Distribute ∧ over ∨ or ∨ over ∧.' },
  { id:'TR', name:'Transposition', family:'equivalence', referenceCount:1, description:'P → Q is equivalent to ∼Q → ∼P.' },
  { id:'MI', name:'Material Implication', family:'equivalence', referenceCount:1, description:'P → Q is equivalent to ∼P ∨ Q.' },
  { id:'ME', name:'Material Equivalence', family:'equivalence', referenceCount:1, description:'P ↔ Q is equivalent to (P → Q) ∧ (Q → P).' },
  { id:'EX', name:'Exportation', family:'equivalence', referenceCount:1, description:'P → (Q → R) is equivalent to (P ∧ Q) → R.' },
  { id:'T', name:'Tautology', family:'equivalence', referenceCount:1, description:'P ∨ P and P ∧ P are equivalent to P.' },
  { id:'DN', name:'Double Negation', family:'equivalence', referenceCount:1, description:'P is equivalent to ∼∼P.' },
  { id:'AS', name:'Association', family:'equivalence', referenceCount:1, description:'Regroup repeated ∧ or ∨ connectives.' },
  { id:'CM', name:'Commutation', family:'equivalence', referenceCount:1, description:'Swap operands of ∧ or ∨.' },
  { id:'AD', name:'Addition', family:'inference', referenceCount:1, description:'From P, infer P ∨ Q.' },
  { id:'CJ', name:'Conjunction', family:'inference', referenceCount:2, description:'From P and Q, infer P ∧ Q.' },
  { id:'SP', name:'Simplification', family:'inference', referenceCount:1, description:'From P ∧ Q, infer either conjunct.' },
  { id:'MP', name:'Modus Ponens', family:'inference', referenceCount:2, description:'From P → Q and P, infer Q.' },
  { id:'MT', name:'Modus Tollens', family:'inference', referenceCount:2, description:'From P → Q and ∼Q, infer ∼P.' },
  { id:'DS', name:'Disjunctive Syllogism', family:'inference', referenceCount:2, description:'From P ∨ Q and the negation of one disjunct, infer the other.' },
  { id:'HS', name:'Hypothetical Syllogism', family:'inference', referenceCount:2, description:'Chain P → Q and Q → R to infer P → R.' },
  { id:'CD', name:'Constructive Dilemma', family:'inference', referenceCount:2, description:'Use two conditionals plus the disjunction of antecedents.' },
  { id:'DD', name:'Destructive Dilemma', family:'inference', referenceCount:2, description:'Use two conditionals plus the disjunction of negated consequents.' },
  { id:'PA', name:'Preliminary Assumption', family:'method', referenceCount:0, description:'Open a conditional or indirect proof assumption.' },
  { id:'CP', name:'Conditional Proof', family:'method', referenceCount:'variable', description:'Close a conditional proof after deriving its consequent.' },
  { id:'IP', name:'Indirect Proof', family:'method', referenceCount:'variable', description:'Close an indirect proof after deriving a contradiction.' }
] as const;

function replaceChild(parent: LogicNode, side: 'operand'|'left'|'right', child: LogicNode): LogicNode {
  if (parent.kind === 'not' && side === 'operand') return { ...parent, operand: child };
  if (parent.kind !== 'identifier' && parent.kind !== 'not' && side !== 'operand') return side === 'left' ? { ...parent, left: child } : { ...parent, right: child };
  return parent;
}
function localRewrites(node: LogicNode, rule: EquivalenceRuleId): LogicNode[] {
  const out: LogicNode[] = [], add=(candidate?:LogicNode)=>{ if(candidate) out.push(candidate); };
  if (rule==='DM') {
    if(node.kind==='not'&&node.operand.kind==='or') add(binary('and',not(node.operand.left),not(node.operand.right)));
    if(node.kind==='not'&&node.operand.kind==='and') add(binary('or',not(node.operand.left),not(node.operand.right)));
    if(node.kind==='and'&&node.left.kind==='not'&&node.right.kind==='not') add(not(binary('or',node.left.operand,node.right.operand)));
    if(node.kind==='or'&&node.left.kind==='not'&&node.right.kind==='not') add(not(binary('and',node.left.operand,node.right.operand)));
  }
  if (rule==='TR'&&node.kind==='implies') {
    add(binary('implies',not(node.right),not(node.left)));
    if(node.left.kind==='not'&&node.right.kind==='not') add(binary('implies',node.right.operand,node.left.operand));
  }
  if (rule==='MI') {
    if(node.kind==='implies') add(binary('or',not(node.left),node.right));
    if(node.kind==='or'&&node.left.kind==='not') add(binary('implies',node.left.operand,node.right));
  }
  if (rule==='ME') {
    if(node.kind==='iff') add(binary('and',binary('implies',node.left,node.right),binary('implies',node.right,node.left)));
    if(node.kind==='and'&&node.left.kind==='implies'&&node.right.kind==='implies'&&astEquals(node.left.left,node.right.right)&&astEquals(node.left.right,node.right.left)) add(binary('iff',node.left.left,node.left.right));
  }
  if (rule==='EX') {
    if(node.kind==='implies'&&node.right.kind==='implies') add(binary('implies',binary('and',node.left,node.right.left),node.right.right));
    if(node.kind==='implies'&&node.left.kind==='and') add(binary('implies',node.left.left,binary('implies',node.left.right,node.right)));
  }
  if (rule==='T') {
    if((node.kind==='and'||node.kind==='or')&&astEquals(node.left,node.right)) add(node.left);
    add(binary('and',node,node)); add(binary('or',node,node));
  }
  if (rule==='DN') { if(node.kind==='not'&&node.operand.kind==='not') add(node.operand.operand); add(not(not(node))); }
  if (rule==='AS') {
    if((node.kind==='and'||node.kind==='or')&&node.left.kind===node.kind) add(binary(node.kind,node.left.left,binary(node.kind,node.left.right,node.right)));
    if((node.kind==='and'||node.kind==='or')&&node.right.kind===node.kind) add(binary(node.kind,binary(node.kind,node.left,node.right.left),node.right.right));
  }
  if (rule==='CM'&&(node.kind==='and'||node.kind==='or')) add(binary(node.kind,node.right,node.left));
  if (rule==='DP') {
    if(node.kind==='and'&&node.right.kind==='or') add(binary('or',binary('and',node.left,node.right.left),binary('and',node.left,node.right.right)));
    if(node.kind==='or'&&node.right.kind==='and') add(binary('and',binary('or',node.left,node.right.left),binary('or',node.left,node.right.right)));
    if(node.kind==='or'&&node.left.kind==='and'&&node.right.kind==='and'&&astEquals(node.left.left,node.right.left)) add(binary('and',node.left.left,binary('or',node.left.right,node.right.right)));
    if(node.kind==='and'&&node.left.kind==='or'&&node.right.kind==='or'&&astEquals(node.left.left,node.right.left)) add(binary('or',node.left.left,binary('and',node.left.right,node.right.right)));
  }
  return out;
}
function oneStepRewrites(node: LogicNode, rule: EquivalenceRuleId): LogicNode[] {
  const candidates=[...localRewrites(node,rule)];
  if(node.kind==='not') for(const child of oneStepRewrites(node.operand,rule)) candidates.push(replaceChild(node,'operand',child));
  else if(node.kind!=='identifier') {
    for(const child of oneStepRewrites(node.left,rule)) candidates.push(replaceChild(node,'left',child));
    for(const child of oneStepRewrites(node.right,rule)) candidates.push(replaceChild(node,'right',child));
  }
  return [...new Map(candidates.map(c=>[logicSignature(c),c])).values()];
}
export type RuleCheckResult={ok:boolean;message:string;ruleId:ProofRuleId;acceptedAlternative?:boolean;};
export function checkEquivalenceRewrite(source:LogicNode|string,target:LogicNode|string,rule:EquivalenceRuleId):RuleCheckResult{
  const from=typeof source==='string'?parseLogic(source):source,to=typeof target==='string'?parseLogic(target):target;
  if(astEquals(from,to)) return {ok:false,ruleId:rule,message:'The line did not change; apply the selected rule to a matching subexpression.'};
  if(oneStepRewrites(from,rule).some(c=>astEquals(c,to))) return {ok:true,ruleId:rule,message:`${rule} is a valid one-step rewrite.`};
  const semantic=checkEquivalenceAst(from,to).equivalent;
  return {ok:false,ruleId:rule,message:semantic?`The expressions are equivalent, but this exact change is not one application of ${rule}.`:`The proposed line is not equivalent to the referenced line, so ${rule} cannot justify it.`};
}
function isNotOf(node:LogicNode,target:LogicNode){return node.kind==='not'&&astEquals(node.operand,target);}
function byKind(nodes:LogicNode[],kind:'implies'|'or'|'and'){return nodes.find(n=>n.kind===kind);}
export function checkInference(rule:InferenceRuleId,references:LogicNode[],target:LogicNode):RuleCheckResult{
  const fail=(message:string):RuleCheckResult=>({ok:false,ruleId:rule,message}),pass=(message:string):RuleCheckResult=>({ok:true,ruleId:rule,message});
  if(rule==='AD'){
    if(references.length!==1||target.kind!=='or') return fail('Addition needs one cited line and a disjunction as the new line.');
    return astEquals(target.left,references[0]!)||astEquals(target.right,references[0]!)?pass('Addition is valid.'):fail('One disjunct must be the cited proposition.');
  }
  if(rule==='CJ'){
    if(references.length!==2||target.kind!=='and') return fail('Conjunction needs two cited lines and a conjunction as the new line.');
    const ok=(astEquals(target.left,references[0]!)&&astEquals(target.right,references[1]!))||(astEquals(target.left,references[1]!)&&astEquals(target.right,references[0]!));
    return ok?pass('Conjunction is valid.'):fail('The two conjuncts must be exactly the two cited lines.');
  }
  if(rule==='SP'){
    if(references.length!==1) return fail('Simplification needs one cited conjunction.');
    const c=references[0]!;
    if(c.kind!=='and') return fail('Simplification needs one cited conjunction.');
    return astEquals(target,c.left)||astEquals(target,c.right)?pass('Simplification is valid.'):fail('The new line must be one conjunct of the cited conjunction.');
  }
  if(rule==='MP'||rule==='MT'){
    if(references.length!==2) return fail(`${rule} needs two cited lines.`);
    const imp=byKind(references,'implies'); if(!imp||imp.kind!=='implies') return fail(`${rule} requires a conditional among the cited lines.`);
    const other=references.find(n=>n!==imp)!;
    if(rule==='MP'&&astEquals(other,imp.left)&&astEquals(target,imp.right)) return pass('Modus Ponens is valid.');
    if(rule==='MT'&&isNotOf(other,imp.right)&&isNotOf(target,imp.left)) return pass('Modus Tollens is valid.');
    return fail(rule==='MP'?'Cite P → Q together with P, then infer Q.':'Cite P → Q together with ∼Q, then infer ∼P.');
  }
  if(rule==='DS'){
    if(references.length!==2) return fail('Disjunctive Syllogism needs two cited lines.');
    const disj=byKind(references,'or'); if(!disj||disj.kind!=='or') return fail('One cited line must be a disjunction.');
    const other=references.find(n=>n!==disj)!;
    if(isNotOf(other,disj.left)&&astEquals(target,disj.right)) return pass('Disjunctive Syllogism is valid.');
    if(isNotOf(other,disj.right)&&astEquals(target,disj.left)) return pass('Disjunctive Syllogism is valid.');
    return fail('Negate one disjunct, then infer the other.');
  }
  if(rule==='HS'){
    if(references.length!==2||target.kind!=='implies') return fail('Hypothetical Syllogism needs two conditionals and produces a conditional.');
    const a=references[0]!,b=references[1]!;
    if(a.kind!=='implies'||b.kind!=='implies') return fail('Hypothetical Syllogism needs two conditionals and produces a conditional.');
    const direct=astEquals(a.right,b.left)&&astEquals(target.left,a.left)&&astEquals(target.right,b.right);
    const reverse=astEquals(b.right,a.left)&&astEquals(target.left,b.left)&&astEquals(target.right,a.right);
    return direct||reverse?pass('Hypothetical Syllogism is valid.'):fail('The consequent of one conditional must match the antecedent of the other.');
  }
  if(rule==='CD'||rule==='DD'){
    if(references.length!==2) return fail(`${rule} needs two cited lines.`);
    const conj=byKind(references,'and'),disj=byKind(references,'or');
    if(!conj||conj.kind!=='and'||conj.left.kind!=='implies'||conj.right.kind!=='implies'||!disj||disj.kind!=='or') return fail(`${rule} requires a conjunction of two conditionals plus a disjunction.`);
    const first=conj.left,second=conj.right;
    if(rule==='CD'){
      const antecedents=astEquals(disj.left,first.left)&&astEquals(disj.right,second.left);
      const result=target.kind==='or'&&astEquals(target.left,first.right)&&astEquals(target.right,second.right);
      return antecedents&&result?pass('Constructive Dilemma is valid.'):fail('The disjunction must contain the antecedents and the result the corresponding consequents.');
    }
    const neg=isNotOf(disj.left,first.right)&&isNotOf(disj.right,second.right);
    const result=target.kind==='or'&&isNotOf(target.left,first.left)&&isNotOf(target.right,second.left);
    return neg&&result?pass('Destructive Dilemma is valid.'):fail('Use negated consequents to infer negated antecedents.');
  }
  return fail(`Rule ${rule} is not implemented.`);
}
export type ProofLineInput={expression:string;ruleId:ProofRuleId;references:number[];};
export type CheckedProofLine=ProofLineInput&{lineNumber:number;ok:boolean;message:string;};
export function validateProofLine(previous:CheckedProofLine[],input:ProofLineInput):CheckedProofLine{
  const lineNumber=previous.length+1;
  try{
    const target=parseLogic(input.expression);
    if(input.ruleId==='Premise'||input.ruleId==='PA') return {...input,lineNumber,ok:input.references.length===0,message:input.references.length===0?`${input.ruleId} accepted.`:`${input.ruleId} does not cite earlier lines.`};
    const bad=input.references.find(ref=>!Number.isInteger(ref)||ref<1||ref>=lineNumber);
    if(bad!==undefined) return {...input,lineNumber,ok:false,message:`Line ${bad} is not an available earlier line.`};
    const cited=input.references.map(ref=>previous[ref-1]!).filter(l=>l.ok).map(l=>parseLogic(l.expression));
    if(cited.length!==input.references.length) return {...input,lineNumber,ok:false,message:'Every cited line must already be valid.'};
    const eq:EquivalenceRuleId[]=['DM','DP','TR','MI','ME','EX','T','DN','AS','CM'];
    if(eq.includes(input.ruleId as EquivalenceRuleId)){
      if(cited.length!==1) return {...input,lineNumber,ok:false,message:`${input.ruleId} requires exactly one cited line.`};
      const result=checkEquivalenceRewrite(cited[0]!,target,input.ruleId as EquivalenceRuleId);
      return {...input,lineNumber,ok:result.ok,message:result.message};
    }
    const inf:InferenceRuleId[]=['AD','CJ','SP','MP','MT','DS','HS','CD','DD'];
    if(inf.includes(input.ruleId as InferenceRuleId)){
      const result=checkInference(input.ruleId as InferenceRuleId,cited,target);
      return {...input,lineNumber,ok:result.ok,message:result.message};
    }
    return {...input,lineNumber,ok:false,message:`${input.ruleId} is a proof-method closure; use the method workspace rather than a normal derivation line.`};
  }catch(error){return {...input,lineNumber,ok:false,message:error instanceof Error?error.message:'The proof line could not be parsed.'};}
}
export function proofReachesConclusion(lines:CheckedProofLine[],conclusion:string):boolean{
  const last=lines.at(-1); if(!last?.ok) return false;
  try{return astEquals(parseLogic(last.expression),parseLogic(conclusion));}catch{return false;}
}
