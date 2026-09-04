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
import {
  arithmeticResult,
  checkMatrixArithmetic,
  checkRowStep,
  type ArithmeticOperation,
  type MatrixArithmeticFeedback,
  type RowStepFeedback,
} from '../../lib/row-step-feedback';

type Goal = 'system' | 'inverse' | 'rref' | 'arithmetic';
type OperationKind = RowOperationInput['kind'];
type HistoryEntry = { label: string; before: Matrix };
type StoredDraft = {
  goal: Goal;
  sourceRaw: string;
  currentRaw: string;
  history: Array<{ label: string; beforeRaw: string }>;
  arithmeticRightRaw?: string;
  arithmeticOperation?: ArithmeticOperation;
};

const LAB_ID = 'linear.row-operations-coach';
const CONTENT_VERSION = '2';
const GOALS: readonly Goal[] = ['system', 'inverse', 'rref', 'arithmetic'];
const SAMPLES: Record<Goal, string> = {
  system: '1 1 3\n1 -1 1',
  inverse: '2 4\n0 -2',
  rref: '1 2 3\n2 4 7',
  arithmetic: '1 2\n3 4',
};
const ARITHMETIC_RIGHT_SAMPLE = '2 1\n1 2';

type Analysis =
  | { kind: 'row'; source: Matrix; target: Matrix; summary: string; detail: string; splitAfter?: number }
  | { kind: 'arithmetic'; source: Matrix; right: Matrix; target: Matrix; operation: ArithmeticOperation }
  | { kind: 'error'; error: string };

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
  const [arithmeticRightRaw, setArithmeticRightRaw] = useState(ARITHMETIC_RIGHT_SAMPLE);
  const [arithmeticRightEditorRaw, setArithmeticRightEditorRaw] = useState(ARITHMETIC_RIGHT_SAMPLE);
  const [arithmeticOperation, setArithmeticOperation] = useState<ArithmeticOperation>('add');
  const [arithmeticCandidateRaw, setArithmeticCandidateRaw] = useState('');
  const [arithmeticFeedback, setArithmeticFeedback] = useState<MatrixArithmeticFeedback>();
  const [arithmeticRevealed, setArithmeticRevealed] = useState(false);
  const [operationKind, setOperationKind] = useState<OperationKind>('replace');
  const [targetRow, setTargetRow] = useState('2');
  const [sourceRow, setSourceRow] = useState('1');
  const [factor, setFactor] = useState('-1');
  const [candidateRowRaw, setCandidateRowRaw] = useState('');
  const [feedback, setFeedback] = useState<{ tone: 'neutral' | 'success' | 'error'; text: string }>();
  const [stepFeedback, setStepFeedback] = useState<RowStepFeedback>();
  const [checkedOperationKey, setCheckedOperationKey] = useState<string>();
  const [editorError, setEditorError] = useState<string>();
  const candidateRowInput = useRef<HTMLTextAreaElement>(null);
  const candidateMatrixInput = useRef<HTMLTextAreaElement>(null);
  const userInteracted = useRef(false);

  const analysis: Analysis = useMemo(() => {
    try {
      const source = parse(sourceRaw);
      if (goal === 'arithmetic') {
        const right = parse(arithmeticRightRaw);
        return { kind: 'arithmetic' as const, source, right, target: arithmeticResult(source, right, arithmeticOperation), operation: arithmeticOperation };
      }
      const initial = startingMatrix(source, goal);
      const reduced = rref(initial);
      if (goal === 'system') {
        const result = solveLinearSystem(source);
        return {
          kind: 'row' as const,
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
          kind: 'row' as const,
          source,
          target: reduced.matrix,
          summary: result ? 'inverse exists' : 'singular matrix',
          detail: result ? `determine A⁻¹ from the right block` : 'the left block cannot become identity',
          splitAfter: source[0]!.length,
        };
      }
      const result = rref(source);
      return {
        kind: 'row' as const,
        source,
        target: result.matrix,
        summary: `rank ${result.rank}`,
        detail: `${result.pivotColumns.length} pivot column${result.pivotColumns.length === 1 ? '' : 's'}`,
        splitAfter: undefined,
      };
    } catch (error) {
      return { kind: 'error' as const, error: error instanceof Error ? error.message : 'This matrix could not be analyzed.' };
    }
  }, [sourceRaw, goal, arithmeticRightRaw, arithmeticOperation]);

  const complete = analysis.kind === 'row' && matricesEqual(current, analysis.target);
  const draft: StoredDraft = {
    goal,
    sourceRaw,
    currentRaw: serialize(current),
    history: history.map((entry) => ({ label: entry.label, beforeRaw: serialize(entry.before) })),
    arithmeticRightRaw,
    arithmeticOperation,
  };

  useEffect(() => {
    const requestedGoal = readWorkbenchOption('goal', GOALS);
    loadDraft<StoredDraft>(LAB_ID, CONTENT_VERSION).then((saved) => {
      const savedGoal = saved && GOALS.includes(saved.goal) ? saved.goal : undefined;
      if (!userInteracted.current && requestedGoal && requestedGoal !== savedGoal) {
        const raw = SAMPLES[requestedGoal];
        setGoal(requestedGoal);
        setSourceRaw(raw);
        setEditorRaw(raw);
        setArithmeticRightRaw(requestedGoal === 'arithmetic' ? ARITHMETIC_RIGHT_SAMPLE : arithmeticRightRaw);
        setArithmeticRightEditorRaw(requestedGoal === 'arithmetic' ? ARITHMETIC_RIGHT_SAMPLE : arithmeticRightEditorRaw);
        setArithmeticOperation('add');
        setCurrent(startingMatrix(parse(raw), requestedGoal));
        setHistory([]);
      } else if (!userInteracted.current && saved && savedGoal) {
        try {
          const restoredSource = parse(saved.sourceRaw);
          const restoredCurrent = parse(saved.currentRaw);
          startingMatrix(restoredSource, savedGoal);
          setGoal(savedGoal);
          setSourceRaw(saved.sourceRaw);
          setEditorRaw(saved.sourceRaw);
          if (savedGoal === 'arithmetic') {
            const restoredRight = saved.arithmeticRightRaw ?? ARITHMETIC_RIGHT_SAMPLE;
            parse(restoredRight);
            setArithmeticRightRaw(restoredRight);
            setArithmeticRightEditorRaw(restoredRight);
            setArithmeticOperation(saved.arithmeticOperation ?? 'add');
            setCurrent(restoredSource);
          } else {
            setCurrent(restoredCurrent);
          }
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
  }, [hydrated, goal, sourceRaw, current, history, arithmeticRightRaw, arithmeticOperation]);

  usePersistenceFlush(() => saveDraft(LAB_ID, CONTENT_VERSION, draft), hydrated);

  const selectGoal = (next: Goal) => {
    const raw = SAMPLES[next];
    setGoal(next);
    setSourceRaw(raw);
    setEditorRaw(raw);
    if (next === 'arithmetic') {
      setArithmeticRightRaw(ARITHMETIC_RIGHT_SAMPLE);
      setArithmeticRightEditorRaw(ARITHMETIC_RIGHT_SAMPLE);
      setArithmeticOperation('add');
    }
    setArithmeticCandidateRaw('');
    setArithmeticFeedback(undefined);
    setArithmeticRevealed(false);
    setCurrent(startingMatrix(parse(raw), next));
    setHistory([]);
    setFeedback(undefined);
    setStepFeedback(undefined);
    setCheckedOperationKey(undefined);
    setEditorError(undefined);
  };

  const readRow = (raw: string, label: string) => {
    const parsed = parseNonnegativeIntegerInput(raw, { label, positive: true, max: current.length });
    if (parsed.status !== 'valid') throw new RangeError(parsed.message);
    return parsed.value - 1;
  };

  const operationKey = `${serialize(current)}|${operationKind}|${targetRow}|${sourceRow}|${factor}`;

  const buildOperation = (): RowOperationInput => {
    const first = readRow(targetRow, operationKind === 'replace' ? 'Target row' : 'Row');
    const second = operationKind === 'scale' ? 0 : readRow(sourceRow, operationKind === 'replace' ? 'Source row' : 'Other row');
    return operationKind === 'swap'
      ? { kind: 'swap', rowA: first, rowB: second }
      : operationKind === 'scale'
        ? { kind: 'scale', row: first, factor }
        : { kind: 'replace', targetRow: first, sourceRow: second, factor };
  };

  const resetOperationCheck = () => {
    setStepFeedback(undefined);
    setCheckedOperationKey(undefined);
    setFeedback(undefined);
  };

  const checkOperation = () => {
    try {
      const result = checkRowStep(current, buildOperation(), candidateRowRaw);
      setStepFeedback(result);
      setFeedback(undefined);
      setCheckedOperationKey(result.status === 'correct' ? operationKey : undefined);
      if (result.field === 'candidate') candidateRowInput.current?.focus();
    } catch (error) {
      setStepFeedback({
        status: 'model-error',
        code: 'operation',
        message: error instanceof Error ? error.message : 'That row operation could not be checked.',
      });
      setCheckedOperationKey(undefined);
    }
  };

  const checkArithmetic = () => {
    if (analysis.kind !== 'arithmetic') return;
    const result = checkMatrixArithmetic(analysis.source, analysis.right, arithmeticOperation, arithmeticCandidateRaw);
    setArithmeticFeedback(result);
    if (result.field === 'candidate') candidateMatrixInput.current?.focus();
  };

  const selectArithmeticOperation = (next: ArithmeticOperation) => {
    setArithmeticOperation(next);
    setArithmeticCandidateRaw('');
    setArithmeticFeedback(undefined);
    setArithmeticRevealed(false);
  };

  const applyOperation = () => {
    if (checkedOperationKey !== operationKey) {
      setStepFeedback({ status: 'incorrect', code: 'operation', message: 'Check the resulting row before applying the move.' });
      return;
    }
    try {
      const operation = buildOperation();
      const next = applyRowOperation(current, operation);
      setHistory((entries) => [...entries, { label: next.operation.label, before: current }]);
      setCurrent(next.matrix);
      setStepFeedback(undefined);
      setCheckedOperationKey(undefined);
      setCandidateRowRaw('');
      setFeedback({ tone: analysis.kind === 'row' && matricesEqual(next.matrix, analysis.target) ? 'success' : 'neutral', text: `${next.operation.label}. The represented system remains equivalent.` });
    } catch (error) {
      setFeedback({ tone: 'error', text: error instanceof Error ? error.message : 'That row operation could not be applied.' });
    }
  };

  const undo = () => {
    const previous = history.at(-1);
    if (!previous) return;
    setCurrent(previous.before);
    setHistory((entries) => entries.slice(0, -1));
    setStepFeedback(undefined);
    setCheckedOperationKey(undefined);
    setCandidateRowRaw('');
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
      if (goal === 'arithmetic') {
        parse(arithmeticRightEditorRaw);
        setSourceRaw(editorRaw.trim());
        setArithmeticRightRaw(arithmeticRightEditorRaw.trim());
        setCurrent(source);
        setArithmeticCandidateRaw('');
        setArithmeticFeedback(undefined);
        setArithmeticRevealed(false);
        setEditorError(undefined);
        return;
      }
      const initial = startingMatrix(source, goal);
      setSourceRaw(editorRaw.trim());
      setCurrent(initial);
      setHistory([]);
      setFeedback(undefined);
      setStepFeedback(undefined);
      setCheckedOperationKey(undefined);
      setCandidateRowRaw('');
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
              <option value="arithmetic">Matrix arithmetic</option>
            </select>
          </label>
        </fieldset>
      </header>

      {analysis.kind === 'error' ? (
        <Feedback tone="error" role="alert">{analysis.error}</Feedback>
      ) : analysis.kind === 'arithmetic' ? (
        <>
          <div className="row-coach__arithmetic-stage" aria-label="Matrix arithmetic model">
            <div>
              <h3>Matrix A</h3>
              <MatrixBoard value={analysis.source} label="Matrix A" />
            </div>
            <span className="row-coach__arithmetic-symbol" aria-hidden="true">
              {arithmeticOperation === 'add' ? '+' : arithmeticOperation === 'subtract' ? '−' : '×'}
            </span>
            <div>
              <h3>Matrix B</h3>
              <MatrixBoard value={analysis.right} label="Matrix B" />
            </div>
          </div>

          <section className="row-coach__arithmetic-coach" aria-labelledby="arithmetic-coach-heading">
            <header>
              <h3 id="arithmetic-coach-heading">Compute the result.</h3>
              <p>Work entry by entry, then check the complete matrix.</p>
            </header>
            <label className="form-field">
              <span className="form-field__label">Arithmetic operation</span>
              <select data-primary-control className="select-input" name="matrix-arithmetic-operation" value={arithmeticOperation} onChange={(event) => selectArithmeticOperation(event.target.value as ArithmeticOperation)}>
                <option value="add">A + B</option>
                <option value="subtract">A − B</option>
                <option value="multiply">AB (row by column)</option>
              </select>
            </label>
            <form onSubmit={(event) => { event.preventDefault(); checkArithmetic(); }}>
              <label className="form-field">
                <span className="form-field__label">Candidate result matrix</span>
                <textarea
                  ref={candidateMatrixInput}
                  data-primary-control
                  id="matrix-arithmetic-candidate"
                  className="matrix-textarea"
                  name="matrix-arithmetic-candidate"
                  rows={3}
                  autoComplete="off"
                  spellCheck={false}
                  placeholder="Write one row per line"
                  value={arithmeticCandidateRaw}
                  aria-describedby="matrix-arithmetic-feedback"
                  aria-invalid={arithmeticFeedback?.status === 'incorrect' || arithmeticFeedback?.status === 'invalid' || undefined}
                  onChange={(event) => { setArithmeticCandidateRaw(event.target.value); setArithmeticFeedback(undefined); setArithmeticRevealed(false); }}
                />
              </label>
              <Button data-primary-control type="submit" variant="primary">Check result</Button>
            </form>
            <div id="matrix-arithmetic-feedback">
              {arithmeticFeedback && <Feedback tone={arithmeticFeedback.status === 'correct' ? 'success' : 'error'}>{arithmeticFeedback.message}</Feedback>}
            </div>
            <Button type="button" variant="ghost" aria-expanded={arithmeticRevealed} onClick={() => setArithmeticRevealed((revealed) => !revealed)}>
              {arithmeticRevealed ? 'Hide exact result' : 'Show exact result'}
            </Button>
            {arithmeticRevealed && (
              <div className="row-coach__arithmetic-result">
                <h3>Exact result</h3>
                <MatrixBoard value={analysis.target} label="Exact result matrix" />
              </div>
            )}
          </section>

          <details className="row-coach__editor">
            <summary>Edit matrices</summary>
            <div className="row-coach__arithmetic-editors">
              <label className="form-field">
                <span className="form-field__label">Matrix A</span>
                <textarea className="matrix-textarea" name="matrix-arithmetic-left" rows={3} autoComplete="off" value={editorRaw} onChange={(event) => setEditorRaw(event.target.value)} />
              </label>
              <label className="form-field">
                <span className="form-field__label">Matrix B</span>
                <textarea className="matrix-textarea" name="matrix-arithmetic-right" rows={3} autoComplete="off" value={arithmeticRightEditorRaw} onChange={(event) => setArithmeticRightEditorRaw(event.target.value)} />
              </label>
            </div>
            <span className="form-field__hint">Separate entries with spaces and rows with new lines. Fractions such as 3/4 are exact.</span>
            <div className="action-row">
              <Button type="button" variant="secondary" onClick={useEditedMatrix}>Use this model</Button>
              <Button type="button" variant="ghost" onClick={() => { setEditorRaw(SAMPLES.arithmetic); setArithmeticRightEditorRaw(ARITHMETIC_RIGHT_SAMPLE); setEditorError(undefined); }}><RotateCcw size={16} aria-hidden="true" /> Restore sample</Button>
            </div>
            {editorError && <Feedback tone="error" role="alert">{editorError}</Feedback>}
          </details>
        </>
      ) : (
        <>
          <div className="row-coach__matrix-stage">
            <MatrixBoard value={current} label="Current augmented matrix" splitAfter={analysis.splitAfter} />
          </div>

          <fieldset className="row-coach__operation" disabled={!hydrated}>
            <legend className="sr-only">Apply one elementary row operation</legend>
            <label className="form-field row-coach__operation-kind">
              <span className="form-field__label">Operation</span>
              <select data-primary-control className="select-input" name="row-operation" value={operationKind} onChange={(event) => { setOperationKind(event.target.value as OperationKind); resetOperationCheck(); }}>
                <option value="replace">Ri ← Ri + kRj</option>
                <option value="scale">Ri ← kRi</option>
                <option value="swap">Ri ↔ Rj</option>
              </select>
            </label>
            <label className="form-field">
              <span className="form-field__label">{operationKind === 'replace' ? 'Target row' : 'Row'}</span>
              <input data-primary-control className="text-input" name="row-target" inputMode="numeric" autoComplete="off" value={targetRow} onChange={(event) => { setTargetRow(event.target.value); resetOperationCheck(); }} />
            </label>
            {operationKind !== 'scale' && (
              <label className="form-field">
                <span className="form-field__label">{operationKind === 'replace' ? 'Source row' : 'Other row'}</span>
                <input data-primary-control className="text-input" name="row-source" inputMode="numeric" autoComplete="off" value={sourceRow} onChange={(event) => { setSourceRow(event.target.value); resetOperationCheck(); }} />
              </label>
            )}
            {operationKind !== 'swap' && (
              <label className="form-field">
                <span className="form-field__label">Factor k</span>
                <input data-primary-control className="text-input" name="row-factor" inputMode="text" autoComplete="off" value={factor} onChange={(event) => { setFactor(event.target.value); resetOperationCheck(); }} />
              </label>
            )}
          </fieldset>

          <section className="row-coach__step-check" aria-labelledby="row-step-heading">
            <header>
              <h3 id="row-step-heading">Write the changed row.</h3>
              <p>Calculate the row affected by the operation, then check it before applying the move.</p>
            </header>
            <form onSubmit={(event) => { event.preventDefault(); checkOperation(); }}>
              <label className="form-field">
                <span className="form-field__label">Candidate target row</span>
                <textarea
                  ref={candidateRowInput}
                  data-primary-control
                  id="row-step-candidate"
                  className="matrix-textarea"
                  name="row-step-candidate"
                  rows={2}
                  autoComplete="off"
                  spellCheck={false}
                  placeholder="Enter the changed row"
                  value={candidateRowRaw}
                  aria-describedby="row-step-feedback"
                  aria-invalid={stepFeedback?.status === 'incorrect' || stepFeedback?.status === 'invalid' || undefined}
                  onChange={(event) => { setCandidateRowRaw(event.target.value); resetOperationCheck(); }}
                />
              </label>
              <Button data-primary-control type="submit" variant="primary">Check row</Button>
            </form>
            <div id="row-step-feedback">
              {stepFeedback && <Feedback tone={stepFeedback.status === 'correct' ? 'success' : 'error'}>{stepFeedback.message}</Feedback>}
              {feedback && <Feedback tone={feedback.tone}>{feedback.text}</Feedback>}
            </div>
            <div className="action-row row-coach__secondary-actions">
              <Button type="button" variant="secondary" aria-label="Apply operation" disabled={checkedOperationKey !== operationKey} onClick={applyOperation}>Apply operation</Button>
              <Button type="button" variant="ghost" onClick={suggest}><Lightbulb size={16} aria-hidden="true" /> Suggest next</Button>
              {history.length > 0 && <Button type="button" variant="ghost" onClick={undo}><Undo2 size={16} aria-hidden="true" /> Undo</Button>}
            </div>
          </section>

          {complete && <Feedback tone="success"><strong>Reduced.</strong> You reached the exact target using equivalent row operations.</Feedback>}

          <details key={goal} className="row-coach__outcome-details">
            <summary>Show target context</summary>
            <div className="row-coach__outcome">
            <span>{goal === 'system' ? 'System result' : goal === 'inverse' ? 'Matrix result' : 'Reduction result'}</span>
            <strong>{analysis.summary}</strong>
            <small>{analysis.detail}</small>
            </div>
          </details>

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
