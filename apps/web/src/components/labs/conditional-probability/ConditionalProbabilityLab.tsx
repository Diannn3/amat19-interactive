import { useEffect, useMemo, useState } from 'react';
import { analyzeTwoWayTable, makeTwoWayTable } from '@amat19/domain-probability';
import { Button } from '../../ui/Button';
import { Feedback } from '../../ui/Feedback';
import { recordAttempt, recordSkillEvidence } from '../../../lib/local-progress';
import { loadDraft, saveDraft } from '../../../lib/draft';

type CellKey = 'aAndB' | 'aAndNotB' | 'notAAndB' | 'notAAndNotB';

const labels: Record<CellKey, string> = {
  aAndB: 'A and B',
  aAndNotB: 'A and not B',
  notAAndB: 'not A and B',
  notAAndNotB: 'not A and not B'
};

function countInput(value: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.floor(parsed) : 0;
}

const LAB_ID = 'probability.conditional';
const CONTENT_VERSION = '2';
type ConditionalDraft = { counts:Record<CellKey,number>; conditionOn:'B'|'A'; view:'table'|'tree' };

export default function ConditionalProbabilityLab() {
  const [counts, setCounts] = useState<Record<CellKey, number>>({
    aAndB: 24,
    aAndNotB: 16,
    notAAndB: 12,
    notAAndNotB: 48
  });
  const [conditionOn, setConditionOn] = useState<'B' | 'A'>('B');
  const [view, setView] = useState<'table' | 'tree'>('table');
  const [prediction, setPrediction] = useState<'independent' | 'dependent'>();
  const [revealed, setRevealed] = useState(false);
  const [restored, setRestored] = useState(false);

  const analysis = useMemo(() => {
    try {
      return {
        value: analyzeTwoWayTable(makeTwoWayTable(counts)),
        error: undefined
      };
    } catch (error) {
      return { value: undefined, error: error instanceof Error ? error.message : 'The contingency table is inconsistent.' };
    }
  }, [counts]);

  const activeDenominator = analysis.value
    ? conditionOn === 'B' ? analysis.value.countB : analysis.value.countA
    : 0n;
  const activeIntersection = analysis.value?.intersection ?? 0n;
  const activeConditional = analysis.value
    ? conditionOn === 'B' ? analysis.value.pAGivenB : analysis.value.pBGivenA
    : null;

  const predictionCorrect = analysis.value
    ? (prediction === 'independent') === analysis.value.independent
    : false;

  async function checkPrediction() {
    if (!prediction || !analysis.value) return;
    setRevealed(true);
    await Promise.all([
      recordAttempt({ prefix:'independence', exerciseId:'probability.independence.twoway', module:'probability', finalState:predictionCorrect?'correct':'incomplete', payload:{ counts,prediction,independent:analysis.value.independent } }),
      recordSkillEvidence('probability.independence', predictionCorrect ? 1 : 0),
      recordSkillEvidence('probability.conditional', activeConditional ? 1 : 0.5)
    ]).catch(() => undefined);
  }

  function setCell(key: CellKey, value: string) {
    setCounts((current) => ({ ...current, [key]: countInput(value) }));
    setRevealed(false);
  }

  useEffect(() => {
    loadDraft<ConditionalDraft>(LAB_ID, CONTENT_VERSION).then((draft) => {
      if (draft) { setCounts(draft.counts); setConditionOn(draft.conditionOn); setView(draft.view); }
      setRestored(true);
    });
  }, []);

  useEffect(() => {
    if (!restored) return;
    const timer = window.setTimeout(() => void saveDraft(LAB_ID, CONTENT_VERSION, { counts, conditionOn, view }), 300);
    return () => window.clearTimeout(timer);
  }, [restored,counts,conditionOn,view]);

  return (
    <section className="probability-lab" data-testid="conditional-probability-lab">
      <div className="probability-lab__controls">
        <p className="section-label">Canonical two-way table</p>
        <h2>Conditioning changes the active universe.</h2>
        <p>
          Edit the four disjoint regions. The table, tree, fractions, and independence test all read the same exact
          event model.
        </p>

        <div className="event-cell-grid">
          {(Object.keys(counts) as CellKey[]).map((key) => (
            <label className="form-field" key={key}>
              <span className="form-field__label">{labels[key]}</span>
              <input
                className="text-input"
                type="number"
                min="0"
                value={counts[key]}
                onChange={(event) => setCell(key, event.target.value)}
              />
            </label>
          ))}
        </div>

        {analysis.error && <Feedback tone="error" role="alert">{analysis.error}</Feedback>}

        <fieldset className="prediction-fieldset">
          <legend>Restrict the sample space</legend>
          <label>
            <input type="radio" name="conditioning-event" checked={conditionOn === 'B'} onChange={() => setConditionOn('B')} />
            Compute P(A | B)
          </label>
          <label>
            <input type="radio" name="conditioning-event" checked={conditionOn === 'A'} onChange={() => setConditionOn('A')} />
            Compute P(B | A)
          </label>
        </fieldset>

        <div className="view-switch" role="group" aria-label="Probability representation">
          <Button variant={view === 'table' ? 'primary' : 'secondary'} type="button" onClick={() => setView('table')}>Table</Button>
          <Button variant={view === 'tree' ? 'primary' : 'secondary'} type="button" onClick={() => setView('tree')}>Tree</Button>
        </div>
      </div>

      <div className="probability-lab__visual">
        {analysis.value && (
          <>
            <div className="conditioning-banner" aria-live="polite">
              <span>Active denominator</span>
              <strong>{conditionOn} contains {activeDenominator.toString()} of {analysis.value.total.toString()} observations.</strong>
              <small>Everything outside {conditionOn} is ignored while evaluating the conditional probability.</small>
            </div>

            {view === 'table' ? (
              <div className="two-way-wrap">
                <table className="two-way-table">
                  <caption>Counts for events A and B. The conditioning column/row is highlighted.</caption>
                  <thead><tr><th></th><th data-active={conditionOn === 'B'}>B</th><th>not B</th><th>Total</th></tr></thead>
                  <tbody>
                    <tr data-active={conditionOn === 'A'}>
                      <th>A</th>
                      <td data-intersection="true">{counts.aAndB}</td>
                      <td>{counts.aAndNotB}</td>
                      <td>{analysis.value.countA.toString()}</td>
                    </tr>
                    <tr><th>not A</th><td>{counts.notAAndB}</td><td>{counts.notAAndNotB}</td><td>{(BigInt(counts.notAAndB)+BigInt(counts.notAAndNotB)).toString()}</td></tr>
                    <tr><th>Total</th><td>{analysis.value.countB.toString()}</td><td>{(BigInt(counts.aAndNotB)+BigInt(counts.notAAndNotB)).toString()}</td><td>{analysis.value.total.toString()}</td></tr>
                  </tbody>
                </table>
              </div>
            ) : (
              <figure className="probability-tree">
                <svg viewBox="0 0 720 330" role="img" aria-labelledby="tree-title tree-desc">
                  <title id="tree-title">Probability tree for events A and B</title>
                  <desc id="tree-desc">A text equivalent follows the diagram. Branches use the same counts as the two-way table.</desc>
                  <line x1="70" y1="165" x2="250" y2="80" />
                  <line x1="70" y1="165" x2="250" y2="250" />
                  <line x1="250" y1="80" x2="520" y2="45" />
                  <line x1="250" y1="80" x2="520" y2="120" />
                  <line x1="250" y1="250" x2="520" y2="210" />
                  <line x1="250" y1="250" x2="520" y2="285" />
                  <text x="30" y="170">Start</text>
                  <text x="255" y="75">A ({analysis.value.countA.toString()})</text>
                  <text x="255" y="265">not A ({(analysis.value.total-analysis.value.countA).toString()})</text>
                  <text x="530" y="50">B: {counts.aAndB}</text>
                  <text x="530" y="125">not B: {counts.aAndNotB}</text>
                  <text x="530" y="215">B: {counts.notAAndB}</text>
                  <text x="530" y="290">not B: {counts.notAAndNotB}</text>
                </svg>
                <figcaption>
                  From A, the B branch contains {counts.aAndB} and the not-B branch contains {counts.aAndNotB}.
                  From not A, the B branch contains {counts.notAAndB} and the not-B branch contains {counts.notAAndNotB}.
                </figcaption>
              </figure>
            )}

            <div className="formula-stack" aria-label="Conditional probability calculations">
              <div className="formula-callout" data-active={conditionOn === 'B'}>
                <span>P(A | B)</span>
                <strong>{analysis.value.pAGivenB ? `${analysis.value.intersection}/${analysis.value.countB} = ${analysis.value.pAGivenB.toString()}` : 'undefined'}</strong>
                <small>{analysis.value.pAGivenB ? `≈ ${analysis.value.pAGivenB.toDecimal(4)}` : 'B has probability 0.'}</small>
              </div>
              <div className="formula-callout" data-active={conditionOn === 'A'}>
                <span>P(B | A)</span>
                <strong>{analysis.value.pBGivenA ? `${analysis.value.intersection}/${analysis.value.countA} = ${analysis.value.pBGivenA.toString()}` : 'undefined'}</strong>
                <small>{analysis.value.pBGivenA ? `≈ ${analysis.value.pBGivenA.toDecimal(4)}` : 'A has probability 0.'}</small>
              </div>
            </div>

            <p className="sample-space-explanation">
              For {conditionOn === 'B' ? 'P(A|B)' : 'P(B|A)'}, the numerator is the intersection count {activeIntersection.toString()}.
              The denominator is the size of the conditioning event, {activeDenominator.toString()}, not the full sample size.
              {activeConditional ? ` The exact result is ${activeConditional.toString()}.` : ''}
            </p>
          </>
        )}
      </div>

      <aside className="probability-lab__practice">
        <p className="section-label">Independence check</p>
        <p>
          Predict whether A and B are independent. The exact engine checks whether P(A∩B) = P(A)P(B), so decimal
          rounding cannot create a false match.
        </p>
        <fieldset className="prediction-fieldset">
          <legend>Your prediction</legend>
          <label><input type="radio" name="independence" checked={prediction === 'independent'} onChange={() => { setPrediction('independent'); setRevealed(false); }} /> Independent</label>
          <label><input type="radio" name="independence" checked={prediction === 'dependent'} onChange={() => { setPrediction('dependent'); setRevealed(false); }} /> Dependent</label>
        </fieldset>
        <Button variant="primary" type="button" disabled={!prediction || !analysis.value} onClick={checkPrediction}>Check independence</Button>
        {revealed && analysis.value && (
          <Feedback tone={predictionCorrect ? 'success' : 'error'} role={predictionCorrect ? 'status' : 'alert'}>
            <strong>{analysis.value.independent ? 'Independent.' : 'Dependent.'}</strong>{' '}
            P(A∩B) = {analysis.value.pIntersection.toString()}, while P(A)P(B) = {analysis.value.pA.multiply(analysis.value.pB).toString()}.
          </Feedback>
        )}
      </aside>
    </section>
  );
}
