import type { LogicNode } from './types.ts';

const PRECEDENCE: Record<LogicNode['kind'], number> = {
  identifier: 5,
  not: 4,
  and: 3,
  or: 2,
  implies: 1,
  iff: 0
};

const SYMBOL: Record<Exclude<LogicNode['kind'], 'identifier' | 'not'>, string> = {
  and: '∧',
  or: '∨',
  implies: '→',
  iff: '↔'
};

export function formatLogic(node: LogicNode, parentPrecedence = -1): string {
  if (node.kind === 'identifier') return node.name;

  if (node.kind === 'not') {
    const operand = formatLogic(node.operand, PRECEDENCE.not);
    const text = `∼${operand}`;
    return PRECEDENCE.not < parentPrecedence ? `(${text})` : text;
  }

  const precedence = PRECEDENCE[node.kind];
  const left = formatLogic(node.left, precedence);
  const rightParentPrecedence = node.kind === 'implies' ? precedence - 1 : precedence;
  const right = formatLogic(node.right, rightParentPrecedence);
  const text = `${left} ${SYMBOL[node.kind]} ${right}`;
  return precedence < parentPrecedence ? `(${text})` : text;
}

export function collectDisplayNodes(root: LogicNode): LogicNode[] {
  const nodes: LogicNode[] = [];

  function visit(node: LogicNode): void {
    if (node.kind === 'identifier') return;
    if (node.kind === 'not') {
      visit(node.operand);
    } else {
      visit(node.left);
      visit(node.right);
    }
    nodes.push(node);
  }

  visit(root);
  return nodes;
}
