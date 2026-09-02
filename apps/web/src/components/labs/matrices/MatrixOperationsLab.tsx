import { useMemo, useState } from 'react';
import {
  addMatrices,
  determinant,
  matrix,
  multiplicationCellTrace,
  multiplyMatrices,
  scalarMultiply,
  shape,
  subtractMatrices,
  transpose,
  type Matrix,
} from '@amat19/domain-linear';
import { Button } from '../../ui/Button';
import { Feedback } from '../../ui/Feedback';
import { MatrixEditor } from '../../math/MatrixEditor';
import { MatrixView } from '../../math/MatrixView';
import { recordAttempt, recordSkillEvidence } from '../../../lib/local-progress';

type Operation = 'add' | 'subtract' | 'multiply' | 'scalar' | 'transpose-a' | 'determinant-a';

function parseGrid(raw: string): Matrix {
  const rows = raw.trim().split(/\n+/).map((line) => line.trim().split(/[\s,]+/).filter(Boolean));
  if (!rows.length || !rows[0]?.length) throw new Error('Enter at least one matrix row.');
  return matrix(rows);
}

const operationLabel: Record<Operation, string> = {
  add: 'Add', subtract: 'Subtract', multiply: 'Multiply', scalar: 'Scale', 'transpose-a': 'Transpose A', 'determinant-a': 'det(A)',
};

export default function MatrixOperationsLab() {
  const [aRaw, setARaw] = useState('1 2\n3 4');
  const [bRaw, setBRaw] = useState('2 0\n1 2');
  const [operation, setOperation] = useState<Operation>('multiply');
  const [scalar, setScalar] = useState('2');
  const [selected, setSelected] = useState<[number, number]>([0, 0]);
  const [prediction, setPrediction] = useState<'compatible' | 'incompatible'>();
  const [checked, setChecked] = useState(false);

  const analysis = useMemo(() => {
    try {
      const A = parseGrid(aRaw);
      const B = parseGrid(bRaw);
      const sa = shape(A);
      const sb = shape(B);
      let result: Matrix | undefined;
      let scalarResult: string | undefined;
      if (operation === 'add') result = addMatrices(A, B);
      if (operation === 'subtract') result = subtractMatrices(A, B);
      if (operation === 'multiply') result = multiplyMatrices(A, B);
      if (operation === 'scalar') result = scalarMultiply(A, scalar);
      if (operation === 'transpose-a') result = transpose(A);
      if (operation === 'determinant-a') scalarResult = determinant(A).toString();
      const trace = operation === 'multiply' && result
        ? multiplicationCellTrace(A, B, Math.min(selected[0], result.length - 1), Math.min(selected[1], result[0]!.length - 1))
        : undefined;
      return { A, B, sa, sb, result, scalarResult, trace, error: undefined };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Matrix input could not be evaluated.' };
    }
  }, [aRaw, bRaw, operation, scalar, selected]);

  const needsB = ['add', 'subtract', 'multiply'].includes(operation);
  const compatible = analysis.sa && analysis.sb
    ? operation === 'multiply'
      ? analysis.sa.cols === analysis.sb.rows
      : analysis.sa.rows === analysis.sb.rows && analysis.sa.cols === analysis.sb.cols
    : false;

  async function checkCompatibility() {
    if (!prediction || !analysis.sa || !analysis.sb) return;
    const ok = (prediction === 'compatible') === compatible;
    setChecked(true);
    await Promise.all([
      recordAttempt({ prefix: 'matrix', exerciseId: 'linear.matrix.compatibility', module: 'linear', finalState: ok ? 'correct' : 'incomplete', payload: { operation, prediction, shapeA: analysis.sa, shapeB: analysis.sb }, skillIds: ['linear.matrix.multiply'] }),
      recordSkillEvidence(operation === 'multiply' ? 'linear.matrix.multiply' : 'linear.operations', ok ? 1 : 0, { independent: ok }),
    ]).catch(() => undefined);
  }

  return (
    <section className="matrix-lab" data-testid="matrix-operations-lab">
      <div className="matrix-lab__inputs">
        <div>
          <h2>Dimensions decide what operation is legal.</h2>
          <p className="section-context">Matrix operations</p>
        </div>
        <div className="view-switch" aria-label="Matrix operation">
          {(Object.keys(operationLabel) as Operation[]).map((value) => (
            <Button key={value} variant={operation === value ? 'primary' : 'secondary'} aria-pressed={operation === value} onClick={() => { setOperation(value); setChecked(false); }}>
              {operationLabel[value]}
            </Button>
          ))}
        </div>
        <MatrixEditor label="Matrix A" value={aRaw} onChange={setARaw} />
        {needsB && <MatrixEditor label="Matrix B" value={bRaw} onChange={setBRaw} />}
        {operation === 'scalar' && <label className="form-field"><span className="form-field__label">Scalar k</span><input className="text-input" value={scalar} onChange={(event) => setScalar(event.target.value)} /></label>}
        {needsB && (
          <fieldset className="prediction-fieldset">
            <legend>Predict compatibility before calculating</legend>
            <label><input type="radio" name="matrix-compatibility" checked={prediction === 'compatible'} onChange={() => { setPrediction('compatible'); setChecked(false); }} /> The operation is defined</label>
            <label><input type="radio" name="matrix-compatibility" checked={prediction === 'incompatible'} onChange={() => { setPrediction('incompatible'); setChecked(false); }} /> The dimensions make it undefined</label>
            <Button disabled={!prediction || !analysis.sa || !analysis.sb} onClick={() => void checkCompatibility()}>Check dimensions</Button>
            {checked && analysis.sa && analysis.sb && <Feedback tone={(prediction === 'compatible') === compatible ? 'success' : 'error'}>A is {analysis.sa.rows}×{analysis.sa.cols}; B is {analysis.sb.rows}×{analysis.sb.cols}. {operation === 'multiply' ? 'Multiplication needs A columns = B rows.' : 'Addition and subtraction need equal dimensions.'}</Feedback>}
          </fieldset>
        )}
      </div>

      <div className="matrix-lab__visual">
        {analysis.error ? <Feedback tone="error" role="alert">{analysis.error}</Feedback> : (
          <>
            <div className="math-panel__head">
              <div>
                <h3>{operation === 'multiply' ? 'Select a product cell to unpack its dot product.' : 'Exact rational result'}</h3>
                <p className="section-context">{operationLabel[operation]}</p>
              </div>
              {analysis.sa && <span className="amat-badge">A · {analysis.sa.rows}×{analysis.sa.cols}</span>}
            </div>

            <div className="matrix-equation" aria-label="Matrix equation">
              <div><span>A</span><MatrixView value={analysis.A!} label="Matrix A" /></div>
              {needsB && <><strong>{operation === 'multiply' ? '×' : operation === 'add' ? '+' : '−'}</strong><div><span>B</span><MatrixView value={analysis.B!} label="Matrix B" /></div></>}
              {operation === 'scalar' && <strong>× {scalar}</strong>}
              <strong>=</strong>
              <div>
                <span>{operation === 'determinant-a' ? 'det(A)' : 'result'}</span>
                {analysis.result ? (
                  <div className="matrix-bracket" role="img" aria-label={`Result matrix: ${analysis.result.map((row) => row.map((value) => value.toString()).join(', ')).join('; ')}`}>
                    <table className="matrix-table" aria-hidden="true"><tbody>{analysis.result.map((row, rowIndex) => <tr key={rowIndex}>{row.map((value, columnIndex) => <td key={columnIndex}>{operation === 'multiply' ? <button type="button" className="matrix-cell-button" data-selected={selected[0] === rowIndex && selected[1] === columnIndex} onClick={() => setSelected([rowIndex, columnIndex])}>{value.toString()}</button> : value.toString()}</td>)}</tr>)}</tbody></table>
                  </div>
                ) : <div className="scalar-result">{analysis.scalarResult}</div>}
              </div>
            </div>

            {analysis.trace && (
              <div className="dot-product-trace">
                <p className="section-label">Selected product cell · row {analysis.trace.row + 1}, column {analysis.trace.col + 1}</p>
                <div>{analysis.trace.terms.map((term, index) => <span key={index}>{term.left.toString()} × {term.right.toString()} = {term.product.toString()}</span>)}</div>
                <p>Sum = <strong>{analysis.trace.value.toString()}</strong></p>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
