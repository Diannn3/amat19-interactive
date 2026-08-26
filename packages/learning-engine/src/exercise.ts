import type { ModuleId } from './contracts.ts'; import type { HintPlanStep } from './hints.ts';
export type ExerciseMode='worked'|'faded'|'guided'|'independent'|'diagnose'|'transfer';
export type ExerciseDefinition<TModel=unknown,TPrompt=string>={id:string;module:ModuleId;skillIds:string[];mode:ExerciseMode;seed?:string;prompt:TPrompt;initialModel:TModel;hintPlan:HintPlanStep[];misconceptionTargets:string[];};
