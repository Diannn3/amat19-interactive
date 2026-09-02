import { useEffect, useMemo, useState } from 'react';
import { analyzeTwoWayTable, makeTwoWayTable } from '@amat19/domain-probability';
import { Rational } from '@amat19/math-core';
import { Button } from '../../ui/Button';
import { Feedback } from '../../ui/Feedback';
import { recordAttempt, recordSkillEvidence } from '../../../lib/local-progress';
import { loadDraft, saveDraft } from '../../../lib/draft';
import { usePersistenceFlush } from '../../../lib/use-persistence-flush';

type CellKey = 'aAndB' | 'aAndNotB' | 'notAAndB' | 'notAAndNotB';
type FormatMode = 'counts' | 'fractions' | 'percentages';
type ConditionalDraft = { counts: Record<CellKey, number>; conditionOn: 'B' | 'A'; view: 'partition' | 'table' | 'tree'; formatMode?: FormatMode };
const LAB_ID = 'probability.conditional';
const CONTENT_VERSION = '4';
const labels: Record<CellKey, string> = { aAndB: 'A ∩ B', aAndNotB: 'A ∩ Bᶜ', notAAndB: 'Aᶜ ∩ B', notAAndNotB: 'Aᶜ ∩ Bᶜ' };
const countInput = (value: string) => { const parsed = Number(value); return Number.isFinite(parsed) && parsed >= 0 ? Math.floor(parsed) : 0; };
function formatRegion(value: number | bigint, total: bigint, mode: FormatMode) { const n = BigInt(value); if (mode === 'counts') return n.toString(); const rational = new Rational(n, total); return mode === 'fractions' ? rational.toString() : `${(rational.toNumber() * 100).toFixed(1)}%`; }

export default function ConditionalProbabilityLab() {
  const [counts, setCounts] = useState<Record<CellKey, number>>({ aAndB: 24, aAndNotB: 16, notAAndB: 12, notAAndNotB: 48 });
  const [conditionOn, setConditionOn] = useState<'B' | 'A'>('B');
  const [view, setView] = useState<'partition' | 'table' | 'tree'>('partition');
  const [formatMode, setFormatMode] = useState<FormatMode>('counts');
  const [prediction, setPrediction] = useState<'independent' | 'dependent'>();
  const [revealed, setRevealed] = useState(false), [restored, setRestored] = useState(false);

  const analysis = useMemo(() => { try { return { value: analyzeTwoWayTable(makeTwoWayTable(counts)), error: undefined }; } catch (error) { return { value: undefined, error: error instanceof Error ? error.message : 'The contingency table is inconsistent.' }; } }, [counts]);
  const activeDenominator = analysis.value ? conditionOn === 'B' ? analysis.value.countB : analysis.value.countA : 0n;
  const activeIntersection = analysis.value?.intersection ?? 0n;
  const activeConditional = analysis.value ? conditionOn === 'B' ? analysis.value.pAGivenB : analysis.value.pBGivenA : null;
  const predictionCorrect = analysis.value ? (prediction === 'independent') === analysis.value.independent : false;

  async function checkPrediction() {
    if (!prediction || !analysis.value) return;
    setRevealed(true);
    await Promise.all([
      recordAttempt({ prefix: 'independence', exerciseId: 'probability.independence.twoway', module: 'probability', finalState: predictionCorrect ? 'correct' : 'incomplete', payload: { counts, prediction, independent: analysis.value.independent } }),
      recordSkillEvidence('probability.independence.test', predictionCorrect ? 1 : 0, { independent: predictionCorrect }),
      recordSkillEvidence('probability.conditional.denominator', activeConditional ? 1 : .5, { independent: Boolean(activeConditional) })
    ]).catch(() => undefined);
  }

  function setCell(key: CellKey, value: string) { setCounts((current) => ({ ...current, [key]: countInput(value) })); setRevealed(false); }
  useEffect(() => { loadDraft<ConditionalDraft>(LAB_ID, CONTENT_VERSION).then((draft) => { if (draft) { setCounts(draft.counts); setConditionOn(draft.conditionOn); setView(draft.view ?? 'partition'); if (draft.formatMode) setFormatMode(draft.formatMode); } setRestored(true); }); }, []);
  useEffect(() => { if (!restored) return; const timer = window.setTimeout(() => void saveDraft(LAB_ID, CONTENT_VERSION, { counts, conditionOn, view, formatMode }), 300); return () => window.clearTimeout(timer); }, [restored, counts, conditionOn, view, formatMode]);
  usePersistenceFlush(() => saveDraft(LAB_ID, CONTENT_VERSION, { counts, conditionOn, view, formatMode }), restored);

  return <section className="conditional-instrument" data-testid="conditional-probability-lab" data-hydrated={restored ? 'true' : undefined}>
    <div className="conditional-instrument__toolbar">
      <div className="view-switch" role="group" aria-label="Conditioning event"><Button variant={conditionOn === 'B' ? 'primary' : 'secondary'} onClick={() => setConditionOn('B')}>P(A | B)</Button><Button variant={conditionOn === 'A' ? 'primary' : 'secondary'} onClick={() => setConditionOn('A')}>P(B | A)</Button></div>
      <div className="view-switch" role="group" aria-label="Probability representation">{(['partition', 'table', 'tree'] as const).map((item) => <Button key={item} variant={view === item ? 'primary' : 'secondary'} onClick={() => setView(item)}>{item[0]!.toUpperCase() + item.slice(1)}</Button>)}</div>
      <div className="view-switch" role="group" aria-label="Probability number format">{(['counts', 'fractions', 'percentages'] as FormatMode[]).map((mode) => <Button key={mode} variant={formatMode === mode ? 'primary' : 'secondary'} onClick={() => setFormatMode(mode)}>{mode[0]!.toUpperCase() + mode.slice(1)}</Button>)}</div>
    </div>

    <aside className="conditional-instrument__controls" aria-label="Population region counts"><div><h2>Conditioning changes the active universe.</h2><p className="section-label">Population model</p><p className="instrument-note">Edit the four disjoint regions. Every representation reads the same exact event model.</p></div><div className="event-cell-grid">{(Object.keys(counts) as CellKey[]).map((key) => <label className="form-field" key={key}><span className="form-field__label">{labels[key]}</span><input className="text-input" type="number" min="0" value={counts[key]} onChange={(event) => setCell(key, event.target.value)} /></label>)}</div>{analysis.error && <Feedback tone="error" role="alert">{analysis.error}</Feedback>}</aside>

    <div className="conditional-instrument__canvas">
      {analysis.value && <>
        <div className="conditioning-focus" aria-live="polite"><span>Active universe</span><strong>{conditionOn} · {activeDenominator.toString()} observations</strong><small>The complement is still visible for context, but it is excluded from the conditional denominator.</small></div>
        {view === 'partition' && <PopulationPartition counts={counts} conditionOn={conditionOn} total={analysis.value.total} />}
        {view === 'table' && <div className="two-way-wrap" role="region" aria-label="Conditional probability table" tabIndex={0}><table className="two-way-table conditional-table"><caption>Counts for events A and B. The active conditioning row or column uses the stronger line weight.</caption><thead><tr><th scope="col"><span className="sr-only">Event</span></th><th scope="col" data-active={conditionOn === 'B'}>B</th><th scope="col">Bᶜ</th><th scope="col">Total</th></tr></thead><tbody><tr data-active={conditionOn === 'A'}><th scope="row">A</th><td data-intersection="true">{formatRegion(counts.aAndB, analysis.value.total, formatMode)}</td><td>{formatRegion(counts.aAndNotB, analysis.value.total, formatMode)}</td><td>{formatRegion(analysis.value.countA, analysis.value.total, formatMode)}</td></tr><tr><th scope="row">Aᶜ</th><td>{formatRegion(counts.notAAndB, analysis.value.total, formatMode)}</td><td>{formatRegion(counts.notAAndNotB, analysis.value.total, formatMode)}</td><td>{formatRegion(BigInt(counts.notAAndB) + BigInt(counts.notAAndNotB), analysis.value.total, formatMode)}</td></tr><tr><th scope="row">Total</th><td>{formatRegion(analysis.value.countB, analysis.value.total, formatMode)}</td><td>{formatRegion(BigInt(counts.aAndNotB) + BigInt(counts.notAAndNotB), analysis.value.total, formatMode)}</td><td>{formatMode === 'counts' ? analysis.value.total.toString() : formatMode === 'fractions' ? '1' : '100%'}</td></tr></tbody></table></div>}
        {view === 'tree' && <ProbabilityTree counts={counts} countA={analysis.value.countA} total={analysis.value.total} />}
        <div className="conditional-equation"><span>{conditionOn === 'B' ? 'P(A | B)' : 'P(B | A)'}</span><strong>{activeConditional ? `${activeIntersection}/${activeDenominator} = ${activeConditional.toString()}` : 'undefined'}</strong><small>numerator = intersection · denominator = conditioning event</small></div>
      </>}
    </div>

    <aside className="conditional-instrument__inspector" aria-label="Independence inspector"><p className="section-label">Independence</p>{analysis.value && <div className="independence-equation"><span>P(A∩B)</span><strong>{analysis.value.pIntersection.toString()}</strong><span>P(A)P(B)</span><strong>{analysis.value.pA.multiply(analysis.value.pB).toString()}</strong></div>}<fieldset className="prediction-fieldset"><legend>Predict the relationship</legend><label><input type="radio" name="independence" checked={prediction === 'independent'} onChange={() => { setPrediction('independent'); setRevealed(false); }} /> Independent</label><label><input type="radio" name="independence" checked={prediction === 'dependent'} onChange={() => { setPrediction('dependent'); setRevealed(false); }} /> Dependent</label></fieldset><Button variant="primary" disabled={!prediction || !analysis.value} onClick={checkPrediction}>Check independence</Button>{revealed && analysis.value && <Feedback tone={predictionCorrect ? 'success' : 'error'} role={predictionCorrect ? 'status' : 'alert'}><strong>{analysis.value.independent ? 'Independent.' : 'Dependent.'}</strong> Exact arithmetic compares the two quantities without decimal-rounding ambiguity.</Feedback>}</aside>
  </section>;
}

function PopulationPartition({ counts, conditionOn, total }: { counts: Record<CellKey, number>; conditionOn: 'A' | 'B'; total: bigint }) {
  const cells = [{ key: 'aAndB' as const, a: true, b: true }, { key: 'aAndNotB' as const, a: true, b: false }, { key: 'notAAndB' as const, a: false, b: true }, { key: 'notAAndNotB' as const, a: false, b: false }];
  return <figure className="population-partition"><div className="population-partition__grid">{cells.map((cell) => { const active = conditionOn === 'A' ? cell.a : cell.b; const intersection = cell.a && cell.b; return <div key={cell.key} data-active={active} data-intersection={intersection}><span>{labels[cell.key]}</span><strong>{counts[cell.key]}</strong><small>{new Rational(BigInt(counts[cell.key]), total).toString()} of Ω</small></div>; })}</div><figcaption>Solid edge = active conditioning universe. Hatched corner = A ∩ B.</figcaption></figure>;
}
function ProbabilityTree({ counts, countA, total }: { counts: Record<CellKey, number>; countA: bigint; total: bigint }) { return <figure className="probability-tree"><svg viewBox="0 0 720 330" role="img" aria-labelledby="conditional-tree-title conditional-tree-desc"><title id="conditional-tree-title">Probability tree for events A and B</title><desc id="conditional-tree-desc">Branches use the same counts as the population partition.</desc><line x1="70" y1="165" x2="250" y2="80" /><line x1="70" y1="165" x2="250" y2="250" /><line x1="250" y1="80" x2="520" y2="45" /><line x1="250" y1="80" x2="520" y2="120" /><line x1="250" y1="250" x2="520" y2="210" /><line x1="250" y1="250" x2="520" y2="285" /><text x="30" y="170">Ω</text><text x="255" y="75">A ({countA.toString()})</text><text x="255" y="265">Aᶜ ({(total - countA).toString()})</text><text x="530" y="50">B: {counts.aAndB}</text><text x="530" y="125">Bᶜ: {counts.aAndNotB}</text><text x="530" y="215">B: {counts.notAAndB}</text><text x="530" y="290">Bᶜ: {counts.notAAndNotB}</text></svg><figcaption>The branch counts and the two-way table are synchronized views of one partition.</figcaption></figure>; }
