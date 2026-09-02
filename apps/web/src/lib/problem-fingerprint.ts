import { formatLogic, parseLogic, type LogicNode, type TruthTable } from '@amat19/domain-logic';

export function canonicalLogicExpression(expression:string):string{return formatLogic(parseLogic(expression));}
export function truthTableProblemFingerprint(table:TruthTable,purpose:string,columnId?:string):string{
 const column=columnId?table.columns.find(item=>item.id===columnId):undefined;
 return JSON.stringify({kind:'truth-table',purpose,expression:formatLogic(table.ast),column:column?.label});
}
export function argumentProblemFingerprint(premises:readonly LogicNode[],conclusion:LogicNode):string{
 return JSON.stringify({kind:'argument-validity',premises:premises.map(formatLogic),conclusion:formatLogic(conclusion)});
}
