import { formatLogic, type LogicNode } from '@amat19/domain-logic';

type DisplayNode = { node: LogicNode; depth: number };

function collectStructure(root: LogicNode): DisplayNode[] {
  const output: DisplayNode[] = [];
  function visit(node: LogicNode, depth: number): void {
    if (node.kind === 'identifier') return;
    output.push({ node, depth });
    if (node.kind === 'not') visit(node.operand, depth + 1);
    else {
      visit(node.left, depth + 1);
      visit(node.right, depth + 1);
    }
  }
  visit(root, 0);
  return output;
}

export function StructureStrip({
  ast,
  selectedNodeId,
  onSelect
}: {
  ast: LogicNode;
  selectedNodeId?: string;
  onSelect: (nodeId: string) => void;
}) {
  const nodes = collectStructure(ast);
  if (nodes.length === 0) return null;

  return (
    <section aria-labelledby="structure-heading">
      <p className="truth-lab__section-label" id="structure-heading">2 · Structure</p>
      <p className="sr-only">Expressions are ordered from the complete proposition to nested computed parts.</p>
      <div className="truth-lab__structure">
        {nodes.map(({ node, depth }) => (
          <button
            type="button"
            className="truth-lab__structure-button"
            data-depth={Math.min(depth, 4)}
            data-selected={selectedNodeId === node.id}
            aria-pressed={selectedNodeId === node.id}
            aria-label={`${depth === 0 ? 'Complete expression' : `Nested level ${depth}`}: ${formatLogic(node)}`}
            onClick={() => onSelect(node.id)}
            key={node.id}
          >
            <span aria-hidden="true">{depth === 0 ? 'Result' : `↳ ${depth}`}</span>
            {formatLogic(node)}
          </button>
        ))}
      </div>
    </section>
  );
}
