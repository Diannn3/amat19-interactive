import { evaluateLogic, type TruthTable } from '@amat19/domain-logic';
import { checkTruthGuess } from '@amat19/learning-engine';
import { Check, Eraser, Eye, Lightbulb } from 'lucide-react';
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
  const columnId = targetColumn.id;
  const completed = Object.values(state.practiceGuesses).filter((guess) => guess.status === 'correct').length;
  const answered = Object.keys(state.practiceGuesses).length;
  const evaluation = evaluateLogic(table.ast, row.assignment);
  const hint = evaluation.byNodeId[targetColumn.nodeId]?.explanation;
  const allAnswered = answered === table.rows.length;
  const allCorrect = completed === table.rows.length;

  function answer(guess: boolean): void {
    const feedback = checkTruthGuess({ expected, guess, rowIndex: row.index, objectId: columnId });
    dispatch({ type: 'record-practice-guess', rowIndex: row.index, value: guess, status: feedback.ok ? 'correct' : 'wrong', feedback });
  }

  function revealColumn(): void {
    const guesses = Object.fromEntries(table.rows.map((item) => [
      item.index,
      { value: item.values[columnId]!, status: 'correct' as const }
    ]));
    dispatch({ type: 'reveal-practice', guesses });
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
        {table.symbols.map((symbol) => <span key={symbol}>{symbol} = {row.assignment[symbol] ? 'T' : 'F'}</span>)}
      </div>
      <div className="truth-lab__practice-actions">
        <Button variant="answer" type="button" onClick={() => answer(true)}>T · True</Button>
        <Button variant="answer" type="button" onClick={() => answer(false)}>F · False</Button>
      </div>
      <div className="truth-lab__practice-actions">
        <Button variant="ghost" type="button" onClick={() => dispatch({ type: 'reset-practice' })}>
          <Eraser size={16} aria-hidden="true" /> Try column again
        </Button>
        <Button variant="ghost" type="button" onClick={revealColumn}>
          <Eye size={16} aria-hidden="true" /> Reveal column
        </Button>
      </div>
      <div className="truth-lab__feedback" data-ok={allCorrect || state.feedback?.ok} role="status" aria-live="polite">
        {state.revealedPractice
          ? 'Column revealed. Revealed work is saved separately from independent mastery evidence.'
          : allAnswered
            ? allCorrect
              ? <><Check size={16} aria-hidden="true" /> Entire column correct.</>
              : `${completed}/${table.rows.length} rows correct. Revisit the marked rows.`
            : state.feedback
              ? <><Check size={16} aria-hidden="true" /> {state.feedback.message}</>
              : `${completed}/${table.rows.length} rows correct. Select a ? cell or use the current row.`}
      </div>
      {state.feedback && !state.feedback.ok && !state.revealedPractice && (
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
