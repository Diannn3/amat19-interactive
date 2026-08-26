import type { LogicNode } from './types.ts';
export function astEquals(a: LogicNode, b: LogicNode): boolean {
  if (a.kind !== b.kind) return false;
  if (a.kind === 'identifier' && b.kind === 'identifier') return a.name === b.name;
  if (a.kind === 'not' && b.kind === 'not') return astEquals(a.operand, b.operand);
  if (a.kind === 'identifier' || b.kind === 'identifier' || a.kind === 'not' || b.kind === 'not') return false;
  return astEquals(a.left, b.left) && astEquals(a.right, b.right);
}
export function logicSignature(node: LogicNode): string {
  if (node.kind === 'identifier') return node.name;
  if (node.kind === 'not') return `~${logicSignature(node.operand)}`;
  return `${node.kind}(${logicSignature(node.left)},${logicSignature(node.right)})`;
}
let syntheticId = 0;
const span = { start: 0, end: 0 };
export function not(operand: LogicNode): LogicNode { return { kind: 'not', id: `synthetic:${syntheticId++}`, operand, span }; }
export function binary(kind: 'and' | 'or' | 'implies' | 'iff', left: LogicNode, right: LogicNode): LogicNode {
  return { kind, id: `synthetic:${syntheticId++}`, left, right, span };
}
