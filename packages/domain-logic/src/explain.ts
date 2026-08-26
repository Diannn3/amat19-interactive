import { evaluateLogic } from './evaluate.ts';
import type { Assignment, EvaluationStep, LogicNode } from './types.ts';

export function explainNodeForAssignment(
  root: LogicNode,
  assignment: Assignment,
  nodeId: string
): EvaluationStep | undefined {
  return evaluateLogic(root, assignment).byNodeId[nodeId];
}
