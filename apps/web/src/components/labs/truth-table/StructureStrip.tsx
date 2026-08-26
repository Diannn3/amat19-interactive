import { collectDisplayNodes, formatLogic, type LogicNode } from '@amat19/domain-logic';

export function StructureStrip({
  ast,
  selectedNodeId,
  onSelect
}: {
  ast: LogicNode;
  selectedNodeId?: string;
  onSelect: (nodeId: string) => void;
}) {
  const nodes = collectDisplayNodes(ast);
  if (nodes.length === 0) return null;

  return (
    <section aria-labelledby="structure-heading">
      <p className="truth-lab__section-label" id="structure-heading">2 · Structure</p>
      <div className="truth-lab__structure">
        {nodes.map((node) => (
          <button
            type="button"
            className="truth-lab__structure-button"
            data-selected={selectedNodeId === node.id}
            aria-pressed={selectedNodeId === node.id}
            onClick={() => onSelect(node.id)}
            key={node.id}
          >
            {formatLogic(node)}
          </button>
        ))}
      </div>
    </section>
  );
}
