import { useEffect, useMemo, useRef, useState } from 'react';
import { annuityPaymentForValue, annuityValue, type AnnuityTiming, type ValueDirection } from '@amat19/domain-finance';
import { Button } from '../../ui/Button';
import StepTrace from '../../math/StepTrace';
import { Feedback } from '../../ui/Feedback';
import { loadDraft, saveDraft } from '../../../lib/draft';
import { recordAttempt, recordSkillEvidence } from '../../../lib/local-progress';
import { usePersistenceFlush } from '../../../lib/use-persistence-flush';

const LAB_ID = 'finance.annuity', CONTENT_VERSION = '1';
type Draft = { payment: number; rate: number; n: number; timing: AnnuityTiming; direction: ValueDirection; solveFor: 'value' | 'payment'; target: number };
const money = (value: number) => new Intl.NumberFormat('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 4 }).format(value);

export default function AnnuityLab() {
  const [payment, setPayment] = useState(1500), [rate, setRate] = useState(.01), [n, setN] = useState(12);
  const [timing, setTiming] = useState<AnnuityTiming>('immediate'), [direction, setDirection] = useState<ValueDirection>('present');
  const [solveFor, setSolveFor] = useState<'value' | 'payment'>('value'), [target, setTarget] = useState(20000);
  const [prediction, setPrediction] = useState<AnnuityTiming>(), [checked, setChecked] = useState(false), [restored, setRestored] = useState(false);
  const userInteracted = useRef(false);

  useEffect(() => { loadDraft<Draft>(LAB_ID, CONTENT_VERSION).then((draft) => { if (!userInteracted.current && draft) { setPayment(draft.payment); setRate(draft.rate); setN(draft.n); setTiming(draft.timing); setDirection(draft.direction); setSolveFor(draft.solveFor); setTarget(draft.target); } setRestored(true); }); }, []);
  useEffect(() => { if (!restored) return; const timer = setTimeout(() => void saveDraft(LAB_ID, CONTENT_VERSION, { payment, rate, n, timing, direction, solveFor, target }), 250); return () => clearTimeout(timer); }, [restored, payment, rate, n, timing, direction, solveFor, target]);
  usePersistenceFlush(() => saveDraft(LAB_ID, CONTENT_VERSION, { payment, rate, n, timing, direction, solveFor, target }), restored);

  const result = useMemo(() => { try { return { value: solveFor === 'value' ? annuityValue(payment, rate, n, timing, direction) : annuityPaymentForValue(target, rate, n, timing, direction), error: undefined }; } catch (error) { return { value: undefined, error: error instanceof Error ? error.message : 'Could not value the annuity.' }; } }, [payment, rate, n, timing, direction, solveFor, target]);

  async function checkTiming() { if (!prediction) return; const ok = prediction === timing; setChecked(true); await Promise.all([recordAttempt({ prefix: 'annuity', exerciseId: 'finance.annuity.timing', module: 'finance', finalState: ok ? 'correct' : 'incomplete', payload: { timing, prediction } }), recordSkillEvidence('finance.annuity', ok ? 1 : 0)]).catch(() => undefined); }

  return <section className="finance-instrument finance-annuity-instrument" data-testid="annuity-lab" data-hydrated={restored ? 'true' : undefined}
    onPointerDown={() => { userInteracted.current = true; }} onKeyDown={(event) => { if (event.target instanceof HTMLElement && event.target.closest('button,input,select,textarea')) userInteracted.current = true; }}>
    <div className="finance-instrument__modebar" aria-label="Annuity model">
      <div className="view-switch"><Button variant={timing === 'immediate' ? 'primary' : 'secondary'} onClick={() => { setTiming('immediate'); setChecked(false); }}>Immediate</Button><Button variant={timing === 'due' ? 'primary' : 'secondary'} onClick={() => { setTiming('due'); setChecked(false); }}>Due</Button></div>
      <div className="view-switch"><Button variant={direction === 'present' ? 'primary' : 'secondary'} onClick={() => setDirection('present')}>Present value</Button><Button variant={direction === 'future' ? 'primary' : 'secondary'} onClick={() => setDirection('future')}>Future value</Button></div>
      <div className="view-switch"><Button variant={solveFor === 'value' ? 'primary' : 'secondary'} onClick={() => setSolveFor('value')}>Solve value</Button><Button variant={solveFor === 'payment' ? 'primary' : 'secondary'} onClick={() => setSolveFor('payment')}>Solve payment</Button></div>
    </div>

    <aside className="finance-instrument__controls" aria-label="Annuity controls">
      <div><h2>Place the payments before choosing the factor.</h2><p className="section-label">Payment model</p><p className="instrument-note">Immediate and due annuities differ by one payment-period shift. The timeline makes that shift explicit.</p></div>
      <div className="number-pair"><label className="form-field"><span className="form-field__label">Rate per period i</span><input className="text-input" type="number" step="0.001" value={rate} onChange={(event) => setRate(Number(event.target.value))} /></label><label className="form-field"><span className="form-field__label">Payments n</span><input className="text-input" type="number" min="0" step="1" value={n} onChange={(event) => setN(Number(event.target.value))} /></label></div>
      {solveFor === 'value' ? <label className="form-field"><span className="form-field__label">Level payment R</span><input className="text-input" type="number" value={payment} onChange={(event) => setPayment(Number(event.target.value))} /></label> : <label className="form-field"><span className="form-field__label">Target {direction} value</span><input className="text-input" type="number" value={target} onChange={(event) => setTarget(Number(event.target.value))} /></label>}
      <fieldset className="prediction-fieldset"><legend>Predict payment timing</legend><label><input type="radio" name="annuity-timing" checked={prediction === 'immediate'} onChange={() => { setPrediction('immediate'); setChecked(false); }} /> First payment one period after valuation</label><label><input type="radio" name="annuity-timing" checked={prediction === 'due'} onChange={() => { setPrediction('due'); setChecked(false); }} /> First payment at period start</label><Button disabled={!prediction} onClick={checkTiming}>Check timing</Button>{checked && <Feedback tone={prediction === timing ? 'success' : 'error'}>{prediction === timing ? 'Correct.' : 'Inspect where the first payment sits on the timeline.'}</Feedback>}</fieldset>
    </aside>

    <div className="finance-instrument__canvas" aria-label="Annuity payment timeline">
      <div className="finance-instrument__canvas-head"><span>{timing === 'due' ? 'Annuity due' : 'Annuity immediate'}</span><strong>{direction === 'present' ? 'Value at t = 0' : `Value at t = ${n}`}</strong></div>
      <AnnuityTimeline n={n} timing={timing} direction={direction} payment={payment} />
      {result.error ? <Feedback tone="error">{result.error}</Feedback> : <div className="finance-result-strip" aria-live="polite"><span>{solveFor === 'value' ? `${direction === 'present' ? 'Present' : 'Future'} value` : 'Required level payment'}</span><strong>PHP {money(result.value!.value)}</strong><small>{timing === 'due' ? 'Payment stream begins at the valuation edge.' : 'Payment stream begins one period after the valuation edge.'}</small></div>}
    </div>

    <aside className="finance-instrument__inspector" aria-label="Annuity solution trace"><p className="section-label">Solution trace</p>{result.value && <StepTrace steps={result.value.trace} initialCount={4} />}</aside>
  </section>;
}

function AnnuityTimeline({ n, timing, direction, payment }: { n: number; timing: AnnuityTiming; direction: ValueDirection; payment: number }) {
  const count = Math.max(1, Math.min(n, 10));
  const focalAtStart = direction === 'present';
  return <figure className="finance-timeline finance-timeline--hero"><svg viewBox="0 0 700 240" role="img" aria-label={`${timing} annuity payment timeline`}>
    <line className="finance-axis" x1="55" y1="120" x2="645" y2="120" />
    {Array.from({ length: count + 1 }, (_, index) => { const x = 65 + 570 * index / count; const hasPayment = timing === 'due' ? index < count : index > 0; return <g key={index}><line className="finance-tick" x1={x} y1="110" x2={x} y2="130" /><text x={x} y="155" textAnchor="middle">{index}</text>{hasPayment && <><line className="finance-payment" x1={x} y1="105" x2={x} y2="67" /><path className="finance-arrow" d={`M ${x - 5} 74 L ${x} 65 L ${x + 5} 74`} /><text x={x} y="48" textAnchor="middle">R</text></>}</g>; })}
    <line className="finance-focal" x1={focalAtStart ? 65 : 635} y1="28" x2={focalAtStart ? 65 : 635} y2="190" />
    <text x={focalAtStart ? 74 : 626} y="210" textAnchor={focalAtStart ? 'start' : 'end'}>focal date</text>
    <text x="350" y="225" textAnchor="middle">R = PHP {money(payment)}{n > 10 ? ' · middle periods compressed' : ''}</text>
  </svg><figcaption>{timing === 'due' ? 'Payments occur at the beginning of each period; each marker occupies the left edge.' : 'Payments occur at the end of each period; each marker occupies the right edge.'}</figcaption></figure>;
}
