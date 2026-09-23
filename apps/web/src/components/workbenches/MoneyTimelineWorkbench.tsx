import { useEffect, useMemo, useRef, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import {
  FinanceDecimal,
  annuityValue,
  bondPrice,
  valueCashflowsAt,
  type AnnuityTiming,
  type FinanceResult,
  type ValueDirection,
} from '@amat19/domain-finance';
import { Button } from '../ui/Button';
import { Feedback } from '../ui/Feedback';
import Timeline, { type TimelinePoint } from '../math/Timeline';
import StepTrace from '../math/StepTrace';
import { financeCertaintyLabel } from '../../lib/finance-display';
import { loadDraft, saveDraft } from '../../lib/draft';
import { usePersistenceFlush } from '../../lib/use-persistence-flush';
import { readWorkbenchOption } from '../../lib/workbench-route';
import type { MoneyStep } from '../../lib/money-step-feedback';
import MoneyStepCoach from './MoneyStepCoach';
import WorkbenchTaskPicker, { type WorkbenchTaskOption } from './WorkbenchTaskPicker';

type Scenario = 'cashflows' | 'annuity' | 'bond';
type Flow = { id: number; time: string; amount: string };
type Draft = {
  scenario: Scenario;
  flows: Flow[];
  cashflowRate: string;
  focalDate: string;
  annuityPayment: string;
  annuityRate: string;
  annuityPeriods: string;
  annuityTiming: AnnuityTiming;
  annuityDirection: ValueDirection;
  bondFace: string;
  bondCouponRate: string;
  bondRedemption: string;
  bondYield: string;
  bondPeriods: string;
};
type Computed = {
  result?: FinanceResult;
  step?: MoneyStep & { label: string };
  error?: string;
  resultLabel: string;
  resultDetail?: string;
  points: TimelinePoint[];
  minTime: number;
  maxTime: number;
};

const LAB_ID = 'finance.money-timeline';
const CONTENT_VERSION = '1';
const SCENARIOS: readonly Scenario[] = ['cashflows', 'annuity', 'bond'];
const TASK_OPTIONS: readonly WorkbenchTaskOption[] = [
  { value: 'cashflows', label: 'Move cash flows', group: 'Start here' },
  { value: 'annuity', label: 'Value an annuity', group: 'Common models' },
  { value: 'bond', label: 'Price a bond', group: 'Common models' },
];
const DEFAULT_FLOWS: Flow[] = [
  { id: 1, time: '0', amount: '-2000' },
  { id: 2, time: '3', amount: '2500' },
];
const currency = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function positiveInteger(raw: string, label: string) {
  if (!/^\d+$/.test(raw.trim())) throw new RangeError(`${label} must be a positive integer.`);
  const value = Number(raw);
  if (!Number.isSafeInteger(value) || value <= 0) throw new RangeError(`${label} must be a positive integer.`);
  return value;
}

function decimalNumber(raw: string) {
  return FinanceDecimal.from(raw).toNumber();
}

function sampledTimes(start: number, end: number) {
  if (end < start) return [];
  if (end - start < 6) return Array.from({ length: end - start + 1 }, (_, index) => start + index);
  return [...new Set([start, start + 1, Math.round((start + end) / 2), end - 1, end])];
}

function bounds(points: TimelinePoint[]) {
  const times = points.map((point) => point.time);
  const minTime = Math.min(...times);
  const max = Math.max(...times);
  return { minTime, maxTime: max === minTime ? minTime + 1 : max };
}

function isScenario(value: unknown): value is Scenario {
  return typeof value === 'string' && SCENARIOS.includes(value as Scenario);
}

export default function MoneyTimelineWorkbench() {
  const [hydrated, setHydrated] = useState(false);
  const [scenario, setScenario] = useState<Scenario>('cashflows');
  const [flows, setFlows] = useState<Flow[]>(DEFAULT_FLOWS);
  const [cashflowRate, setCashflowRate] = useState('0.05');
  const [focalDate, setFocalDate] = useState('0');
  const [annuityPayment, setAnnuityPayment] = useState('1500');
  const [annuityRate, setAnnuityRate] = useState('0.01');
  const [annuityPeriods, setAnnuityPeriods] = useState('12');
  const [annuityTiming, setAnnuityTiming] = useState<AnnuityTiming>('immediate');
  const [annuityDirection, setAnnuityDirection] = useState<ValueDirection>('present');
  const [bondFace, setBondFace] = useState('1000');
  const [bondCouponRate, setBondCouponRate] = useState('0.05');
  const [bondRedemption, setBondRedemption] = useState('1000');
  const [bondYield, setBondYield] = useState('0.04');
  const [bondPeriods, setBondPeriods] = useState('10');
  const userInteracted = useRef(false);

  const draft: Draft = {
    scenario,
    flows,
    cashflowRate,
    focalDate,
    annuityPayment,
    annuityRate,
    annuityPeriods,
    annuityTiming,
    annuityDirection,
    bondFace,
    bondCouponRate,
    bondRedemption,
    bondYield,
    bondPeriods,
  };

  useEffect(() => {
    const requestedScenario = readWorkbenchOption('scenario', SCENARIOS);
    loadDraft<Draft>(LAB_ID, CONTENT_VERSION).then((saved) => {
      const savedScenario = saved && isScenario(saved.scenario) ? saved.scenario : undefined;
      if (!userInteracted.current && saved) {
        setScenario(requestedScenario ?? savedScenario ?? 'cashflows');
        setFlows(saved.flows);
        setCashflowRate(saved.cashflowRate);
        setFocalDate(saved.focalDate);
        setAnnuityPayment(saved.annuityPayment);
        setAnnuityRate(saved.annuityRate);
        setAnnuityPeriods(saved.annuityPeriods);
        setAnnuityTiming(saved.annuityTiming);
        setAnnuityDirection(saved.annuityDirection);
        setBondFace(saved.bondFace);
        setBondCouponRate(saved.bondCouponRate);
        setBondRedemption(saved.bondRedemption);
        setBondYield(saved.bondYield);
        setBondPeriods(saved.bondPeriods);
      }
      if (!userInteracted.current && !saved && requestedScenario) setScenario(requestedScenario);
      setHydrated(true);
    }).catch(() => setHydrated(true));
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const timer = window.setTimeout(() => void saveDraft(LAB_ID, CONTENT_VERSION, draft), 250);
    return () => window.clearTimeout(timer);
  }, [
    hydrated,
    scenario,
    flows,
    cashflowRate,
    focalDate,
    annuityPayment,
    annuityRate,
    annuityPeriods,
    annuityTiming,
    annuityDirection,
    bondFace,
    bondCouponRate,
    bondRedemption,
    bondYield,
    bondPeriods,
  ]);

  usePersistenceFlush(() => saveDraft(LAB_ID, CONTENT_VERSION, draft), hydrated);

  const computed = useMemo<Computed>(() => {
    try {
      if (scenario === 'cashflows') {
        const result = valueCashflowsAt(
          flows.map((flow, index) => ({ time: flow.time, amount: flow.amount, label: `Cash flow ${index + 1}` })),
          focalDate,
          cashflowRate,
        );
        const points: TimelinePoint[] = flows.map((flow, index) => ({
          time: decimalNumber(flow.time),
          label: `Cash flow ${index + 1}`,
          value: currency.format(decimalNumber(flow.amount)),
          tone: decimalNumber(flow.amount) < 0 ? 'muted' : 'accent',
        }));
        points.push({ time: decimalNumber(focalDate), label: 'Focal date', value: 'combine here', tone: 'primary' });
        const index = Math.max(0, flows.findIndex(flow => FinanceDecimal.from(flow.time).compare(focalDate) !== 0));
        const flow = flows[index]!;
        return { result, resultLabel: 'Equivalent value', points, ...bounds(points),
          step: { label: `Cash flow ${index + 1}`, amount: flow.amount, time: flow.time, focalDate, rate: cashflowRate } };
      }

      if (scenario === 'annuity') {
        const count = positiveInteger(annuityPeriods, 'Number of payments');
        const result = annuityValue(annuityPayment, annuityRate, count, annuityTiming, annuityDirection);
        const start = annuityTiming === 'due' ? 0 : 1;
        const end = annuityTiming === 'due' ? count - 1 : count;
        const focal = annuityDirection === 'present' ? 0 : count;
        const payment = currency.format(decimalNumber(annuityPayment));
        const points: TimelinePoint[] = sampledTimes(start, end).map((time, index, visible) => ({
          time,
          label: visible.length < count && index === Math.floor(visible.length / 2) ? 'level payments' : `R at t=${time}`,
          value: index === 0 || index === visible.length - 1 ? payment : undefined,
          tone: 'accent',
        }));
        points.push({ time: focal, label: annuityDirection === 'present' ? 'Present' : 'Future', value: 'focal date', tone: 'primary' });
        return {
          result,
          resultLabel: annuityDirection === 'present' ? 'Present value' : 'Future value',
          resultDetail: annuityTiming === 'immediate' ? 'payments at each period end' : 'payments at each period start',
          points,
          ...bounds(points),
          step: { label: 'Payment 1', amount: annuityPayment, time: String(start), focalDate: String(focal), rate: annuityRate },
        };
      }

      const count = positiveInteger(bondPeriods, 'Coupon periods');
      const result = bondPrice({
        faceValue: bondFace,
        couponRatePerPeriod: bondCouponRate,
        redemptionValue: bondRedemption,
        yieldPerPeriod: bondYield,
        periods: count,
      });
      const coupon = currency.format(result.couponPayment);
      const points: TimelinePoint[] = sampledTimes(1, count).map((time, index, visible) => ({
        time,
        label: visible.length < count && index === Math.floor(visible.length / 2) ? 'coupon stream' : `Coupon ${time}`,
        value: index === 0 || index === visible.length - 1 ? coupon : undefined,
        tone: 'accent',
      }));
      points.push({ time: count, label: 'Redemption', value: currency.format(decimalNumber(bondRedemption)), tone: 'accent' });
      points.push({ time: 0, label: 'Bond price', value: 'value here', tone: 'primary' });
      return {
        result,
        resultLabel: 'Bond price',
        resultDetail: result.classification,
        points,
        ...bounds(points),
        step: { label: 'Redemption', amount: bondRedemption, time: String(count), focalDate: '0', rate: bondYield },
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'This scenario could not be valued.',
        resultLabel: scenario === 'bond' ? 'Bond price' : scenario === 'annuity' ? 'Annuity value' : 'Equivalent value',
        points: [],
        minTime: 0,
        maxTime: 1,
      };
    }
  }, [
    scenario,
    flows,
    cashflowRate,
    focalDate,
    annuityPayment,
    annuityRate,
    annuityPeriods,
    annuityTiming,
    annuityDirection,
    bondFace,
    bondCouponRate,
    bondRedemption,
    bondYield,
    bondPeriods,
  ]);

  const nextTime = useMemo(() => {
    const validTimes = flows.flatMap((flow) => {
      try { return [decimalNumber(flow.time)]; } catch { return []; }
    });
    return String((validTimes.length ? Math.max(...validTimes) : flows.length - 1) + 1);
  }, [flows]);

  const updateFlow = (id: number, patch: Partial<Flow>) => {
    setFlows((current) => current.map((flow) => flow.id === id ? { ...flow, ...patch } : flow));
  };

  return (
    <section
      className="money-timeline"
      data-testid="money-timeline-workbench"
      data-hydrated={hydrated ? 'true' : undefined}
      data-scenario={scenario}
      onPointerDown={() => { userInteracted.current = true; }}
      onKeyDown={(event) => {
        if (event.target instanceof HTMLElement && event.target.closest('button,input,select')) userInteracted.current = true;
      }}
    >
      <header className="money-timeline__header">
        <div>
          <h2>Move one cash flow.</h2>
          <p>Choose a focal date, check a move, then combine the values.</p>
        </div>
        <div className="money-timeline__scenario" data-scenario-control>
          <WorkbenchTaskPicker
            value={scenario}
            options={TASK_OPTIONS}
            disabled={!hydrated}
            onChange={(value) => { if (isScenario(value)) setScenario(value); }}
          />
        </div>
      </header>

      <div className="money-timeline__workspace">
        <section className="money-timeline__object" data-money-timeline-object aria-label="Synchronized money timeline">
          {computed.result ? (
            <Timeline
              minTime={computed.minTime}
              maxTime={computed.maxTime}
              points={computed.points}
              ariaLabel={`${computed.resultLabel} timeline`}
            />
          ) : (
            <div className="money-timeline__empty">Edit the cash flows and rates to restore the timeline.</div>
          )}
        </section>

        {computed.result && computed.step && (
          <MoneyStepCoach key={JSON.stringify(draft)} step={computed.step} disabled={!hydrated}>
            <output className="money-timeline__result" aria-live="polite">
              <span>{computed.resultLabel}</span>
              <strong>{currency.format(computed.result.value)}</strong>
              {computed.resultDetail && <small>{computed.resultDetail}</small>}
              <small>{financeCertaintyLabel(computed.result)}</small>
            </output>
            <StepTrace steps={computed.result.trace} title="Money timeline calculation" initialCount={computed.result.trace.length} />
          </MoneyStepCoach>
        )}
      </div>

      <details className="money-timeline__editor" key={scenario}>
        <summary>Edit cash flows and rates</summary>
        <fieldset className="money-timeline__setup" disabled={!hydrated}>
          <legend className="sr-only">{computed.resultLabel} inputs</legend>
          {scenario === 'cashflows' && (
            <>
              <div className="money-timeline__field-pair">
                <label className="form-field">
                  <span className="form-field__label">Effective rate per period</span>
                  <input className="text-input" name="cashflow-rate" inputMode="decimal" autoComplete="off" value={cashflowRate} onChange={(event) => setCashflowRate(event.target.value)} />
                </label>
                <label className="form-field">
                  <span className="form-field__label">Focal date</span>
                  <input className="text-input" name="cashflow-focal-date" inputMode="decimal" autoComplete="off" value={focalDate} onChange={(event) => setFocalDate(event.target.value)} />
                </label>
              </div>
              <div className="money-timeline__flows">
                {flows.map((flow, index) => (
                  <div className="money-timeline__flow" key={flow.id}>
                    <span className="money-timeline__flow-number">{String(index + 1).padStart(2, '0')}</span>
                    <label className="form-field">
                      <span className="form-field__label">Amount</span>
                      <input className="text-input" name={`cashflow-${flow.id}-amount`} inputMode="decimal" autoComplete="off" value={flow.amount} onChange={(event) => updateFlow(flow.id, { amount: event.target.value })} />
                    </label>
                    <label className="form-field">
                      <span className="form-field__label">Time</span>
                      <input className="text-input" name={`cashflow-${flow.id}-time`} inputMode="decimal" autoComplete="off" value={flow.time} onChange={(event) => updateFlow(flow.id, { time: event.target.value })} />
                    </label>
                    {flows.length > 2 && (
                      <Button type="button" variant="ghost" aria-label={`Remove cash flow ${index + 1}`} onClick={() => setFlows((current) => current.filter((item) => item.id !== flow.id))}>
                        <Trash2 size={16} aria-hidden="true" /> Remove
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              <Button
                type="button"
                variant="ghost"
                disabled={flows.length >= 8}
                onClick={() => setFlows((current) => [...current, { id: Math.max(0, ...current.map((flow) => flow.id)) + 1, time: nextTime, amount: '500' }])}
              >
                <Plus size={16} aria-hidden="true" /> Add cash flow
              </Button>
            </>
          )}

          {scenario === 'annuity' && (
            <>
              <div className="money-timeline__field-pair">
                <label className="form-field"><span className="form-field__label">Payment amount</span><input className="text-input" name="annuity-payment" inputMode="decimal" autoComplete="off" value={annuityPayment} onChange={(event) => setAnnuityPayment(event.target.value)} /></label>
                <label className="form-field"><span className="form-field__label">Number of payments</span><input className="text-input" name="annuity-periods" inputMode="numeric" autoComplete="off" value={annuityPeriods} onChange={(event) => setAnnuityPeriods(event.target.value)} /></label>
                <label className="form-field"><span className="form-field__label">Effective rate per payment period</span><input className="text-input" name="annuity-rate" inputMode="decimal" autoComplete="off" value={annuityRate} onChange={(event) => setAnnuityRate(event.target.value)} /></label>
                <label className="form-field"><span className="form-field__label">Payment timing</span><select className="select-input" name="annuity-timing" value={annuityTiming} onChange={(event) => setAnnuityTiming(event.target.value as AnnuityTiming)}><option value="immediate">End of period</option><option value="due">Start of period</option></select></label>
                <label className="form-field"><span className="form-field__label">Value at</span><select className="select-input" name="annuity-direction" value={annuityDirection} onChange={(event) => setAnnuityDirection(event.target.value as ValueDirection)}><option value="present">Present date</option><option value="future">Final date</option></select></label>
              </div>
            </>
          )}

          {scenario === 'bond' && (
            <div className="money-timeline__field-pair">
              <label className="form-field"><span className="form-field__label">Face value</span><input className="text-input" name="bond-face" inputMode="decimal" autoComplete="off" value={bondFace} onChange={(event) => setBondFace(event.target.value)} /></label>
              <label className="form-field"><span className="form-field__label">Coupon rate per period</span><input className="text-input" name="bond-coupon-rate" inputMode="decimal" autoComplete="off" value={bondCouponRate} onChange={(event) => setBondCouponRate(event.target.value)} /></label>
              <label className="form-field"><span className="form-field__label">Redemption value</span><input className="text-input" name="bond-redemption" inputMode="decimal" autoComplete="off" value={bondRedemption} onChange={(event) => setBondRedemption(event.target.value)} /></label>
              <label className="form-field"><span className="form-field__label">Yield per coupon period</span><input className="text-input" name="bond-yield" inputMode="decimal" autoComplete="off" value={bondYield} onChange={(event) => setBondYield(event.target.value)} /></label>
              <label className="form-field"><span className="form-field__label">Coupon periods</span><input className="text-input" name="bond-periods" inputMode="numeric" autoComplete="off" value={bondPeriods} onChange={(event) => setBondPeriods(event.target.value)} /></label>
            </div>
          )}

          {computed.error && <Feedback tone="error" role="alert">{computed.error}</Feedback>}
          <p className="money-timeline__storage-note">Changes stay in this browser.</p>
        </fieldset>
      </details>
    </section>
  );
}
