import { evaluateLogic } from './evaluate.ts';
import { parseLogic } from './parser.ts';
import { generateAssignments } from './truth-table.ts';
import type { Assignment, LogicNode } from './types.ts';
import { extractSymbols } from './variables.ts';

export type EquivalenceResult = {
  equivalent: boolean;
  symbols: string[];
  counterexample?: Assignment;
};

function unionSymbols(a: LogicNode, b: LogicNode): string[] {
  return [...new Set([...extractSymbols(a), ...extractSymbols(b)])].sort((x, y) => x.localeCompare(y));
}

export function checkEquivalenceAst(a: LogicNode, b: LogicNode): EquivalenceResult {
  const symbols = unionSymbols(a, b);
  for (const assignment of generateAssignments(symbols)) {
    if (evaluateLogic(a, assignment).value !== evaluateLogic(b, assignment).value) {
      return { equivalent: false, symbols, counterexample: assignment };
    }
  }
  return { equivalent: true, symbols };
}

export function checkEquivalence(a: string, b: string): EquivalenceResult {
  return checkEquivalenceAst(parseLogic(a), parseLogic(b));
}
