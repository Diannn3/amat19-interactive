import { evaluateLogic } from './evaluate.ts';
import { parseLogic } from './parser.ts';
import { generateAssignments } from './truth-table.ts';
import type { Assignment, LogicNode } from './types.ts';
import { extractSymbols } from './variables.ts';

export type ArgumentValidityResult = {
  valid: boolean;
  symbols: string[];
  counterexamples: Assignment[];
};

export function checkArgumentValidityAst(
  premises: LogicNode[],
  conclusion: LogicNode
): ArgumentValidityResult {
  const symbols = [...new Set([...premises.flatMap(extractSymbols), ...extractSymbols(conclusion)])]
    .sort((a, b) => a.localeCompare(b));

  const counterexamples = generateAssignments(symbols).filter((assignment) => {
    const allPremisesTrue = premises.every((premise) => evaluateLogic(premise, assignment).value);
    const conclusionFalse = !evaluateLogic(conclusion, assignment).value;
    return allPremisesTrue && conclusionFalse;
  });

  return { valid: counterexamples.length === 0, symbols, counterexamples };
}

export function checkArgumentValidity(premises: string[], conclusion: string): ArgumentValidityResult {
  return checkArgumentValidityAst(premises.map(parseLogic), parseLogic(conclusion));
}
