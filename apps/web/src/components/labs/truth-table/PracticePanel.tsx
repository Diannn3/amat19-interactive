import { evaluateLogic, type TruthTable } from '@amat19/domain-logic';
import { checkTruthGuess } from '@amat19/learning-engine';
import { Check, Eraser, Lightbulb } from 'lucide-react';
import { Button } from '../../ui/Button';
import type { Dispatch } from 'react';
import type { TruthLabAction, TruthLabState } from './logic-state';

export function PracticePanel({
  table,
  practiceColumnId,
  state,
  dispatch
}: {
  table: TruthTable;
  practiceColumnId: string;
  state: TruthLabState;
  dispatch: Dispatch<TruthLabAction>;
}) {
  const row = table.rows[state.selectedPracticeRow] ?? table.rows[0];
  const targetColumn = table.columns.find((column) => column.id === practiceColumnId) ?? table.columns.at(-1);
  if (!row || !targetColumn || !targetColumn.nodeId) return null;

  const expected = row.values[targetColumn.id]!;
  const completed = Object.values(state.practiceGuesses).filter((guess) => guess.status === 'correct').length;
  const evaluation = evaluateLogic(table.ast, row.assignment);
  const hint = evaluation.byNodeId[targetColumn.nodeId]?.explanation;

  function answer(guess: boolean): void {
    const feedback = checkTruthGuess({
      expected,
      guess,
      rowIndex: row.index,
      objectId: targetColumn.id
    });
    dispatch({
      type: 'record-practice-guess',
      rowIndex: row.index,
      value: guess,
      status: feedback.ok ? 'correct' : 'wrong',
      feedback
    });
  }

  return (
    <aside className="truth-lab__panel" aria-labelledby="practice-heading">
      <p className="truth-lab__section-label">Practice</p>
      <h2 id="practice-heading">Fill “{targetColumn.label}”</h2>
      <p>
        Row {row.index + 1} of {table.rows.length}. Choose a different computed expression in the Structure strip to
        practice another column without changing the proposition.
      </p>
      <div className="truth-lab__assignment">
        {table.symbols.map((symbol) => (
          <span key={symbol}>{symbol} = {row.assignment[symbol] ? 'T' : 'F'}</span>
        ))}
      </div>
      <div className="truth-lab__practice-actions">
        <Button variant="answer" type="button" onClick={() => answer(true)}>T · True</Button>
        <Button variant="answer" type="button" onClick={() => answer(false)}>F · False</Button>
        <Button variant="ghost" type="button" onClick={() => dispatch({ type: 'reset-practice' })}>
          <Eraser size={16} aria-hidden="true" /> Clear column
        </Button>
      </div>
      <div
        className="truth-lab__feedback"
        data-ok={state.feedback?.ok}
        role="status"
        aria-live="polite"
      >
        {state.feedback ? (
          <><Check size={16} aria-hidden="true" /> {state.feedback.message}</>
        ) : (
          `${completed}/${table.rows.length} rows correct. Select a ? cell or use the current row.`
        )}
      </div>
      {state.feedback && !state.feedback.ok && (
        <div className="truth-lab__hint">
          {!state.hintVisible ? (
            <Button variant="ghost" type="button" onClick={() => dispatch({ type: 'reveal-hint' })}>
              <Lightbulb size={16} aria-hidden="true" /> Show one conceptual hint
            </Button>
          ) : (
            <p><Lightbulb size={16} aria-hidden="true" /> {hint}</p>
          )}
        </div>
      )}
    </aside>
  );
}
