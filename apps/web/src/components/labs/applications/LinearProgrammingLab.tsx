import { useMemo, useState } from 'react';
import { simplexMax, solveGraphicalLP, type Constraint2D } from '@amat19/domain-linear';
import { Button } from '../../ui/Button';
import { Feedback } from '../../ui/Feedback';
import { recordAttempt, recordSkillEvidence } from '../../../lib/local-progress';

type Row = Constraint2D & { id: number };
type Stage = 1 | 2 | 3 | 4;

export default function LinearProgrammingLab() {
  const [constraints, setConstraints] = useState<Row[]>([
    { id: 1, a: 1, b: 1, relation: '<=', c: 4 },
    { id: 2, a: 1, b: 0, relation: '<=', c: 3 },
    { id: 3, a: 0, b: 1, relation: '<=', c: 2 },
  ]);
  const [cx, setCx] = useState(3);
  const [cy, setCy] = useState(2);
  const [sense, setSense] = useState<'max' | 'min'>('max');
  const [prediction, setPrediction] = useState<'optimal' | 'unbounded' | 'infeasible'>();
  const [checked, setChecked] = useState(false);
  const [stage, setStage] = useState<Stage>(4);
  const [simplexStep, setSimplexStep] = useState(0);
  const [entering, setEntering] = useState('');
  const [leaving, setLeaving] = useState('');
  const [pivotFeedback, setPivotFeedback] = useState<boolean>();

  const result = useMemo(() => {
    try { return { value: solveGraphicalLP(constraints, { x: cx, y: cy, sense }), error: undefined }; }
    catch (error) { return { value: undefined, error: error instanceof Error ? error.message : 'LP could not be solved.' }; }
  }, [constraints, cx, cy, sense]);

  const simplex = useMemo(() => {
    try {
      if (sense !== 'max' || constraints.some((constraint) => constraint.relation !== '<=' || constraint.c < 0)) return undefined;
      return simplexMax({ objective: [cx, cy], constraints: constraints.map((constraint) => ({ coefficients: [constraint.a, constraint.b], bound: constraint.c })) });
    } catch { return undefined; }
  }, [constraints, cx, cy, sense]);

  const update = (id: number, patch: Partial<Row>) => setConstraints((rows) => rows.map((row) => row.id === id ? { ...row, ...patch } : row));
  const nextPivot = simplex?.steps[simplexStep + 1];
  const pivotRequired = Boolean(nextPivot?.enteringColumn !== undefined && nextPivot?.leavingRow !== undefined);

  async function check() {
    if (!prediction || !result.value) return;
    const ok = prediction === result.value.status;
    setChecked(true);
    await Promise.all([
      recordAttempt({ prefix: 'lp', exerciseId: 'applications.lp.status', module: 'applications', finalState: ok ? 'correct' : 'incomplete', payload: { prediction, status: result.value.status, constraints, cx, cy, sense }, skillIds: ['applications.lp.corner-point'] }),
      recordSkillEvidence('applications.lp.corner-point', ok ? 1 : 0, { independent: ok }),
    ]).catch(() => undefined);
  }

  function checkPivot() {
    if (!nextPivot) return;
    setPivotFeedback(Number(entering) === nextPivot.enteringColumn! + 1 && Number(leaving) === nextPivot.leavingRow! + 1);
  }

  function moveSimplex(delta: number) {
    setSimplexStep((current) => Math.max(0, Math.min((simplex?.steps.length ?? 1) - 1, current + delta)));
    setEntering('');
    setLeaving('');
    setPivotFeedback(undefined);
  }

  return (
    <section className="lp-lab" data-testid="lp-lab">
      <div className="lp-lab__controls">
        <h2>Build the geometry before optimizing.</h2>
        <p className="section-context">Graphical linear programming</p>

        <div className="objective-row">
          <select className="select-input" aria-label="Objective direction" value={sense} onChange={(event) => { setSense(event.target.value as 'max' | 'min'); setChecked(false); }}>
            <option value="max">Maximize</option><option value="min">Minimize</option>
          </select>
          <label className="form-field"><span className="form-field__label">x coefficient</span><input className="text-input" type="number" value={cx} onChange={(event) => setCx(Number(event.target.value))} /></label>
          <label className="form-field"><span className="form-field__label">y coefficient</span><input className="text-input" type="number" value={cy} onChange={(event) => setCy(Number(event.target.value))} /></label>
        </div>

        <div className="constraint-editor" aria-label="Constraints">
          {constraints.map((constraint, index) => (
            <div className="constraint-row" key={constraint.id}>
              <span>C{index + 1}</span>
              <input aria-label={`Constraint ${index + 1} x coefficient`} type="number" value={constraint.a} onChange={(event) => update(constraint.id, { a: Number(event.target.value) })} />
              <span>x +</span>
              <input aria-label={`Constraint ${index + 1} y coefficient`} type="number" value={constraint.b} onChange={(event) => update(constraint.id, { b: Number(event.target.value) })} />
              <span>y</span>
              <select aria-label={`Constraint ${index + 1} relation`} value={constraint.relation} onChange={(event) => update(constraint.id, { relation: event.target.value as Constraint2D['relation'] })}>
                <option value="<=">≤</option><option value=">=">≥</option><option value="=">=</option>
              </select>
              <input aria-label={`Constraint ${index + 1} bound`} type="number" value={constraint.c} onChange={(event) => update(constraint.id, { c: Number(event.target.value) })} />
              <Button variant="ghost" disabled={constraints.length <= 1} onClick={() => setConstraints((rows) => rows.filter((row) => row.id !== constraint.id))}>Remove</Button>
            </div>
          ))}
        </div>
        <Button variant="ghost" onClick={() => setConstraints((rows) => [...rows, { id: Math.max(0, ...rows.map((row) => row.id)) + 1, a: 1, b: 1, relation: '<=', c: 5 }])}>+ Add constraint</Button>

        <fieldset className="prediction-fieldset">
          <legend>Predict the model status</legend>
          {(['optimal', 'unbounded', 'infeasible'] as const).map((value) => (
            <label key={value}><input type="radio" name="lp-solution-status" checked={prediction === value} onChange={() => { setPrediction(value); setChecked(false); }} /> {value}</label>
          ))}
          <Button disabled={!prediction || !result.value} onClick={() => void check()}>Check prediction</Button>
          {checked && result.value && <Feedback tone={prediction === result.value.status ? 'success' : 'error'}>{prediction === result.value.status ? 'Correct.' : `The feasible geometry is ${result.value.status}.`}</Feedback>}
        </fieldset>
      </div>

      <div className="lp-lab__visual">
        {result.error ? <Feedback tone="error">{result.error}</Feedback> : result.value && (
          <>
            <div className="lp-guided-steps" aria-label="Graph construction stages">
              {(['Boundary', 'Region', 'Corners', 'Objective'] as const).map((label, index) => {
                const value = (index + 1) as Stage;
                return <button type="button" key={label} data-active={stage === value} aria-pressed={stage === value} onClick={() => setStage(value)}><span>{index + 1}</span>{label}</button>;
              })}
            </div>
            <LpPlot constraints={constraints} vertices={result.value.vertices.map((vertex) => vertex.point)} optima={result.value.optima.map((vertex) => vertex.point)} cx={cx} cy={cy} stage={stage} />
            <div className="formula-callout"><span>Status</span><strong>{result.value.status}</strong><small>{result.value.message}</small></div>
            {stage >= 3 && (
              <div className="vertex-table-wrap" role="region" aria-label="Feasible corner points" tabIndex={0}>
                <table className="vertex-table">
                  <thead><tr><th>Corner</th><th>x</th><th>y</th><th>Z = {cx}x + {cy}y</th></tr></thead>
                  <tbody>{result.value.vertices.map((vertex, index) => (
                    <tr key={index} data-optimum={result.value!.optima.some((optimum) => Math.hypot(optimum.point.x - vertex.point.x, optimum.point.y - vertex.point.y) < 1e-7)}>
                      <td>V{index + 1}</td><td>{clean(vertex.point.x)}</td><td>{clean(vertex.point.y)}</td><td>{clean(vertex.value)}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            )}
            {stage >= 4 && result.value.optima[0] && (
              <div className="formula-callout lp-optimum">
                <span>Optimal solution</span>
                <strong>Z = {clean(result.value.optima[0].value)}</strong>
                <small>at (x, y) = ({clean(result.value.optima[0].point.x)}, {clean(result.value.optima[0].point.y)})</small>
              </div>
            )}
          </>
        )}
      </div>

      <details className="lp-lab__simplex">
        <summary>Open simplex trace <span>Supplemental</span></summary>
        <div className="lp-simplex-body">
          {simplex ? (
            <>
              <p>The tableau is a teaching representation of the same supported standard maximization model.</p>
              <div className="step-toolbar"><Button variant="ghost" disabled={simplexStep === 0} onClick={() => moveSimplex(-1)}>←</Button><span>Tableau {simplexStep + 1} / {simplex.steps.length}</span><Button variant="ghost" disabled={simplexStep >= simplex.steps.length - 1 || (pivotRequired && pivotFeedback !== true)} onClick={() => moveSimplex(1)}>→</Button></div>
              <p><strong>{simplex.steps[simplexStep]?.label}</strong></p>
              <SimplexTable tableau={simplex.steps[simplexStep]!.tableau} />
              {pivotRequired && simplexStep < simplex.steps.length - 1 && (
                <div className="row-op-builder">
                  <p>Before revealing the next tableau, predict the pivot.</p>
                  <div className="row-op-builder__controls">
                    <label>Entering column<input type="number" min="1" value={entering} onChange={(event) => { setEntering(event.target.value); setPivotFeedback(undefined); }} /></label>
                    <label>Leaving row<input type="number" min="1" value={leaving} onChange={(event) => { setLeaving(event.target.value); setPivotFeedback(undefined); }} /></label>
                    <Button variant="secondary" onClick={checkPivot}>Check pivot</Button>
                  </div>
                  {pivotFeedback !== undefined && <Feedback tone={pivotFeedback ? 'success' : 'error'}>{pivotFeedback ? 'Correct. Reveal the next tableau.' : 'Use the improving objective coefficient, then the positive minimum-ratio test.'}</Feedback>}
                </div>
              )}
              {simplex.status === 'optimal' && <div className="formula-callout"><span>Simplex optimum</span><strong>Z = {simplex.objectiveValue?.toString()}</strong><small>x = {simplex.solution?.map((value) => value.toString()).join(', ')}</small></div>}
            </>
          ) : <p>The simplex trace appears only for the supported standard maximization form.</p>}
        </div>
      </details>
    </section>
  );
}

function clean(value: number) { return value.toFixed(4).replace(/0+$/, '').replace(/\.$/, ''); }

function SimplexTable({ tableau }: { tableau: any[][] }) {
  return <div className="matrix-wrap" role="region" tabIndex={0} aria-label="Simplex tableau; scroll horizontally to inspect all columns"><table className="matrix-table"><tbody>{tableau.map((row, rowIndex) => <tr key={rowIndex}>{row.map((value, columnIndex) => <td key={columnIndex}>{value.toString()}</td>)}</tr>)}</tbody></table></div>;
}

function LpPlot({ constraints, vertices, optima, cx, cy, stage }: { constraints: Constraint2D[]; vertices: Array<{ x: number; y: number }>; optima: Array<{ x: number; y: number }>; cx: number; cy: number; stage: Stage }) {
  const max = Math.max(5, ...vertices.flatMap((vertex) => [vertex.x, vertex.y]).filter(Number.isFinite).map((value) => Math.max(0, value))) * 1.25;
  const sx = (x: number) => 50 + (x / max) * 500;
  const sy = (y: number) => 550 - (y / max) * 500;
  const line = (constraint: Constraint2D) => {
    const points: Array<{ x: number; y: number }> = [];
    if (Math.abs(constraint.b) > 1e-9) for (const x of [0, max]) { const y = (constraint.c - constraint.a * x) / constraint.b; if (y >= 0 && y <= max) points.push({ x, y }); }
    if (Math.abs(constraint.a) > 1e-9) for (const y of [0, max]) { const x = (constraint.c - constraint.b * y) / constraint.a; if (x >= 0 && x <= max) points.push({ x, y }); }
    return points.slice(0, 2);
  };
  const hull = [...vertices].sort((a, b) => Math.atan2(a.y - avg(vertices, 'y'), a.x - avg(vertices, 'x')) - Math.atan2(b.y - avg(vertices, 'y'), b.x - avg(vertices, 'x')));
  const best = optima[0];
  const z = best ? cx * best.x + cy * best.y : undefined;
  const objective = z === undefined ? [] : clipLine(cx, cy, z, max);

  return (
    <figure className="lp-plot">
      <svg viewBox="0 0 620 610" role="img" aria-label="Linear programming coordinate plane showing constraints, feasible region, corner points, and objective line">
        <defs>
          <pattern id="amatHatch" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="9" stroke="currentColor" strokeOpacity=".16" strokeWidth="2" /></pattern>
        </defs>
        <line className="axis" x1="50" y1="550" x2="570" y2="550" /><line className="axis" x1="50" y1="550" x2="50" y2="30" />
        <text x="580" y="555">x</text><text x="38" y="25">y</text>
        {stage >= 2 && hull.length >= 3 && <polygon points={hull.map((vertex) => `${sx(vertex.x)},${sy(vertex.y)}`).join(' ')} fill="url(#amatHatch)" stroke="currentColor" strokeWidth="1.5" />}
        {constraints.map((constraint, index) => {
          const points = line(constraint);
          return points.length === 2 ? <g key={index}><line className="constraint-line" x1={sx(points[0]!.x)} y1={sy(points[0]!.y)} x2={sx(points[1]!.x)} y2={sy(points[1]!.y)} /><text x={sx(points[0]!.x) + 6} y={sy(points[0]!.y) - 6}>C{index + 1}</text></g> : null;
        })}
        {stage >= 4 && objective.length === 2 && <line className="objective-line" x1={sx(objective[0]!.x)} y1={sy(objective[0]!.y)} x2={sx(objective[1]!.x)} y2={sy(objective[1]!.y)} stroke="currentColor" strokeWidth="2" strokeDasharray="9 7" />}
        {stage >= 3 && vertices.map((vertex, index) => <g key={`v${index}`}><circle className={stage >= 4 && optima.some((optimum) => Math.hypot(optimum.x - vertex.x, optimum.y - vertex.y) < 1e-7) ? 'optimum-point' : 'vertex-point'} cx={sx(vertex.x)} cy={sy(vertex.y)} r="7" /><text x={sx(vertex.x) + 8} y={sy(vertex.y) - 8}>({clean(vertex.x)},{clean(vertex.y)})</text></g>)}
      </svg>
      <figcaption>{stage === 1 ? 'Boundary lines only: each inequality still needs a feasible side.' : stage === 2 ? 'Hatching shows the intersection of all feasible half-planes.' : stage === 3 ? 'Feasible corners are candidates for a bounded linear objective.' : 'The dashed objective line passes through the current optimum; all corners are evaluated below.'}</figcaption>
    </figure>
  );
}

function avg(points: Array<{ x: number; y: number }>, key: 'x' | 'y') { return points.length ? points.reduce((sum, point) => sum + point[key], 0) / points.length : 0; }
function clipLine(a: number, b: number, c: number, max: number) {
  const points: Array<{ x: number; y: number }> = [];
  if (Math.abs(b) > 1e-9) for (const x of [0, max]) { const y = (c - a * x) / b; if (y >= 0 && y <= max) points.push({ x, y }); }
  if (Math.abs(a) > 1e-9) for (const y of [0, max]) { const x = (c - b * y) / a; if (x >= 0 && x <= max) points.push({ x, y }); }
  return points.filter((point, index, self) => self.findIndex((candidate) => Math.hypot(point.x - candidate.x, point.y - candidate.y) < 1e-7) === index).slice(0, 2);
}
