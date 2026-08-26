import type { AttemptEvent,AttemptRecord,ModuleId } from './contracts.ts';
export function createAttempt(input:{attemptId:string;exerciseId:string;module:ModuleId;now:string}):AttemptRecord{
  return {attemptId:input.attemptId,exerciseId:input.exerciseId,module:input.module,startedAt:input.now,updatedAt:input.now,actions:[],checks:[],hintsUsed:[],finalState:'incomplete',masteryEvidence:[]};
}
export function reduceAttempt(state:AttemptRecord,event:AttemptEvent):AttemptRecord{
  switch(event.type){
    case'action':return{...state,updatedAt:event.action.at,actions:[...state.actions,event.action]};
    case'check':return{...state,updatedAt:event.at,checks:[...state.checks,event.check],finalState:event.check.ok?'correct':state.finalState};
    case'hint-used':return{...state,updatedAt:event.at,hintsUsed:state.hintsUsed.includes(event.hintId)?state.hintsUsed:[...state.hintsUsed,event.hintId]};
    case'mastery-evidence':return{...state,updatedAt:event.at,masteryEvidence:[...state.masteryEvidence,event.evidence]};
    case'finish':return{...state,updatedAt:event.at,finalState:event.state};
  }
}
