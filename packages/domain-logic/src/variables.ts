import type { LogicNode } from './types.ts';

export function extractSymbols(root: LogicNode): string[] {
  const symbols = new Set<string>();

  function visit(node: LogicNode): void {
    if (node.kind === 'identifier') {
      symbols.add(node.name);
      return;
    }
    if (node.kind === 'not') {
      visit(node.operand);
      return;
    }
    visit(node.left);
    visit(node.right);
  }

  visit(root);
  return [...symbols].sort((a, b) => a.localeCompare(b));
}
