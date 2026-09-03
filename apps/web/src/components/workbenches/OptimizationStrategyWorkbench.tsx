import {
  columnMaxima,
  maximin,
  minimax,
  payoffMatrix,
  rowMinima,
  solveZeroSum2x2,
} from '@amat19/domain-games';
import {
  distribution,
  distributionAfter,
  simplexMax,
  solveGraphicalLP,
  stationaryTwoStateResult,
  transitionMatrix,
  type Constraint2D,
  type GraphicalLpResult,
  type Point2D,
} from '@amat19/domain-linear';
import { Rational } from '@amat19/math-core';
import { useEffect, useMemo, useState } from 'react';
import { loadDraft, saveDraft } from '../../lib/draft';
import { usePersistenceFlush } from '../../lib/use-persistence-flush';
import { Feedback } from '../ui/Feedback';

type Mode = 'linear' | 'game' | 'advanced';
type ConstraintRow = { a: string; b: string; relation: Constraint2D['relation']; c: string };
type Draft = {
  mode: Mode;
  cx: string;
  cy: string;
  sense: 'max' | 'min';
  constraints: ConstraintRow[];
  game: string[][];
  markov: [string, string, string, string];
  initialA: string;
  markovSteps: number;
};

const LAB_ID = 'workbench.optimization-strategy';
const CONTENT_VERSION = '1';
const DEFAULT_CONSTRAINTS: ConstraintRow[] = [
  { a: '1', b: '1', relation: '<=', c: '4' },
  { a: '1', b: '0', relation: '<=', c: '3' },
  { a: '0', b: '1', relation: '<=', c: '2' },
];
const INITIAL: Draft = {
  mode: 'linear', cx: '3', cy: '2', sense: 'max', constraints: DEFAULT_CONSTRAINTS,
  game: [['4', '0'], ['1', '3']], markov: ['4/5', '1/5', '2/5', '3/5'], initialA: '1', markovSteps: 3,
};

const LP_SCENARIOS = {
  production: { label: 'Production mix', cx: '3', cy: '2', sense: 'max' as const, constraints: DEFAULT_CONSTRAINTS },
  unbounded: { label: 'Unbounded return', cx: '2', cy: '1', sense: 'max' as const, constraints: [{ a: '1', b: '-1', relation: '<=' as const, c: '2' }] },
  infeasible: { label: 'Conflicting requirements', cx: '1', cy: '1', sense: 'max' as const, constraints: [{ a: '1', b: '1', relation: '<=' as const, c: '1' }, { a: '1', b: '1', relation: '>=' as const, c: '3' }] },
};

function errorText(error: unknown): string {
  return error instanceof Error ? error.message : 'The model could not be evaluated.';
}

function pointText(point: Point2D): string {
  return `(${point.x.toString()}, ${point.y.toString()})`;
}

export default function OptimizationStrategyWorkbench() {
  const [hydrated, setHydrated] = useState(false);
  const [mode, setMode] = useState<Mode>(INITIAL.mode);
  const [scenario, setScenario] = useState('production');
  const [cx, setCx] = useState(INITIAL.cx);
  const [cy, setCy] = useState(INITIAL.cy);
  const [sense, setSense] = useState<'max' | 'min'>(INITIAL.sense);
  const [constraints, setConstraints] = useState<ConstraintRow[]>(INITIAL.constraints);
  const [game, setGame] = useState<string[][]>(INITIAL.game);
  const [markov, setMarkov] = useState<[string, string, string, string]>(INITIAL.markov);
  const [initialA, setInitialA] = useState(INITIAL.initialA);
  const [markovSteps, setMarkovSteps] = useState(INITIAL.markovSteps);

  useEffect(() => {
    let active = true;
    loadDraft<Draft>(LAB_ID, CONTENT_VERSION).then((draft) => {
      if (!active) return;
      if (draft) {
        setMode(draft.mode); setCx(draft.cx); setCy(draft.cy); setSense(draft.sense); setConstraints(draft.constraints);
        setGame(draft.game); setMarkov(draft.markov); setInitialA(draft.initialA); setMarkovSteps(draft.markovSteps);
        setScenario('custom');
      }
      setHydrated(true);
    }).catch(() => setHydrated(true));
    return () => { active = false; };
  }, []);

  const draft = useMemo<Draft>(() => ({ mode, cx, cy, sense, constraints, game, markov, initialA, markovSteps }), [mode, cx, cy, sense, constraints, game, markov, initialA, markovSteps]);
  useEffect(() => {
    if (!hydrated) return;
    const timer = window.setTimeout(() => { void saveDraft(LAB_ID, CONTENT_VERSION, draft); }, 250);
    return () => window.clearTimeout(timer);
  }, [draft, hydrated]);
  usePersistenceFlush(() => saveDraft(LAB_ID, CONTENT_VERSION, draft), hydrated);

  const lp = useMemo(() => {
    try {
      const result = solveGraphicalLP(constraints, { x: cx, y: cy, sense });
      const simplex = sense === 'max' && constraints.every((row) => row.relation === '<=')
        ? simplexMax({ objective: [cx, cy], constraints: constraints.map((row) => ({ coefficients: [row.a, row.b], bound: row.c })) })
        : undefined;
      return { result, simplex, error: undefined };
    } catch (error) {
      return { result: undefined, simplex: undefined, error: errorText(error) };
    }
  }, [constraints, cx, cy, sense]);

  const gameAnalysis = useMemo(() => {
    try {
      const matrix = payoffMatrix(game);
      return { matrix, rowMinima: rowMinima(matrix), columnMaxima: columnMaxima(matrix), maximin: maximin(matrix), minimax: minimax(matrix), solution: solveZeroSum2x2(matrix), error: undefined };
    } catch (error) {
      return { matrix: undefined, rowMinima: undefined, columnMaxima: undefined, maximin: undefined, minimax: undefined, solution: undefined, error: errorText(error) };
    }
  }, [game]);

  const markovAnalysis = useMemo(() => {
    try {
      const transition = transitionMatrix([[markov[0], markov[1]], [markov[2], markov[3]]]);
      const pA = Rational.from(initialA);
      const state = distribution([pA, Rational.one().subtract(pA)]);
      return { after: distributionAfter(state, transition, markovSteps), stationary: stationaryTwoStateResult(transition), error: undefined };
    } catch (error) {
      return { after: undefined, stationary: undefined, error: errorText(error) };
    }
  }, [markov, initialA, markovSteps]);

  function loadScenario(id: string) {
    setScenario(id);
    if (id === 'custom') return;
    const next = LP_SCENARIOS[id as keyof typeof LP_SCENARIOS];
    setCx(next.cx); setCy(next.cy); setSense(next.sense); setConstraints(next.constraints.map((row) => ({ ...row })));
  }

  function updateConstraint(index: number, patch: Partial<ConstraintRow>) {
    setScenario('custom');
    setConstraints((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, ...patch } : row));
  }

  function updateGame(row: number, column: number, value: string) {
    setGame((current) => current.map((values, rowIndex) => rowIndex === row ? values.map((cell, columnIndex) => columnIndex === column ? value : cell) : values));
  }

  function updateMarkov(index: number, value: string) {
    setMarkov((current) => current.map((cell, cellIndex) => cellIndex === index ? value : cell) as [string, string, string, string]);
  }

  return <section className="strategy-workbench" data-testid="optimization-strategy-workbench" data-hydrated={hydrated ? 'true' : undefined}>
    <fieldset className="strategy-workbench__mode-fieldset" disabled={!hydrated}>
      <legend className="sr-only">Choose an applications model</legend>
      <div className="strategy-workbench__modes" role="group" aria-label="Applications model">
        <button data-primary-control className="strategy-workbench__mode" data-active={mode === 'linear'} aria-pressed={mode === 'linear'} type="button" onClick={() => setMode('linear')}>Linear program</button>
        <button data-primary-control className="strategy-workbench__mode" data-active={mode === 'game'} aria-pressed={mode === 'game'} type="button" onClick={() => setMode('game')}>Zero-sum game</button>
        <button data-primary-control className="strategy-workbench__mode" data-active={mode === 'advanced'} aria-pressed={mode === 'advanced'} type="button" onClick={() => setMode('advanced')}>Advanced</button>
      </div>
    </fieldset>

    {mode === 'linear' && <section className="strategy-workbench__stage" aria-labelledby="lp-heading">
      <header className="strategy-workbench__header"><h2 id="lp-heading">See the feasible region before choosing a corner.</h2><p>Each inequality removes part of the plane. Only feasible corners can optimize a bounded linear objective.</p></header>
      <label className="form-field strategy-workbench__scenario"><span className="form-field__label">Model</span><select data-primary-control className="select-input" value={scenario} onChange={(event) => loadScenario(event.target.value)}><option value="production">Production mix</option><option value="unbounded">Unbounded return</option><option value="infeasible">Conflicting requirements</option>{scenario === 'custom' && <option value="custom">Custom model</option>}</select></label>
      {lp.error ? <Feedback tone="error" role="alert">{lp.error}</Feedback> : lp.result && <LpResult result={lp.result} />}
      <details className="strategy-workbench__editor">
        <summary>Edit objective and constraints</summary>
        <fieldset disabled={!hydrated}>
          <legend className="sr-only">Linear program coefficients</legend>
          <div className="strategy-workbench__objective">
            <label className="form-field"><span className="form-field__label">Direction</span><select data-primary-control className="select-input" value={sense} onChange={(event) => { setScenario('custom'); setSense(event.target.value as 'max' | 'min'); }}><option value="max">Maximize</option><option value="min">Minimize</option></select></label>
            <label className="form-field"><span className="form-field__label">Objective x coefficient</span><input data-primary-control className="text-input" value={cx} onChange={(event) => { setScenario('custom'); setCx(event.target.value); }} /></label>
            <label className="form-field"><span className="form-field__label">Objective y coefficient</span><input data-primary-control className="text-input" value={cy} onChange={(event) => { setScenario('custom'); setCy(event.target.value); }} /></label>
          </div>
          <div className="strategy-workbench__constraints">{constraints.map((row, index) => <div key={index} className="strategy-workbench__constraint"><span>C{index + 1}</span><label><span className="sr-only">Constraint {index + 1} x coefficient</span><input data-primary-control value={row.a} onChange={(event) => updateConstraint(index, { a: event.target.value })} /></label><span>x +</span><label><span className="sr-only">Constraint {index + 1} y coefficient</span><input data-primary-control value={row.b} onChange={(event) => updateConstraint(index, { b: event.target.value })} /></label><span>y</span><label><span className="sr-only">Constraint {index + 1} relation</span><select data-primary-control value={row.relation} onChange={(event) => updateConstraint(index, { relation: event.target.value as Constraint2D['relation'] })}><option value="<=">≤</option><option value=">=">≥</option><option value="=">=</option></select></label><label><span className="sr-only">Constraint {index + 1} bound</span><input data-primary-control value={row.c} onChange={(event) => updateConstraint(index, { c: event.target.value })} /></label></div>)}</div>
        </fieldset>
      </details>
      {lp.result && <LpGraph constraints={constraints} result={lp.result} />}
      {lp.result && lp.result.vertices.length > 0 && <details className="strategy-workbench__vertices"><summary>Inspect every feasible corner</summary><table><thead><tr><th>Corner</th><th>x</th><th>y</th><th>Z</th></tr></thead><tbody>{lp.result.vertices.map((vertex, index) => <tr key={index} data-optimum={lp.result!.optima.some((candidate) => candidate.point.x.equals(vertex.point.x) && candidate.point.y.equals(vertex.point.y))}><th>V{index + 1}</th><td>{vertex.point.x.toString()}</td><td>{vertex.point.y.toString()}</td><td>{vertex.value.toString()}</td></tr>)}</tbody></table></details>}
    </section>}

    {mode === 'game' && <section className="strategy-workbench__stage" aria-labelledby="game-heading">
      <header className="strategy-workbench__header"><h2 id="game-heading">Compare guarantees before mixing strategies.</h2><p>The row player maximizes the payoff; the column player minimizes it. A saddle point ends the search early.</p></header>
      {gameAnalysis.error ? <Feedback tone="error" role="alert">{gameAnalysis.error}</Feedback> : <>
        <div className="strategy-workbench__payoff-wrap"><table aria-label="Row player payoff matrix"><thead><tr><th></th><th>Column 1</th><th>Column 2</th><th>Row minimum</th></tr></thead><tbody>{game.map((row, rowIndex) => <tr key={rowIndex}><th>Row {rowIndex + 1}</th>{row.map((value, columnIndex) => <td key={columnIndex}><label><span className="sr-only">Payoff row {rowIndex + 1} column {columnIndex + 1}</span><input data-primary-control value={value} onChange={(event) => updateGame(rowIndex, columnIndex, event.target.value)} /></label></td>)}<td>{gameAnalysis.rowMinima?.[rowIndex]?.toString()}</td></tr>)}<tr><th>Column maximum</th>{gameAnalysis.columnMaxima?.map((value, index) => <td key={index}>{value.toString()}</td>)}<td></td></tr></tbody></table></div>
        <div className="strategy-workbench__security"><span>maximin {gameAnalysis.maximin?.toString()}</span><span>minimax {gameAnalysis.minimax?.toString()}</span></div>
        {gameAnalysis.solution && <GameResult solution={gameAnalysis.solution} />}
      </>}
    </section>}

    {mode === 'advanced' && <section className="strategy-workbench__stage" aria-labelledby="advanced-heading">
      <header className="strategy-workbench__header"><h2 id="advanced-heading">Inspect the algorithm after the model makes sense.</h2><p>These traces extend the main models. They stay subordinate so the initial workspace remains readable.</p></header>
      <details className="strategy-workbench__advanced" open><summary>Simplex trace for current linear program</summary>{lp.simplex ? <div><strong>Simplex {lp.simplex.status === 'optimal' ? 'optimum' : lp.simplex.status}{lp.simplex.objectiveValue ? ` Z = ${lp.simplex.objectiveValue.toString()}` : ''}</strong><ol>{lp.simplex.steps.map((step) => <li key={step.iteration}>{step.label}</li>)}</ol></div> : <p>Simplex is available for maximization models with ≤ constraints.</p>}</details>
      <details className="strategy-workbench__advanced"><summary>Two-state Markov forecast</summary><fieldset disabled={!hydrated}><legend className="sr-only">Two-state transition model</legend><div className="strategy-workbench__markov-grid">{markov.map((value, index) => <label key={index} className="form-field"><span className="form-field__label">P({index < 2 ? 'A' : 'B'} → {index % 2 === 0 ? 'A' : 'B'})</span><input data-primary-control className="text-input" value={value} onChange={(event) => updateMarkov(index, event.target.value)} /></label>)}</div><div className="strategy-workbench__markov-controls"><label className="form-field"><span className="form-field__label">Initial P(A)</span><input data-primary-control className="text-input" value={initialA} onChange={(event) => setInitialA(event.target.value)} /></label><label className="form-field"><span className="form-field__label">Steps</span><input data-primary-control className="text-input" type="number" min="0" max="10000" value={markovSteps} onChange={(event) => setMarkovSteps(Number(event.target.value))} /></label></div></fieldset>{markovAnalysis.error ? <Feedback tone="error" role="alert">{markovAnalysis.error}</Feedback> : markovAnalysis.after && <div className="strategy-workbench__markov-result"><strong>After {markovSteps} steps: ({markovAnalysis.after.map((value) => value.toString()).join(', ')})</strong>{markovAnalysis.stationary?.kind === 'unique' && <span>Stationary: ({markovAnalysis.stationary.vector.map((value) => value.toString()).join(', ')})</span>}</div>}</details>
    </section>}
  </section>;
}

function LpResult({ result }: { result: GraphicalLpResult }) {
  const optimum = result.optima[0];
  return <div className="strategy-workbench__result" data-optimization-result><span>{result.status}</span><strong>{optimum ? `Z = ${optimum.value.toString()} at ${pointText(optimum.point)}` : result.status === 'unbounded' ? 'The objective improves without bound.' : 'No feasible point exists.'}</strong><small>{result.message}</small></div>;
}

function GameResult({ solution }: { solution: ReturnType<typeof solveZeroSum2x2> }) {
  if (solution.kind === 'mixed') return <div className="strategy-workbench__result"><span>Mixed equilibrium</span><strong>Game value {solution.value.toString()}</strong><small>Row mix ({solution.pRow1.toString()}, {solution.pRow2.toString()}) · Column mix ({solution.qCol1.toString()}, {solution.qCol2.toString()})</small></div>;
  if (solution.kind === 'pure') return <div className="strategy-workbench__result"><span>Pure equilibrium</span><strong>Game value {solution.saddles[0]?.value.toString()}</strong><small>Saddle at row {(solution.saddles[0]?.row ?? 0) + 1}, column {(solution.saddles[0]?.col ?? 0) + 1}.</small></div>;
  return <div className="strategy-workbench__result"><span>{solution.kind} solution</span><strong>Inspect a boundary or dominated strategy.</strong><small>{solution.reason}</small></div>;
}

function LpGraph({ constraints, result }: { constraints: ConstraintRow[]; result: GraphicalLpResult }) {
  const points = result.vertices.map((vertex) => ({ exact: vertex.point, x: vertex.point.x.toNumber(), y: vertex.point.y.toNumber() }));
  const coordinates = points.flatMap((point) => [point.x, point.y]).filter((value) => Number.isFinite(value) && value >= 0);
  const max = Math.max(5, ...coordinates) * 1.18;
  const sx = (value: number) => 48 + value / max * 500;
  const sy = (value: number) => 340 - value / max * 290;
  const center = points.reduce((value, point) => ({ x: value.x + point.x / Math.max(points.length, 1), y: value.y + point.y / Math.max(points.length, 1) }), { x: 0, y: 0 });
  const hull = [...points].sort((left, right) => Math.atan2(left.y - center.y, left.x - center.x) - Math.atan2(right.y - center.y, right.x - center.x));
  const boundedLabel = result.regionBounded ? 'Bounded' : 'Unbounded';
  return <figure className="strategy-workbench__plot" role="region" aria-label="Linear programming plot; scroll horizontally to inspect the full coordinate plane" tabIndex={0}><svg viewBox="0 0 600 380" role="img" aria-label={`${boundedLabel} feasible region with ${points.length} corner points`}><line className="strategy-workbench__axis" x1="48" y1="340" x2="570" y2="340"/><line className="strategy-workbench__axis" x1="48" y1="340" x2="48" y2="28"/><text x="576" y="346">x</text><text x="35" y="22">y</text>{result.regionBounded && hull.length >= 3 && <polygon className="strategy-workbench__region" points={hull.map((point) => `${sx(point.x)},${sy(point.y)}`).join(' ')} />}{constraints.map((constraint, index) => { const line = constraintLine(constraint, max); return line.length === 2 ? <g key={index}><line className="strategy-workbench__boundary" x1={sx(line[0]!.x)} y1={sy(line[0]!.y)} x2={sx(line[1]!.x)} y2={sy(line[1]!.y)} /><text x={sx(line[0]!.x) + 5} y={sy(line[0]!.y) - 6}>C{index + 1}</text></g> : null; })}{points.map((point, index) => <g key={index}><circle className={result.optima.some((candidate) => candidate.point.x.equals(point.exact.x) && candidate.point.y.equals(point.exact.y)) ? 'strategy-workbench__point strategy-workbench__point--best' : 'strategy-workbench__point'} cx={sx(point.x)} cy={sy(point.y)} r="6"/><text x={sx(point.x) + 8} y={sy(point.y) - 8}>{pointText(point.exact)}</text></g>)}</svg><figcaption>{result.message}</figcaption></figure>;
}

function constraintLine(row: ConstraintRow, max: number): Array<{ x: number; y: number }> {
  try {
    const a = Rational.from(row.a).toNumber(), b = Rational.from(row.b).toNumber(), c = Rational.from(row.c).toNumber();
    const candidates: Array<{ x: number; y: number }> = [];
    if (b !== 0) for (const x of [0, max]) { const y = (c - a * x) / b; if (y >= 0 && y <= max) candidates.push({ x, y }); }
    if (a !== 0) for (const y of [0, max]) { const x = (c - b * y) / a; if (x >= 0 && x <= max) candidates.push({ x, y }); }
    return candidates.filter((point, index, list) => list.findIndex((item) => Math.abs(item.x - point.x) < 1e-9 && Math.abs(item.y - point.y) < 1e-9) === index).slice(0, 2);
  } catch { return []; }
}
