import { evaluateLogic, type TruthTable } from '@amat19/domain-logic';
import { Lightbulb, MousePointer2 } from 'lucide-react';
import type { SelectedCell } from './logic-state';

function tf(value: boolean): 'T' | 'F' {
  return value ? 'T' : 'F';
}

export function EvaluationPanel({
  table,
  selectedCell,
  selectedNodeId
}: {
  table: TruthTable;
  selectedCell?: SelectedCell;
  selectedNodeId?: string;
}) {
  const rowIndex = selectedCell?.rowIndex ?? 0;
  const row = table.rows[rowIndex];
  const nodeId = selectedCell?.nodeId ?? selectedNodeId ?? table.ast.id;
  const evaluation = row ? evaluateLogic(table.ast, row.assignment) : undefined;
  const step = evaluation?.byNodeId[nodeId];

  return (
    <aside className="truth-lab__panel" aria-labelledby="why-heading">
      <h2 id="why-heading">{step ? step.expression : 'Select a result'}</h2>
      <p className="truth-lab__section-label">Why / Steps</p>
      {!step || !row ? (
        <p><MousePointer2 size={17} aria-hidden="true" /> Select any computed cell to inspect its connective rule.</p>
      ) : (
        <>
          <p><strong>{step.expression}</strong> evaluates to <strong>{tf(step.value)}</strong> on row {row.index + 1}.</p>
          <div className="truth-lab__assignment" aria-label={`Assignment for row ${row.index + 1}`}>
            {table.symbols.map((symbol) => (
              <span key={symbol}>{symbol} = {tf(row.assignment[symbol]!)}</span>
            ))}
          </div>
          <p><Lightbulb size={17} aria-hidden="true" /> {step.explanation}</p>
          {step.childValues.length > 0 && (
            <p>
              Operand value{step.childValues.length > 1 ? 's' : ''}: <strong>{step.childValues.map(tf).join(', ')}</strong>
            </p>
          )}
        </>
      )}
    </aside>
  );
}
