import { Rational, sumRationals, type RationalLike } from '@amat19/math-core';
export const MAX_PROBABILITY_TREE_DEPTH=32;
export const MAX_PROBABILITY_TREE_NODES=4_096;
export type ProbabilityBranch={id:string;label:string;probability:RationalLike;children?:ProbabilityBranch[]};
export type ProbabilityPath={ids:string[];labels:string[];probability:Rational};
function validateLevel(branches:ProbabilityBranch[],depth:number,counter:{nodes:number},parentLabel?:string):void{
 if(depth>MAX_PROBABILITY_TREE_DEPTH)throw new RangeError(`Probability tree cannot exceed depth ${MAX_PROBABILITY_TREE_DEPTH}.`);
 if(branches.length>MAX_PROBABILITY_TREE_NODES-counter.nodes)throw new RangeError(`Probability tree cannot exceed ${MAX_PROBABILITY_TREE_NODES.toLocaleString()} nodes.`);
 const sum=sumRationals(branches.map(branch=>branch.probability));if(!sum.equals(1))throw new RangeError(`${parentLabel?`Children of ${parentLabel}`:'First-stage probabilities'} must sum exactly to 1; received ${sum}.`);
 for(const branch of branches){counter.nodes+=1;if(counter.nodes>MAX_PROBABILITY_TREE_NODES)throw new RangeError(`Probability tree cannot exceed ${MAX_PROBABILITY_TREE_NODES.toLocaleString()} nodes.`);const p=Rational.from(branch.probability);if(!p.isProbability())throw new RangeError(`Branch ${branch.label} must have probability between 0 and 1.`);if(branch.children?.length)validateLevel(branch.children,depth+1,counter,branch.label);}
}
export function validateProbabilityTree(branches:ProbabilityBranch[]):void{if(!branches.length)throw new RangeError('A probability tree needs at least one first-stage branch.');validateLevel(branches,1,{nodes:0});}
export function enumerateProbabilityPaths(branches:ProbabilityBranch[]):ProbabilityPath[]{validateProbabilityTree(branches);const out:ProbabilityPath[]=[];function walk(branch:ProbabilityBranch,ids:string[],labels:string[],probability:Rational,depth:number){if(depth>MAX_PROBABILITY_TREE_DEPTH)throw new RangeError(`Probability tree cannot exceed depth ${MAX_PROBABILITY_TREE_DEPTH}.`);const next=probability.multiply(branch.probability),nextIds=[...ids,branch.id],nextLabels=[...labels,branch.label];if(branch.children?.length)branch.children.forEach(child=>walk(child,nextIds,nextLabels,next,depth+1));else out.push({ids:nextIds,labels:nextLabels,probability:next})}branches.forEach(branch=>walk(branch,[],[],Rational.one(),1));return out}
export function probabilityOfPaths(branches:ProbabilityBranch[],predicate:(path:ProbabilityPath)=>boolean):Rational{return sumRationals(enumerateProbabilityPaths(branches).filter(predicate).map(path=>path.probability))}
