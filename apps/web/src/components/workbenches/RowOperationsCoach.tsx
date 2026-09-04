import { useEffect, useMemo, useRef, useState } from 'react';
import { Lightbulb, RotateCcw, Undo2 } from 'lucide-react';
import {
  DEFAULT_INTERACTIVE_MATRIX_INPUT_LIMITS,
  applyRowOperation,
  identity,
  inverse,
  matricesEqual,
  matrixToStrings,
  parseMatrixText,
  rref,
  solveLinearSystem,
  type Matrix,
  type RowOperationInput,
} from '@amat19/domain-linear';
import { Button } from '../ui/Button';
import { Feedback } from '../ui/Feedback';
import { loadDraft, saveDraft } from '../../lib/draft';
import { parseNonnegativeIntegerInput } from '../../lib/integer-input';
import { usePersistenceFlush } from '../../lib/use-persistence-flush';
import { readWorkbenchOption } from '../../lib/workbench-route';

type Goal = 'system' | 'inverse' | 'rref';
type OperationKind = RowOperationInput['kind'];
type HistoryEntry = { label: string; before: Matrix };
type StoredDraft = {
  goal: Goal;
  sourceRaw: string;
  currentRaw: string;
  history: Array<{ label: string; beforeRaw: string }>;
};

const LAB_ID = 'linear.row-operations-coach';
const CONTENT_VERSION = '1';
const GOALS: readonly Goal[] = ['system', 'inverse', 'rref'];
const SAMPLES: Record<Goal, string> = {
  system: '1 1 3\n1 -1 1',
  inverse: '2 4\n0 -2',
  rref: '1 2 3\n2 4 7',
};

function parse(raw: string) {
  return parseMatrixText(raw, DEFAULT_INTERACTIVE_MATRIX_INPUT_LIMITS);
}

function serialize(value: Matrix) {
  return matrixToStrings(value).map((row) => row.join(' ')).join('\n');
}

function startingMatrix(source: Matrix, goal: Goal) {
  if (goal !== 'inverse') return source;
  if (source.some((row) => row.length !== source.length)) throw new RangeError('Inverse mode needs a square matrix.');
  const unit = identity(source.length);
  return source.map((row, index) => [...row, ...unit[index]!]);
}

function MatrixBoard({ value, label, splitAfter }: { value: Matrix; label: string; splitAfter?: number }) {
  const accessible = `${label}: ${matrixToStrings(value).map((row) => row.join(', ')).join('; ')}`;
  return (
    <div className="row-coach__matrix" data-coach-matrix role="img" aria-label={accessible}>
      <table aria-hidden="true">
        <tbody>
          {value.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, columnIndex) => (
                <td key={columnIndex} data-split={splitAfter === columnIndex || undefined}>{cell.toString()}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function RowOperationsCoach() {
  const [hydrated, setHydrated] = useState(false);
  const [goal, setGoal] = useState<Goal>('system');
  const [sourceRaw, setSourceRaw] = useState(SAMPLES.system);
  const [editorRaw, setEditorRaw] = useState(SAMPLES.system);
  const [current, setCurrent] = useState<Matrix>(() => startingMatrix(parse(SAMPLES.system), 'system'));
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [operationKind, setOperationKind] = useState<OperationKind>('replace');
  const [targetRow, setTargetRow] = useState('2');
  const [sourceRow, setSourceRow] = useState('1');
  const [factor, setFactor] = useState('-1');
  const [feedback, setFeedback] = useState<{ tone: 'neutral' | 'success' | 'error'; text: string }>();
  const [editorError, setEditorError] = useState<string>();
  const userInteracted = useRef(false);

  const analysis = useMemo(() => {
    try {
      const source = parse(sourceRaw);
      const initial = startingMatrix(source, goal);
      const reduced = rref(initial);
      if (goal === 'system') {
        const result = solveLinearSystem(source);
        return {
          source,
          target: result.rref,
          summary: result.kind === 'unique' ? 'unique solution' : `${result.kind} system`,
          detail: result.solution ? `(${result.solution.map((value) => value.toString()).join(', ')})` : `rank ${result.rank}`,
          splitAfter: source[0]!.length - 1,
        };
      }
      if (goal === 'inverse') {
        const result = inverse(source);
        return {
          source,
          target: reduced.matrix,
          summary: result ? 'inverse exists' : 'singular matrix',
          detail: result ? `determine A⁻¹ from the right block` : 'the left block cannot become identity',
          splitAfter: source[0]!.length,
        };
      }
      const result = rref(source);
      return {
        source,
        target: result.matrix,
        summary: `rank ${result.rank}`,
        detail: `${result.pivotColumns.length} pivot column${result.pivotColumns.length === 1 ? '' : 's'}`,
        splitAfter: undefined,
      };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'This matrix could not be analyzed.' };
    }
  }, [sourceRaw, goal]);

  const complete = analysis.target ? matricesEqual(current, analysis.target) : false;
  const draft: StoredDraft = {
    goal,
    sourceRaw,
    currentRaw: serialize(current),
    history: history.map((entry) => ({ label: entry.label, beforeRaw: serialize(entry.before) })),
  };

  useEffect(() => {
    const requestedGoal = readWorkbenchOption('goal', GOALS);
    loadDraft<StoredDraft>(LAB_ID, CONTENT_VERSION).then((saved) => {
      if (!userInteracted.current && requestedGoal && requestedGoal !== saved?.goal) {
        const raw = SAMPLES[requestedGoal];
        setGoal(requestedGoal);
        setSourceRaw(raw);
        setEditorRaw(raw);
        setCurrent(startingMatrix(parse(raw), requestedGoal));
        setHistory([]);
      } else if (!userInteracted.current && saved) {
        try {
          const restoredSource = parse(saved.sourceRaw);
          const restoredCurrent = parse(saved.currentRaw);
          startingMatrix(restoredSource, saved.goal);
          setGoal(saved.goal);
          setSourceRaw(saved.sourceRaw);
          setEditorRaw(saved.sourceRaw);
          setCurrent(restoredCurrent);
          setHistory(saved.history.map((entry) => ({ label: entry.label, before: parse(entry.beforeRaw) })));
        } catch {
          // Invalid or stale drafts are ignored in favor of the verified sample.
        }
      }
      setHydrated(true);
    });
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const timer = window.setTimeout(() => void saveDraft(LAB_ID, CONTENT_VERSION, draft), 250);
    return () => window.clearTimeout(timer);
  }, [hydrated, goal, sourceRaw, current, history]);

  usePersistenceFlush(() => saveDraft(LAB_ID, CONTENT_VERSION, draft), hydrated);

  const selectGoal = (next: Goal) => {
    const raw = SAMPLES[next];
    setGoal(next);
    setSourceRaw(raw);
    setEditorRaw(raw);
    setCurrent(startingMatrix(parse(raw), next));
    setHistory([]);
    setFeedback(undefined);
    setEditorError(undefined);
  };

  const readRow = (raw: string, label: string) => {
    const parsed = parseNonnegativeIntegerInput(raw, { label, positive: true, max: current.length });
    if (parsed.status !== 'valid') throw new RangeError(parsed.message);
    return parsed.value - 1;
  };

  const applyOperation = () => {
    try {
      const first = readRow(targetRow, operationKind === 'replace' ? 'Target row' : 'Row');
      const second = operationKind === 'scale' ? 0 : readRow(sourceRow, operationKind === 'replace' ? 'Source row' : 'Other row');
      const operation: RowOperationInput = operationKind === 'swap'
        ? { kind: 'swap', rowA: first, rowB: second }
        : operationKind === 'scale'
          ? { kind: 'scale', row: first, factor }
          : { kind: 'replace', targetRow: first, sourceRow: second, factor };
      const next = applyRowOperation(current, operation);
      setHistory((entries) => [...entries, { label: next.operation.label, before: current }]);
      setCurrent(next.matrix);
      setFeedback({ tone: matricesEqual(next.matrix, analysis.target ?? next.matrix) ? 'success' : 'neutral', text: `${next.operation.label}. The represented system remains equivalent.` });
    } catch (error) {
      setFeedback({ tone: 'error', text: error instanceof Error ? error.message : 'That row operation could not be applied.' });
    }
  };

  const undo = () => {
    const previous = history.at(-1);
    if (!previous) return;
    setCurrent(previous.before);
    setHistory((entries) => entries.slice(0, -1));
    setFeedback({ tone: 'neutral', text: `Undid ${previous.label}.` });
  };

  const suggest = () => {
    const next = rref(current).steps[0]?.operation.label;
    setFeedback(next
      ? { tone: 'neutral', text: `Suggested next step: ${next}` }
      : { tone: 'success', text: 'This matrix is already in reduced row-echelon form.' });
  };

  const useEditedMatrix = () => {
    try {
      const source = parse(editorRaw);
      const initial = startingMatrix(source, goal);
      setSourceRaw(editorRaw.trim());
      setCurrent(initial);
      setHistory([]);
      setFeedback(undefined);
      setEditorError(undefined);
    } catch (error) {
      setEditorError(error instanceof Error ? error.message : 'That matrix could not be used.');
    }
  };

  return (
    <section
      className="row-coach"
      data-testid="row-operations-coach"
      data-hydrated={hydrated ? 'true' : undefined}
      data-goal={goal}
      onPointerDown={() => { userInteracted.current = true; }}
      onKeyDown={(event) => {
        if (event.target instanceof HTMLElement && event.target.closest('button,input,select,textarea,summary')) userInteracted.current = true;
      }}
    >
      <header className="row-coach__header">
        <div>
          <h2>Change one row. See what stays equivalent.</h2>
          <p>Build the reduction yourself; ask for one next move only when you need it.</p>
        </div>
        <fieldset className="row-coach__goal" disabled={!hydrated}>
          <legend className="sr-only">Choose a row-reduction goal</legend>
          <label className="form-field">
            <span className="form-field__label">Goal</span>
            <select data-primary-control className="select-input" name="row-coach-goal" value={goal} onChange={(event) => selectGoal(event.target.value as Goal)}>
              <option value="system">Solve a system</option>
              <option value="inverse">Find an inverse</option>
              <option value="rref">Find RREF</option>
            </select>
          </label>
        </fieldset>
      </header>

      {analysis.error ? (
        <Feedback tone="error" role="alert">{analysis.error}</Feedback>
      ) : (
        <>
          <div className="row-coach__matrix-stage">
            <MatrixBoard value={current} label="Current augmented matrix" splitAfter={analysis.splitAfter} />
          </div>

          <fieldset className="row-coach__operation" disabled={!hydrated}>
            <legend className="sr-only">Apply one elementary row operation</legend>
            <label className="form-field row-coach__operation-kind">
              <span className="form-field__label">Operation</span>
              <select data-primary-control className="select-input" name="row-operation" value={operationKind} onChange={(event) => setOperationKind(event.target.value as OperationKind)}>
                <option value="replace">Ri ← Ri + kRj</option>
                <option value="scale">Ri ← kRi</option>
                <option value="swap">Ri ↔ Rj</option>
              </select>
            </label>
            <label className="form-field">
              <span className="form-field__label">{operationKind === 'replace' ? 'Target row' : 'Row'}</span>
              <input data-primary-control className="text-input" name="row-target" inputMode="numeric" autoComplete="off" value={targetRow} onChange={(event) => setTargetRow(event.target.value)} />
            </label>
            {operationKind !== 'scale' && (
              <label className="form-field">
                <span className="form-field__label">{operationKind === 'replace' ? 'Source row' : 'Other row'}</span>
                <input data-primary-control className="text-input" name="row-source" inputMode="numeric" autoComplete="off" value={sourceRow} onChange={(event) => setSourceRow(event.target.value)} />
              </label>
            )}
            {operationKind !== 'swap' && (
              <label className="form-field">
                <span className="form-field__label">Factor k</span>
                <input data-primary-control className="text-input" name="row-factor" inputMode="text" autoComplete="off" value={factor} onChange={(event) => setFactor(event.target.value)} />
              </label>
            )}
            <Button data-primary-control type="button" variant="primary" aria-label="Apply operation" onClick={applyOperation}>Apply</Button>
            <Button data-primary-control type="button" variant="ghost" onClick={suggest}><Lightbulb size={16} aria-hidden="true" /> Suggest next</Button>
            {history.length > 0 && <Button data-primary-control type="button" variant="ghost" onClick={undo}><Undo2 size={16} aria-hidden="true" /> Undo</Button>}
          </fieldset>

          {feedback && <Feedback tone={feedback.tone}>{feedback.text}</Feedback>}
          {complete && <Feedback tone="success"><strong>Reduced.</strong> You reached the exact target using equivalent row operations.</Feedback>}

          <div className="row-coach__outcome">
            <span>{goal === 'system' ? 'System result' : goal === 'inverse' ? 'Matrix result' : 'Reduction result'}</span>
            <strong>{analysis.summary}</strong>
            <small>{analysis.detail}</small>
          </div>

          <details className="row-coach__editor">
            <summary>Edit the starting matrix</summary>
            <label className="form-field">
              <span className="form-field__label">Matrix rows</span>
              <textarea className="matrix-textarea" name="row-coach-matrix" rows={4} autoComplete="off" value={editorRaw} onChange={(event) => setEditorRaw(event.target.value)} />
              <span className="form-field__hint">Separate entries with spaces and rows with new lines. Fractions such as 3/4 are exact.</span>
            </label>
            <div className="action-row">
              <Button type="button" variant="secondary" onClick={useEditedMatrix}>Use this matrix</Button>
              <Button type="button" variant="ghost" onClick={() => { setEditorRaw(SAMPLES[goal]); setEditorError(undefined); }}><RotateCcw size={16} aria-hidden="true" /> Restore sample</Button>
            </div>
            {editorError && <Feedback tone="error" role="alert">{editorError}</Feedback>}
          </details>

          {history.length > 0 && (
            <details className="row-coach__history">
              <summary>Review {history.length} operation{history.length === 1 ? '' : 's'}</summary>
              <ol>{history.map((entry, index) => <li key={`${entry.label}-${index}`}><span>{index + 1}</span><code>{entry.label}</code></li>)}</ol>
            </details>
          )}
        </>
      )}
    </section>
  );
}
