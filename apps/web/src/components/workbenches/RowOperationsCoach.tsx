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
import WorkbenchTaskPicker, { type WorkbenchTaskOption } from './WorkbenchTaskPicker';

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
const TASK_OPTIONS: readonly WorkbenchTaskOption[] = [
  { value: 'system', label: 'Solve a system', group: 'Start here' },
  { value: 'rref', label: 'Reach RREF', group: 'Inspect the matrix' },
  { value: 'inverse', label: 'Find an inverse', group: 'Inspect the matrix' },
  { value: 'arithmetic', label: 'Matrix arithmetic', group: 'Calculate' },
];
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

function isGoal(value: unknown): value is Goal {
  return typeof value === 'string' && GOALS.includes(value as Goal);
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

  // Mockup 8: Matrices & Systems Flagship State
  const [matrixCells, setMatrixCells] = useState<number[][]>([
    [2, -1, 0],
    [1, 3, 4],
    [0, 1, 2],
  ]);
  const [matrixDim, setMatrixDim] = useState<2 | 3>(3);
  const [activeMatrixTab, setActiveMatrixTab] = useState<'ops' | 'solve' | 'det' | 'rref' | 'eigen'>('det');
  const [activeMatrixOp, setActiveMatrixOp] = useState<string>('det');

  const detValue = useMemo(() => {
    if (matrixDim === 2) {
      return matrixCells[0][0] * matrixCells[1][1] - matrixCells[0][1] * matrixCells[1][0];
    }
    const a = matrixCells[0][0], b = matrixCells[0][1], c = matrixCells[0][2];
    const d = matrixCells[1][0], e = matrixCells[1][1], f = matrixCells[1][2];
    const g = matrixCells[2][0], h = matrixCells[2][1], i = matrixCells[2][2];
    return a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g);
  }, [matrixCells, matrixDim]);

  const isoProject = (x: number, y: number, z: number) => {
    const x0 = 160;
    const y0 = 135;
    const s = 18;
    const cos30 = 0.866;
    const sin30 = 0.5;
    const px = x0 + (x * cos30 - y * cos30) * s;
    const py = y0 - (z - x * sin30 - y * sin30) * s;
    return { x: px, y: py };
  };

  const updateMatrixCell = (r: number, c: number, val: number) => {
    setMatrixCells((prev) => {
      const next = prev.map((row) => [...row]);
      next[r][c] = val;
      return next;
    });
  };

  useEffect(() => {
    const requestedGoal = readWorkbenchOption('goal', GOALS);
    loadDraft<StoredDraft>(LAB_ID, CONTENT_VERSION).then((saved) => {
      const savedGoal = saved && isGoal(saved.goal) ? saved.goal : undefined;
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
      {/* Mockup 8: Matrices & Systems Flagship Instrument */}
      <header className="matrix-hero">
        <h2 className="matrix-title">Matrices &amp; Systems.</h2>
        <p className="matrix-lede">
          Explore matrix operations, solve systems, and build intuition through interactive examples.
        </p>

        <div className="prob-mode-bar" role="tablist" aria-label="Matrix view selection">
          <button 
            type="button" 
            className={`prob-mode-pill ${activeMatrixTab === 'ops' ? 'is-active' : ''}`}
            onClick={() => setActiveMatrixTab('ops')}
          >
            Matrix Operations
          </button>
          <button 
            type="button" 
            className={`prob-mode-pill ${activeMatrixTab === 'solve' ? 'is-active' : ''}`}
            onClick={() => setActiveMatrixTab('solve')}
          >
            Solve Systems
          </button>
          <button 
            type="button" 
            className={`prob-mode-pill ${activeMatrixTab === 'det' ? 'is-active' : ''}`}
            onClick={() => setActiveMatrixTab('det')}
          >
            Determinant
          </button>
          <button 
            type="button" 
            className={`prob-mode-pill ${activeMatrixTab === 'rref' ? 'is-active' : ''}`}
            onClick={() => setActiveMatrixTab('rref')}
          >
            Row Reduction
          </button>
          <button 
            type="button" 
            className={`prob-mode-pill ${activeMatrixTab === 'eigen' ? 'is-active' : ''}`}
            onClick={() => setActiveMatrixTab('eigen')}
          >
            Eigenvalues
          </button>
        </div>
      </header>

      <div className="matrix-instrument-grid" style={{ marginBottom: '2.5rem' }}>
        {/* Left Side Navigation & Hints */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="apple-glass-card" style={{ padding: '1.25rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Operations</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.75rem' }}>
              {['Matrix Operations', 'Solve Systems', 'Determinant', 'Row Reduction', 'Eigenvalues'].map((item, idx) => (
                <button 
                  key={item} 
                  type="button" 
                  style={{
                    border: 'none',
                    background: idx === 2 ? '#111111' : 'transparent',
                    color: idx === 2 ? '#ffffff' : '#3f3f46',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '8px',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    textAlign: 'left',
                    cursor: 'pointer'
                  }}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="apple-glass-card" style={{ padding: '1.25rem' }}>
            <strong style={{ fontSize: '0.85rem', color: '#09090b', display: 'block', marginBottom: '0.35rem' }}>Tip</strong>
            <p style={{ fontSize: '0.78rem', color: '#64748b', margin: 0, lineHeight: 1.45 }}>
              Elementary row replacement preserves the determinant: det(R_i ← R_i + cR_j) = det(A).
            </p>
          </div>
        </div>

        {/* Center Matrix Workspace */}
        <div className="apple-glass-card" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <strong style={{ fontSize: '1.2rem', color: '#09090b' }}>Matrix A</strong>
              <span style={{ fontSize: '0.82rem', color: '#71717a', display: 'block' }}>{matrixDim}×{matrixDim} Square Matrix</span>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button 
                type="button" 
                className="apple-btn-glass" 
                style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                onClick={() => setMatrixDim(matrixDim === 2 ? 3 : 2)}
              >
                {matrixDim === 3 ? '2×2' : '3×3'}
              </button>
              <button 
                type="button" 
                className="apple-btn-glass" 
                style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                onClick={() => {
                  setMatrixCells([
                    [Math.floor(Math.random() * 7) - 2, Math.floor(Math.random() * 7) - 2, Math.floor(Math.random() * 5)],
                    [Math.floor(Math.random() * 7) - 2, Math.floor(Math.random() * 7) - 2, Math.floor(Math.random() * 5)],
                    [Math.floor(Math.random() * 5) - 2, Math.floor(Math.random() * 5), Math.floor(Math.random() * 5)]
                  ]);
                }}
              >
                Random
              </button>
            </div>
          </div>

          {/* Matrix Bracket Display */}
          <div style={{ display: 'flex', justifyContent: 'center', margin: '1.5rem 0' }}>
            <div className="matrix-bracket-box">
              <div 
                className="matrix-grid-cells" 
                style={{ gridTemplateColumns: `repeat(${matrixDim}, 46px)` }}
              >
                {Array.from({ length: matrixDim }).map((_, r) => (
                  Array.from({ length: matrixDim }).map((_, c) => (
                    <input
                      key={`${r}-${c}`}
                      type="number"
                      className="matrix-cell-input"
                      value={matrixCells[r]?.[c] ?? 0}
                      onChange={(e) => updateMatrixCell(r, c, Number(e.target.value))}
                    />
                  ))
                ))}
              </div>
            </div>
          </div>

          {/* Operation Pills */}
          <div className="matrix-operations-strip">
            {[
              { id: 'add', label: '+ A + B' },
              { id: 'sub', label: '− A − B' },
              { id: 'mult', label: '× A × B' },
              { id: 'trans', label: '⇄ Aᵀ' },
              { id: 'det', label: '| | det(A)' },
              { id: 'rref', label: '≡ Row Reduce' },
            ].map((op) => (
              <button 
                key={op.id} 
                type="button" 
                className={`matrix-op-pill ${activeMatrixOp === op.id ? 'is-active' : ''}`}
                onClick={() => setActiveMatrixOp(op.id)}
              >
                {op.label}
              </button>
            ))}
          </div>

          {/* Step-by-Step Arithmetic Expansion */}
          <div style={{ background: '#f8fafc', border: '1px solid rgba(0,0,0,0.06)', borderRadius: '14px', padding: '1.25rem', marginTop: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b' }}>Calculation</span>
              <button type="button" style={{ border: 'none', background: 'transparent', color: '#2563eb', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}>
                Copy Calculation
              </button>
            </div>
            <div style={{ fontFamily: 'var(--font-amat-mono)', fontSize: '1.15rem', fontWeight: 700, color: '#09090b', letterSpacing: '-0.02em' }}>
              det(A) = {detValue}
            </div>
            <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '0.4rem 0 0 0', fontFamily: 'monospace' }}>
              Expansion: {matrixCells[0][0]}({matrixCells[1][1]}·{matrixCells[2][2]} − {matrixCells[1][2]}·{matrixCells[2][1]}) − ({matrixCells[0][1]})({matrixCells[1][0]}·{matrixCells[2][2]} − {matrixCells[1][2]}·{matrixCells[2][0]}) + {matrixCells[0][2]}...
            </p>
          </div>
        </div>

        {/* Right 3D Isometric Geometric Projection in R^3 */}
        <div className="apple-glass-card" style={{ padding: '1.75rem' }}>
          <strong style={{ fontSize: '1.05rem', color: '#09090b', display: 'block', marginBottom: '0.25rem' }}>3D Geometric View</strong>
          <span style={{ fontSize: '0.78rem', color: '#71717a', display: 'block', marginBottom: '1rem' }}>Column space projection in ℝ³</span>

          <div style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.06)', borderRadius: '12px', padding: '0.5rem', display: 'flex', justifyContent: 'center' }}>
            <svg viewBox="0 0 320 270" style={{ width: '100%', height: 'auto' }} aria-label="3D Isometric vector projection in R3">
              <defs>
                <marker id="arrowHeadBlue" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 1 L 8 5 L 0 9 z" fill="#2563eb" />
                </marker>
                <marker id="arrowHeadPurple" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 1 L 8 5 L 0 9 z" fill="#7c3aed" />
                </marker>
                <marker id="arrowHeadGreen" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 1 L 8 5 L 0 9 z" fill="#059669" />
                </marker>
              </defs>

              {/* Dotted Isometric Axes */}
              {/* Origin is at (160, 135) */}
              <line x1="160" y1="135" x2="60" y2="195" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="3 3" />
              <text x="50" y="205" fill="#94a3b8" fontSize="10" fontFamily="sans-serif">X</text>

              <line x1="160" y1="135" x2="260" y2="195" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="3 3" />
              <text x="270" y="205" fill="#94a3b8" fontSize="10" fontFamily="sans-serif">Y</text>

              <line x1="160" y1="135" x2="160" y2="25" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="3 3" />
              <text x="160" y="18" fill="#94a3b8" fontSize="10" fontFamily="sans-serif" textAnchor="middle">Z</text>

              {/* Vector a1 (col 0): (matrixCells[0][0], matrixCells[1][0], matrixCells[2][0]) */}
              {(() => {
                const p1 = isoProject(matrixCells[0][0], matrixCells[1][0], matrixCells[2][0]);
                const p2 = isoProject(matrixCells[0][1], matrixCells[1][1], matrixCells[2][1]);
                const p3 = isoProject(matrixCells[0][2], matrixCells[1][2], matrixCells[2][2]);
                const p12 = isoProject(matrixCells[0][0] + matrixCells[0][1], matrixCells[1][0] + matrixCells[1][1], matrixCells[2][0] + matrixCells[2][1]);
                const p13 = isoProject(matrixCells[0][0] + matrixCells[0][2], matrixCells[1][0] + matrixCells[1][2], matrixCells[2][0] + matrixCells[2][2]);
                const p23 = isoProject(matrixCells[0][1] + matrixCells[0][2], matrixCells[1][1] + matrixCells[1][2], matrixCells[2][1] + matrixCells[2][2]);
                const p123 = isoProject(matrixCells[0][0] + matrixCells[0][1] + matrixCells[0][2], matrixCells[1][0] + matrixCells[1][1] + matrixCells[1][2], matrixCells[2][0] + matrixCells[2][1] + matrixCells[2][2]);

                return (
                  <>
                    {/* Parallelepiped edges */}
                    <line x1={p1.x} y1={p1.y} x2={p12.x} y2={p12.y} stroke="rgba(0,0,0,0.12)" strokeWidth="1" strokeDasharray="2 2" />
                    <line x1={p2.x} y1={p2.y} x2={p12.x} y2={p12.y} stroke="rgba(0,0,0,0.12)" strokeWidth="1" strokeDasharray="2 2" />
                    <line x1={p1.x} y1={p1.y} x2={p13.x} y2={p13.y} stroke="rgba(0,0,0,0.12)" strokeWidth="1" strokeDasharray="2 2" />
                    <line x1={p3.x} y1={p3.y} x2={p13.x} y2={p13.y} stroke="rgba(0,0,0,0.12)" strokeWidth="1" strokeDasharray="2 2" />
                    <line x1={p2.x} y1={p2.y} x2={p23.x} y2={p23.y} stroke="rgba(0,0,0,0.12)" strokeWidth="1" strokeDasharray="2 2" />
                    <line x1={p3.x} y1={p3.y} x2={p23.x} y2={p23.y} stroke="rgba(0,0,0,0.12)" strokeWidth="1" strokeDasharray="2 2" />
                    <line x1={p12.x} y1={p12.y} x2={p123.x} y2={p123.y} stroke="rgba(0,0,0,0.12)" strokeWidth="1" strokeDasharray="2 2" />
                    <line x1={p13.x} y1={p13.y} x2={p123.x} y2={p123.y} stroke="rgba(0,0,0,0.12)" strokeWidth="1" strokeDasharray="2 2" />
                    <line x1={p23.x} y1={p23.y} x2={p123.x} y2={p123.y} stroke="rgba(0,0,0,0.12)" strokeWidth="1" strokeDasharray="2 2" />

                    {/* Vector a1 */}
                    <line x1="160" y1="135" x2={p1.x} y2={p1.y} stroke="#2563eb" strokeWidth="2.5" markerEnd="url(#arrowHeadBlue)" />
                    <text x={p1.x + 5} y={p1.y - 5} fill="#2563eb" fontSize="11" fontWeight="700" fontFamily="sans-serif">a₁</text>

                    {/* Vector a2 */}
                    <line x1="160" y1="135" x2={p2.x} y2={p2.y} stroke="#7c3aed" strokeWidth="2.5" markerEnd="url(#arrowHeadPurple)" />
                    <text x={p2.x + 5} y={p2.y - 5} fill="#7c3aed" fontSize="11" fontWeight="700" fontFamily="sans-serif">a₂</text>

                    {/* Vector a3 */}
                    <line x1="160" y1="135" x2={p3.x} y2={p3.y} stroke="#059669" strokeWidth="2.5" markerEnd="url(#arrowHeadGreen)" />
                    <text x={p3.x + 5} y={p3.y - 5} fill="#059669" fontSize="11" fontWeight="700" fontFamily="sans-serif">a₃</text>
                  </>
                );
              })()}
            </svg>
          </div>

          <div style={{ marginTop: '1rem', padding: '0.85rem', background: '#f8fafc', borderRadius: '10px', border: '1px solid rgba(0,0,0,0.05)' }}>
            <span style={{ fontSize: '0.78rem', color: '#475569', lineHeight: 1.45, display: 'block' }}>
              These three vectors span a parallelepiped with volume <strong>|det(A)| = {Math.abs(detValue)}</strong>.
            </span>
          </div>
        </div>
      </div>

      <header className="row-coach__header">
        <div>
          <h2>Change one row. See what stays equivalent.</h2>
          <p>Build the reduction yourself; ask for one next move only when you need it.</p>
        </div>
        <div className="row-coach__goal">
          <WorkbenchTaskPicker
            value={goal}
            options={TASK_OPTIONS}
            disabled={!hydrated}
            onChange={(value) => { if (isGoal(value)) selectGoal(value); }}
          />
        </div>
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
