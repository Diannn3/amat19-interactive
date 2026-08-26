import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import {
  checkEquivalence,
  evaluateLogic,
  formatLogic,
  generateAssignments,
  parseLogic
} from '@amat19/domain-logic';
import { Button } from '../../ui/Button';
import { Feedback } from '../../ui/Feedback';
import { loadDraft, saveDraft } from '../../../lib/draft';
import { recordAttempt, recordSkillEvidence } from '../../../lib/local-progress';

const LAB_ID = 'logic.equivalence';
const CONTENT_VERSION = '2';

type Draft = { left: string; right: string };

const PRESETS = [
  { label: 'Implication vs contrapositive', left: 'P -> Q', right: '~Q -> ~P' },
  { label: 'Implication vs converse', left: 'P -> Q', right: 'Q -> P' },
  { label: 'De Morgan', left: '~(P | Q)', right: '~P & ~Q' }
];

export default function EquivalenceLab() {
  const [left, setLeft] = useState('P -> Q');
  const [right, setRight] = useState('~Q -> ~P');
  const [prediction, setPrediction] = useState<'equivalent' | 'different'>();
  const [revealed, setRevealed] = useState(false);
  const [restored, setRestored] = useState(false);

  useEffect(() => {
    loadDraft<Draft>(LAB_ID, CONTENT_VERSION).then((draft) => {
      if (draft) { setLeft(draft.left); setRight(draft.right); }
      setRestored(true);
    });
  }, []);

  useEffect(() => {
    if (!restored) return;
    const timer = window.setTimeout(() => void saveDraft(LAB_ID, CONTENT_VERSION, { left, right }), 300);
    return () => window.clearTimeout(timer);
  }, [left, right, restored]);

  const analysis = useMemo(() => {
    try {
      const result = checkEquivalence(left, right);
      const leftAst = parseLogic(left);
      const rightAst = parseLogic(right);
      const assignments = generateAssignments(result.symbols);
      const rows = assignments.map((assignment, index) => ({
        index,
        assignment,
        left: evaluateLogic(leftAst, assignment).value,
        right: evaluateLogic(rightAst, assignment).value
      }));
      return {
        error: undefined,
        result,
        rows,
        normalizedLeft: formatLogic(leftAst),
        normalizedRight: formatLogic(rightAst)
      };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'The pair could not be analyzed.' };
    }
  }, [left, right]);

  const predictionCorrect = analysis.result
    ? (prediction === 'equivalent') === analysis.result.equivalent
    : false;

  async function reveal() {
    if (!prediction || !analysis.result) return;
    setRevealed(true);
    await Promise.all([
      recordAttempt({
        prefix: 'equivalence', exerciseId: 'logic.equivalence.compare', module: 'logic',
        finalState: predictionCorrect ? 'correct' : 'incomplete',
        payload: { left, right, prediction, equivalent: analysis.result.equivalent }
      }),
      recordSkillEvidence('logic.equivalence', predictionCorrect ? 1 : 0)
    ]).catch(() => undefined);
  }

  return (
    <section className="learning-lab learning-lab--wide" data-testid="equivalence-lab">
      <div className="learning-lab__prompt">
        <p className="section-label">Semantic equivalence</p>
        <h2>Compare every valuation, not the appearance.</h2>

        <div className="two-column-fields">
          <label className="form-field">
            <span className="form-field__label">Expression A</span>
            <input className="text-input logic-input" value={left} onChange={(e) => { setLeft(e.target.value); setRevealed(false); }} aria-label="Expression A" />
            {analysis.normalizedLeft && <span className="form-field__hint">Normalized: {analysis.normalizedLeft}</span>}
          </label>
          <label className="form-field">
            <span className="form-field__label">Expression B</span>
            <input className="text-input logic-input" value={right} onChange={(e) => { setRight(e.target.value); setRevealed(false); }} aria-label="Expression B" />
            {analysis.normalizedRight && <span className="form-field__hint">Normalized: {analysis.normalizedRight}</span>}
          </label>
        </div>

        <div className="preset-row" aria-label="Example pairs">
          {PRESETS.map((preset) => (
            <button key={preset.label} className="text-chip" type="button" onClick={() => {
              setLeft(preset.left); setRight(preset.right); setPrediction(undefined); setRevealed(false);
            }}>{preset.label}</button>
          ))}
        </div>

        {analysis.error && <Feedback tone="error" role="alert">{analysis.error}</Feedback>}

        {!analysis.error && (
          <>
            <fieldset className="prediction-fieldset">
              <legend>Predict before revealing</legend>
              <label><input type="radio" name="equivalence-prediction" checked={prediction === 'equivalent'} onChange={() => { setPrediction('equivalent'); setRevealed(false); }} /> Equivalent</label>
              <label><input type="radio" name="equivalence-prediction" checked={prediction === 'different'} onChange={() => { setPrediction('different'); setRevealed(false); }} /> Not equivalent</label>
            </fieldset>
            <Button variant="primary" type="button" disabled={!prediction} onClick={reveal}>Check prediction</Button>
          </>
        )}
      </div>

      <div className="learning-lab__explain">
        <p className="section-label">Evidence</p>
        {!revealed && <p>The verdict stays hidden until you predict. Equivalent propositions must match on every assignment.</p>}
        {revealed && analysis.result && (
          <>
            <Feedback tone={predictionCorrect ? 'success' : 'error'} role={predictionCorrect ? 'status' : 'alert'}>
              {predictionCorrect ? <CheckCircle2 size={18} aria-hidden="true" /> : <XCircle size={18} aria-hidden="true" />}
              <strong>{analysis.result.equivalent ? 'Equivalent.' : 'Not equivalent.'}</strong>
              {analysis.result.equivalent
                ? ' Their final truth values agree for every valuation.'
                : ' At least one valuation makes the final truth values differ.'}
            </Feedback>
            {analysis.result.counterexample && (
              <div className="counterexample-box">
                <strong>First counterexample</strong>
                <span>{analysis.result.symbols.map((symbol) => `${symbol}=${analysis.result!.counterexample![symbol] ? 'T' : 'F'}`).join(', ')}</span>
              </div>
            )}
          </>
        )}
      </div>

      {revealed && analysis.rows && (
        <div className="learning-lab__full">
          <div className="truth-table-scroll" tabIndex={0} aria-label="Equivalence comparison truth table">
            <table className="truth-table">
              <caption className="sr-only">Final truth values for both expressions. Differing rows are highlighted.</caption>
              <thead>
                <tr>
                  {analysis.result?.symbols.map((symbol) => <th key={symbol}>{symbol}</th>)}
                  <th>Expression A</th><th>Expression B</th><th>Compare</th>
                </tr>
              </thead>
              <tbody>
                {analysis.rows.map((row) => (
                  <tr key={row.index} data-counterexample={row.left !== row.right}>
                    {analysis.result?.symbols.map((symbol) => <td key={symbol}>{row.assignment[symbol] ? 'T' : 'F'}</td>)}
                    <td>{row.left ? 'T' : 'F'}</td>
                    <td>{row.right ? 'T' : 'F'}</td>
                    <td>{row.left === row.right ? 'same' : <strong>differs</strong>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
