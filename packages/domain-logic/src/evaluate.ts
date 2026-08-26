import { formatLogic } from './format.ts';
import type { Assignment, EvaluationResult, EvaluationStep, LogicNode } from './types.ts';

function boolWord(value: boolean): string {
  return value ? 'true' : 'false';
}

function explanationFor(node: LogicNode, childValues: boolean[], value: boolean): string {
  switch (node.kind) {
    case 'identifier':
      return `${node.name} is ${boolWord(value)} in this row.`;
    case 'not':
      return `Negation reverses ${boolWord(childValues[0]!)} to ${boolWord(value)}.`;
    case 'and':
      return value
        ? 'A conjunction is true because both operands are true.'
        : 'A conjunction is false because at least one operand is false.';
    case 'or':
      return value
        ? 'Inclusive OR is true because at least one operand is true.'
        : 'Inclusive OR is false only when both operands are false.';
    case 'implies':
      return value
        ? 'A material implication is true in every case except a true antecedent with a false consequent.'
        : 'The implication is false because the antecedent is true and the consequent is false.';
    case 'iff':
      return value
        ? 'A biconditional is true because both operands have the same truth value.'
        : 'A biconditional is false because the operands have different truth values.';
  }
}

export function evaluateLogic(root: LogicNode, assignment: Assignment): EvaluationResult {
  const byNodeId: Record<string, EvaluationStep> = {};

  function visit(node: LogicNode): boolean {
    let childValues: boolean[] = [];
    let value: boolean;

    switch (node.kind) {
      case 'identifier': {
        const assigned = assignment[node.name];
        if (assigned === undefined) {
          throw new Error(`Missing truth value for ${node.name}.`);
        }
        value = assigned;
        break;
      }
      case 'not': {
        const operand = visit(node.operand);
        childValues = [operand];
        value = !operand;
        break;
      }
      case 'and': {
        const left = visit(node.left);
        const right = visit(node.right);
        childValues = [left, right];
        value = left && right;
        break;
      }
      case 'or': {
        const left = visit(node.left);
        const right = visit(node.right);
        childValues = [left, right];
        value = left || right;
        break;
      }
      case 'implies': {
        const left = visit(node.left);
        const right = visit(node.right);
        childValues = [left, right];
        value = !left || right;
        break;
      }
      case 'iff': {
        const left = visit(node.left);
        const right = visit(node.right);
        childValues = [left, right];
        value = left === right;
        break;
      }
    }

    byNodeId[node.id] = {
      nodeId: node.id,
      nodeKind: node.kind,
      expression: formatLogic(node),
      value,
      childValues,
      explanation: explanationFor(node, childValues, value)
    };
    return value;
  }

  const value = visit(root);
  return { value, byNodeId };
}
