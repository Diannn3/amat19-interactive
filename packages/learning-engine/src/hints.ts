export type HintPlanStep={id:string;level:'nudge'|'focus'|'next-step'|'worked';text:string;revealsAnswer?:boolean;};
export type HintPlan={skillId:string;steps:HintPlanStep[];};
export function nextHint(plan:HintPlan,usedHintIds:string[]):HintPlanStep|undefined{return plan.steps.find(step=>!usedHintIds.includes(step.id));}
export function hintsRevealedAnswer(plan:HintPlan,usedHintIds:string[]):boolean{return plan.steps.some(step=>step.revealsAnswer&&usedHintIds.includes(step.id));}
