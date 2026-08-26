import type { TruthTable } from '@amat19/domain-logic';
import type { PracticeGuess, SelectedCell } from './logic-state';

function tf(value: boolean): 'T' | 'F' {
  return value ? 'T' : 'F';
}

export function TruthTableView({
  table,
  mode,
  selectedNodeId,
  selectedCell,
  practiceColumnId,
  practiceGuesses,
  selectedPracticeRow,
  onSelectCell,
  onSelectPracticeRow
}: {
  table: TruthTable;
  mode: 'explore' | 'practice';
  selectedNodeId?: string;
  selectedCell?: SelectedCell;
  practiceColumnId?: string;
  practiceGuesses: Record<number, PracticeGuess>;
  selectedPracticeRow: number;
  onSelectCell: (cell: SelectedCell) => void;
  onSelectPracticeRow: (rowIndex: number) => void;
}) {
  return (
    <section aria-labelledby="table-heading">
      <p className="truth-lab__section-label" id="table-heading">3 · Evaluate the rows</p>
      <div className="truth-table-scroll" tabIndex={0} aria-label="Scrollable truth table region">
        <table className="truth-table">
          <caption className="sr-only">
            Truth table for {table.expression}. {table.rows.length} rows for {table.symbols.length} unique symbols.
          </caption>
          <thead>
            <tr>
              {table.columns.map((column) => (
                <th
                  scope="col"
                  key={column.id}
                  data-result={column.kind === 'result'}
                  data-selected={Boolean(column.nodeId && selectedNodeId === column.nodeId)}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row) => (
              <tr key={row.index}>
                {table.columns.map((column) => {
                  const isPracticeTarget = mode === 'practice' && column.id === practiceColumnId;
                  const value = row.values[column.id]!;
                  const isSelected = selectedCell?.rowIndex === row.index && selectedCell.columnId === column.id;

                  return (
                    <td key={column.id} data-selected={isSelected}>
                      {isPracticeTarget ? (
                        <button
                          type="button"
                          className="truth-table__practice-cell"
                          data-status={practiceGuesses[row.index]?.status}
                          aria-label={`Practice row ${row.index + 1}, ${column.label}, ${practiceGuesses[row.index] ? `answered ${tf(practiceGuesses[row.index]!.value)}` : 'unanswered'}`}
                          aria-pressed={selectedPracticeRow === row.index}
                          onClick={() => onSelectPracticeRow(row.index)}
                        >
                          {practiceGuesses[row.index] ? tf(practiceGuesses[row.index]!.value) : '?'}
                        </button>
                      ) : column.kind === 'variable' ? (
                        <span aria-label={value ? 'true' : 'false'}>{tf(value)}</span>
                      ) : (
                        <button
                          type="button"
                          className="truth-table__cell-button"
                          aria-label={`Row ${row.index + 1}, ${column.label}: ${value ? 'true' : 'false'}. Show why.`}
                          onClick={() => onSelectCell({ rowIndex: row.index, columnId: column.id, nodeId: column.nodeId })}
                        >
                          {tf(value)}
                        </button>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
