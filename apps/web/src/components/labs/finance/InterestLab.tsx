import { useEffect, useMemo, useState } from 'react';
import { compoundAccumulation, nominalAccumulation, nominalToEffective, simpleAccumulation, valueAtTime } from '@amat19/domain-finance';
import { Button } from '../../ui/Button';
import { Feedback } from '../../ui/Feedback';
import { loadDraft, saveDraft } from '../../../lib/draft';
import { recordAttempt, recordSkillEvidence } from '../../../lib/local-progress';
import { usePersistenceFlush } from '../../../lib/use-persistence-flush';
import StepTrace from '../../math/StepTrace';

type Mode = 'simple' | 'compound' | 'nominal' | 'tvm';
const LAB_ID = 'finance.interest';
const CONTENT_VERSION = '1';
type Draft = { mode: Mode; principal: number; rate: number; years: number; frequency: number; futureAmount: number; fromTime: number; toTime: number };
const money = (value: number) => new Intl.NumberFormat('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 4 }).format(value);
const pct = (value: number) => `${(value * 100).toFixed(4).replace(/0+$/, '').replace(/\.$/, '')}%`;

export default function InterestLab() {
  const [mode, setMode] = useState<Mode>('compound');
  const [principal, setPrincipal] = useState(10000);
  const [rate, setRate] = useState(.05);
  const [years, setYears] = useState(3);
  const [frequency, setFrequency] = useState(4);
  const [futureAmount, setFutureAmount] = useState(25000);
  const [fromTime, setFromTime] = useState(0);
  const [toTime, setToTime] = useState(6);
  const [restored, setRestored] = useState(false);
  const [prediction, setPrediction] = useState<'simple' | 'compound'>();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    loadDraft<Draft>(LAB_ID, CONTENT_VERSION).then((draft) => {
      if (draft) {
        setMode(draft.mode); setPrincipal(draft.principal); setRate(draft.rate); setYears(draft.years);
        setFrequency(draft.frequency); setFutureAmount(draft.futureAmount); setFromTime(draft.fromTime); setToTime(draft.toTime);
      }
      setRestored(true);
    });
  }, []);

  useEffect(() => {
    if (!restored) return;
    const timer = window.setTimeout(() => void saveDraft(LAB_ID, CONTENT_VERSION, { mode, principal, rate, years, frequency, futureAmount, fromTime, toTime }), 250);
    return () => window.clearTimeout(timer);
  }, [restored, mode, principal, rate, years, frequency, futureAmount, fromTime, toTime]);

  usePersistenceFlush(() => saveDraft(LAB_ID, CONTENT_VERSION, { mode, principal, rate, years, frequency, futureAmount, fromTime, toTime }), restored);

  const result = useMemo(() => {
    try {
      if (mode === 'simple') {
        const main = simpleAccumulation(principal, rate, years);
        return { main, label: 'Accumulated value', secondary: `Interest earned = ${money(main.value - principal)}` };
      }
      if (mode === 'compound') {
        const main = compoundAccumulation(principal, rate, years);
        return { main, label: 'Accumulated value', secondary: `Interest earned = ${money(main.value - principal)}` };
      }
      if (mode === 'nominal') {
        const main = nominalAccumulation(principal, rate, frequency, years);
        const effective = nominalToEffective(rate, frequency);
        return { main, label: 'Accumulated value', secondary: `Equivalent annual effective rate = ${pct(effective.value)}` };
      }
      const main = valueAtTime(futureAmount, toTime, fromTime, rate);
      return { main, label: `Equivalent value at t = ${fromTime}`, secondary: `Move PHP ${money(futureAmount)} from t=${toTime} to t=${fromTime}` };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'The financial model could not be evaluated.' };
    }
  }, [mode, principal, rate, years, frequency, futureAmount, fromTime, toTime]);

  const effective = useMemo(() => {
    try { return mode === 'nominal' ? nominalToEffective(rate, frequency).value : undefined; }
    catch { return undefined; }
  }, [mode, rate, frequency]);

  async function checkModel() {
    if (!prediction) return;
    const expected = mode === 'simple' ? 'simple' : 'compound';
    const ok = prediction === expected;
    setChecked(true);
    await Promise.all([
      recordAttempt({ prefix: 'finance', exerciseId: 'finance.interest.model', module: 'finance', finalState: ok ? 'correct' : 'incomplete', payload: { mode, prediction, expected } }),
      recordSkillEvidence(mode === 'simple' ? 'finance.simple-interest' : 'finance.compound-interest', ok ? 1 : 0, { independent: ok })
    ]).catch(() => undefined);
  }

  return (
    <section className="finance-instrument finance-interest-instrument" data-testid="interest-lab" data-hydrated={restored ? 'true' : undefined}>
      <div className="finance-instrument__modebar" role="tablist" aria-label="Interest model">
        {(['simple', 'compound', 'nominal', 'tvm'] as Mode[]).map((item) => (
          <Button key={item} variant={mode === item ? 'primary' : 'secondary'} role="tab" aria-selected={mode === item}
            onClick={() => { setMode(item); setChecked(false); }}>
            {item === 'tvm' ? 'Time value' : item[0]!.toUpperCase() + item.slice(1)}
          </Button>
        ))}
      </div>

      <aside className="finance-instrument__controls" aria-label="Interest model controls">
        <div>
          <h2>Move one value through time.</h2>
          <p className="section-label">Model controls</p>
          <p className="instrument-note">Choose the rule first. The timeline and exact trace update from the same deterministic finance engine.</p>
        </div>

        {mode !== 'tvm' ? (
          <>
            <label className="form-field"><span className="form-field__label">Principal P</span><input className="text-input" type="number" min="0" step="100" value={principal} onChange={(event) => setPrincipal(Number(event.target.value))} /></label>
            <div className="number-pair">
              <label className="form-field"><span className="form-field__label">Annual rate</span><input className="text-input" type="number" step="0.001" value={rate} onChange={(event) => setRate(Number(event.target.value))} /><span className="form-field__hint">0.05 = 5%</span></label>
              <label className="form-field"><span className="form-field__label">Years t</span><input className="text-input" type="number" min="0" step="0.25" value={years} onChange={(event) => setYears(Number(event.target.value))} /></label>
            </div>
            {mode === 'nominal' && <label className="form-field"><span className="form-field__label">Conversions per year m</span><input className="text-input" type="number" min="1" step="1" value={frequency} onChange={(event) => setFrequency(Number(event.target.value))} /></label>}
          </>
        ) : (
          <>
            <label className="form-field"><span className="form-field__label">Cash amount</span><input className="text-input" type="number" value={futureAmount} onChange={(event) => setFutureAmount(Number(event.target.value))} /></label>
            <div className="number-pair">
              <label className="form-field"><span className="form-field__label">From time</span><input className="text-input" type="number" value={toTime} onChange={(event) => setToTime(Number(event.target.value))} /></label>
              <label className="form-field"><span className="form-field__label">Focal time</span><input className="text-input" type="number" value={fromTime} onChange={(event) => setFromTime(Number(event.target.value))} /></label>
            </div>
            <label className="form-field"><span className="form-field__label">Effective rate per period</span><input className="text-input" type="number" step="0.001" value={rate} onChange={(event) => setRate(Number(event.target.value))} /></label>
          </>
        )}

        {(mode === 'simple' || mode === 'compound') && (
          <fieldset className="prediction-fieldset">
            <legend>Predict the active accumulation model</legend>
            <label><input type="radio" name="finance-model" checked={prediction === 'simple'} onChange={() => { setPrediction('simple'); setChecked(false); }} /> Simple interest</label>
            <label><input type="radio" name="finance-model" checked={prediction === 'compound'} onChange={() => { setPrediction('compound'); setChecked(false); }} /> Compound interest</label>
            <Button type="button" variant="secondary" disabled={!prediction} onClick={checkModel}>Check model</Button>
            {checked && <Feedback tone={prediction === mode ? 'success' : 'error'}>{prediction === mode ? 'Correct model.' : 'Check whether previously earned interest itself earns interest.'}</Feedback>}
          </fieldset>
        )}
      </aside>

      <div className="finance-instrument__canvas" aria-label="Synchronized financial timeline">
        <div className="finance-instrument__canvas-head">
          <span>{mode === 'tvm' ? 'Focal-date movement' : 'Accumulation timeline'}</span>
          <strong>{mode === 'simple' ? 'A = P(1 + rt)' : mode === 'compound' ? 'A = P(1 + i)^t' : mode === 'nominal' ? `j(${frequency})` : 'V(t₀) ↔ V(t₁)'}</strong>
        </div>
        <FinanceTimeline mode={mode} principal={principal} resultValue={result.main?.value} years={years} fromTime={fromTime} toTime={toTime} amount={futureAmount} />
        {result.error ? <Feedback tone="error" role="alert">{result.error}</Feedback> : (
          <div className="finance-result-strip" aria-live="polite">
            <span>{result.label}</span>
            <strong>PHP {money(result.main!.value)}</strong>
            <small>{result.secondary}</small>
            <small>Exact: {result.main!.exactValue.slice(0, 28)}</small>
          </div>
        )}
        {mode === 'nominal' && effective !== undefined && (
          <div className="finance-equivalence-line"><span>Rate equivalence</span><strong>j({frequency}) = {pct(rate)} ↔ i = {pct(effective)}</strong></div>
        )}
      </div>

      <aside className="finance-instrument__inspector" aria-label="Exact solution trace">
        <p className="section-label">Exact trace</p>
        <p className="instrument-note">Each line exposes the transformation used by the engine.</p>
        {result.main && <StepTrace steps={result.main.trace} initialCount={4} />}
      </aside>
    </section>
  );
}

function FinanceTimeline({ mode, principal, resultValue, years, fromTime, toTime, amount }: { mode: Mode; principal: number; resultValue?: number; years: number; fromTime: number; toTime: number; amount: number }) {
  const start = mode === 'tvm' ? Math.min(fromTime, toTime) : 0;
  const end = mode === 'tvm' ? Math.max(fromTime, toTime) : years || 1;
  const span = Math.max(1, end - start);
  const x = (time: number) => 70 + 560 * (time - start) / span;
  const tickCount = Math.min(8, Math.max(1, Math.ceil(span)));
  return (
    <figure className="finance-timeline finance-timeline--hero">
      <svg viewBox="0 0 700 230" role="img" aria-label="Financial timeline">
        <line className="finance-axis" x1="65" y1="115" x2="635" y2="115" />
        {Array.from({ length: tickCount + 1 }, (_, index) => {
          const time = start + span * index / tickCount;
          return <g key={index}><line className="finance-tick" x1={x(time)} y1="105" x2={x(time)} y2="125" /><text x={x(time)} y="150" textAnchor="middle">t={Number(time.toFixed(2))}</text></g>;
        })}
        {mode === 'tvm' ? (
          <>
            <line className="finance-move-line" x1={x(toTime)} y1="78" x2={x(fromTime)} y2="78" />
            <circle className="finance-point" cx={x(toTime)} cy="115" r="8" /><text x={x(toTime)} y="58" textAnchor="middle">PHP {money(amount)}</text>
            <line className="finance-focal" x1={x(fromTime)} y1="34" x2={x(fromTime)} y2="184" />
            <circle className="finance-point finance-point--filled" cx={x(fromTime)} cy="115" r="8" /><text x={x(fromTime)} y="198" textAnchor="middle">PHP {resultValue === undefined ? '—' : money(resultValue)}</text>
          </>
        ) : (
          <>
            <circle className="finance-point finance-point--filled" cx={x(0)} cy="115" r="8" /><text x={x(0)} y="70" textAnchor="middle">P = {money(principal)}</text>
            <line className="finance-growth-line" x1={x(0)} y1="84" x2={x(years)} y2="84" />
            <circle className="finance-point" cx={x(years)} cy="115" r="8" /><text x={x(years)} y="198" textAnchor="middle">A = {resultValue === undefined ? '—' : money(resultValue)}</text>
          </>
        )}
      </svg>
      <figcaption>Money is comparable only at the same focal date. The line is the model; the number is its consequence.</figcaption>
    </figure>
  );
}
