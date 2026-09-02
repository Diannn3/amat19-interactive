import { useMemo, useState } from 'react';
import { bondPrice, roundFinance } from '@amat19/domain-finance';
import { Button } from '../../ui/Button';
import StepTrace from '../../math/StepTrace';
import { Feedback } from '../../ui/Feedback';
import { recordAttempt, recordSkillEvidence } from '../../../lib/local-progress';
const money = (value: number) => new Intl.NumberFormat('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 4 }).format(value);

export default function BondLab() {
  const [face, setFace] = useState(100000), [couponRate, setCouponRate] = useState(.04), [redemption, setRedemption] = useState(100000), [yieldRate, setYieldRate] = useState(.05), [periods, setPeriods] = useState(10);
  const [prediction, setPrediction] = useState<'premium' | 'discount' | 'par'>(), [checked, setChecked] = useState(false);
  const result = useMemo(() => { try { return { value: bondPrice({ faceValue: face, couponRatePerPeriod: couponRate, redemptionValue: redemption, yieldPerPeriod: yieldRate, periods }), error: undefined }; } catch (error) { return { value: undefined, error: error instanceof Error ? error.message : 'Bond could not be priced.' }; } }, [face, couponRate, redemption, yieldRate, periods]);
  async function check() { if (!prediction || !result.value) return; const ok = prediction === result.value.classification; setChecked(true); await Promise.all([recordAttempt({ prefix: 'bond', exerciseId: 'finance.bonds.classification', module: 'finance', finalState: ok ? 'correct' : 'incomplete', payload: { prediction, classification: result.value.classification } }), recordSkillEvidence('finance.bonds', ok ? 1 : 0)]).catch(() => undefined); }

  return <section className="finance-instrument finance-bond-instrument" data-testid="bond-lab">
    <div className="finance-instrument__modebar finance-instrument__scope"><span>Supplemental</span><span>Rates are per coupon-payment period</span></div>
    <aside className="finance-instrument__controls" aria-label="Bond pricing controls"><div><h2>Price the coupon stream and redemption at one purchase date.</h2><p className="section-label">Bond inputs</p><p className="instrument-note">Coupon and redemption cash flows stay visually separate until both are discounted to time 0.</p></div>
      <div className="number-pair"><label className="form-field"><span className="form-field__label">Face value F</span><input className="text-input" type="number" min="0" value={face} onChange={(event) => setFace(Number(event.target.value))} /></label><label className="form-field"><span className="form-field__label">Redemption C</span><input className="text-input" type="number" min="0" value={redemption} onChange={(event) => setRedemption(Number(event.target.value))} /></label></div>
      <div className="number-pair"><label className="form-field"><span className="form-field__label">Coupon rate r</span><input className="text-input" type="number" step="0.001" value={couponRate} onChange={(event) => setCouponRate(Number(event.target.value))} /></label><label className="form-field"><span className="form-field__label">Yield j</span><input className="text-input" type="number" step="0.001" value={yieldRate} onChange={(event) => setYieldRate(Number(event.target.value))} /></label></div>
      <label className="form-field"><span className="form-field__label">Coupon periods n</span><input className="text-input" type="number" min="1" step="1" value={periods} onChange={(event) => setPeriods(Number(event.target.value))} /></label>
      <fieldset className="prediction-fieldset"><legend>Predict price versus redemption value</legend>{(['premium', 'discount', 'par'] as const).map((item) => <label key={item}><input type="radio" name="bond-price-class" checked={prediction === item} onChange={() => { setPrediction(item); setChecked(false); }} /> {item}</label>)}<Button type="button" disabled={!prediction || !result.value} onClick={() => void check()}>Check prediction</Button>{checked && result.value && <Feedback tone={prediction === result.value.classification ? 'success' : 'error'}>{prediction === result.value.classification ? 'Correct.' : `The computed price is a ${result.value.classification}.`}</Feedback>}</fieldset>
    </aside>

    <div className="finance-instrument__canvas" aria-label="Bond cash-flow timeline"><div className="finance-instrument__canvas-head"><span>Coupon stream</span><strong>Purchase date → maturity</strong></div><BondTimeline periods={periods} coupon={result.value?.couponPayment ?? 0} redemption={redemption} />
      {result.error ? <Feedback tone="error">{result.error}</Feedback> : result.value && <><div className="finance-result-strip"><span>Bond price P</span><strong>PHP {money(roundFinance(result.value.value, 4))}</strong><small>{result.value.classification} relative to redemption value PHP {money(redemption)}</small></div><div className="finance-equivalence-line"><span>Price decomposition</span><strong>coupon PV {money(result.value.couponPresentValue)} + redemption PV {money(result.value.redemptionPresentValue)}</strong></div></>}
    </div>
    <aside className="finance-instrument__inspector" aria-label="Bond price trace"><p className="section-label">Price trace</p>{result.value && <StepTrace steps={result.value.trace} initialCount={4} />}</aside>
  </section>;
}

function BondTimeline({ periods, coupon, redemption }: { periods: number; coupon: number; redemption: number }) {
  const visible = Math.max(2, Math.min(periods, 10));
  return <figure className="finance-timeline finance-timeline--hero"><svg viewBox="0 0 700 250" role="img" aria-label="Bond coupon and redemption cash-flow timeline"><line className="finance-axis" x1="55" y1="125" x2="645" y2="125" /><line className="finance-focal" x1="65" y1="32" x2="65" y2="192" />
    {Array.from({ length: visible + 1 }, (_, index) => { const x = 65 + 570 * index / visible; const isEnd = index === visible; return <g key={index}><line className="finance-tick" x1={x} y1="115" x2={x} y2="135" /><text x={x} y="160" textAnchor="middle">{index === 0 ? 0 : index === visible ? periods : periods > 10 ? '…' : index}</text>{index > 0 && <><line className="finance-payment" x1={x} y1="110" x2={x} y2="72" /><path className="finance-arrow" d={`M ${x - 5} 79 L ${x} 70 L ${x + 5} 79`} /><text x={x} y="52" textAnchor="middle">{isEnd ? 'Fr + C' : 'Fr'}</text></>}</g>; })}
    <text x="70" y="215">purchase P</text><text x="635" y="215" textAnchor="end">maturity · coupon {Number(coupon.toFixed(2))} + C {Number(redemption.toFixed(2))}</text>
  </svg><figcaption>Every coupon and the maturity redemption are discounted to the purchase date before they are added.</figcaption></figure>;
}
