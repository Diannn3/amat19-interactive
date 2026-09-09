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

  // Mockup 7: Financial Mathematics Laboratory State
  const [principal, setPrincipal] = useState(10000);
  const [annualRate, setAnnualRate] = useState(5.0);
  const [years, setYears] = useState(10);
  const [compoundingN, setCompoundingN] = useState(1);
  const [modeTab, setModeTab] = useState<'compound' | 'annuity'>('compound');
  const [chartHoverIndex, setChartHoverIndex] = useState<number | null>(10);

  const rateDecimal = annualRate / 100;
  const futureVal = principal * Math.pow(1 + rateDecimal / compoundingN, compoundingN * years);
  const totalInt = Math.max(0, futureVal - principal);
  const growthMult = principal > 0 ? (futureVal / principal).toFixed(2) : '1.00';

  const growthCurvePoints = Array.from({ length: 11 }, (_, i) => {
    const t = (years / 10) * i;
    const fv = principal * Math.pow(1 + rateDecimal / compoundingN, compoundingN * t);
    const x = 50 + (i / 10) * 380;
    const y = 190 - ((fv - principal) / (futureVal - principal || 1)) * 130;
    return { t: Math.round(t), fv: Math.round(fv), x, y };
  });

  const curvePathD = growthCurvePoints.reduce((acc, pt, i) => {
    return i === 0 ? `M ${pt.x},${pt.y}` : `${acc} L ${pt.x},${pt.y}`;
  }, '');

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
      {/* Mockup 7: Financial Mathematics Laboratory */}
      <header className="fin-hero">
        <h2 className="fin-title">Model. Calculate. See the future.</h2>
        <p className="fin-lede">
          Explore time value of money, compound interest, annuities, and more.
        </p>

        <div className="prob-mode-bar" role="tablist" aria-label="Finance mode selection">
          <button 
            type="button" 
            className={`prob-mode-pill ${modeTab === 'compound' ? 'is-active' : ''}`}
            onClick={() => setModeTab('compound')}
          >
            Compound Interest
          </button>
          <button 
            type="button" 
            className={`prob-mode-pill ${modeTab === 'annuity' ? 'is-active' : ''}`}
            onClick={() => setModeTab('annuity')}
          >
            Annuity
          </button>
        </div>
      </header>

      <div className="fin-instrument-grid" style={{ marginBottom: '2.5rem' }}>
        <div className="fin-form-card apple-glass-card">
          <div className="fin-input-row">
            <div className="fin-input-label">
              <span>Principal (P)</span>
              <span style={{ fontFamily: 'var(--font-amat-mono)', color: '#2563eb' }}>${principal.toLocaleString()}</span>
            </div>
            <input 
              type="number" 
              className="fin-number-input" 
              value={principal} 
              step="500" 
              min="100" 
              onChange={(e) => setPrincipal(Math.max(0, Number(e.target.value)))} 
            />
            <input 
              type="range" 
              className="prob-slider" 
              min="1000" 
              max="100000" 
              step="1000" 
              value={principal} 
              onChange={(e) => setPrincipal(Number(e.target.value))} 
            />
          </div>

          <div className="fin-input-row">
            <div className="fin-input-label">
              <span>Annual Interest Rate (r)</span>
              <span style={{ fontFamily: 'var(--font-amat-mono)', color: '#2563eb' }}>{annualRate.toFixed(1)}%</span>
            </div>
            <input 
              type="number" 
              className="fin-number-input" 
              value={annualRate} 
              step="0.1" 
              min="0.1" 
              max="30" 
              onChange={(e) => setAnnualRate(Math.max(0.1, Number(e.target.value)))} 
            />
            <input 
              type="range" 
              className="prob-slider" 
              min="0.5" 
              max="20" 
              step="0.5" 
              value={annualRate} 
              onChange={(e) => setAnnualRate(Number(e.target.value))} 
            />
          </div>

          <div className="fin-input-row">
            <div className="fin-input-label">
              <span>Time in Years (t)</span>
              <span style={{ fontFamily: 'var(--font-amat-mono)', color: '#2563eb' }}>{years} yrs</span>
            </div>
            <input 
              type="number" 
              className="fin-number-input" 
              value={years} 
              min="1" 
              max="50" 
              onChange={(e) => setYears(Math.max(1, Number(e.target.value)))} 
            />
            <input 
              type="range" 
              className="prob-slider" 
              min="1" 
              max="40" 
              step="1" 
              value={years} 
              onChange={(e) => setYears(Number(e.target.value))} 
            />
          </div>

          <div className="fin-input-row">
            <div className="fin-input-label">
              <span>Compounding Frequency (n)</span>
            </div>
            <select 
              className="fin-select" 
              value={compoundingN} 
              onChange={(e) => setCompoundingN(Number(e.target.value))}
            >
              <option value="1">Annually (1 / yr)</option>
              <option value="2">Semi-Annually (2 / yr)</option>
              <option value="4">Quarterly (4 / yr)</option>
              <option value="12">Monthly (12 / yr)</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button type="button" className="apple-btn-black" style={{ flex: 1, padding: '0.65rem 1rem' }}>
              Calculate →
            </button>
            <button 
              type="button" 
              className="apple-btn-glass" 
              style={{ padding: '0.65rem 1rem' }}
              onClick={() => { setPrincipal(10000); setAnnualRate(5.0); setYears(10); setCompoundingN(1); }}
            >
              Reset
            </button>
          </div>
        </div>

        <div className="fin-chart-panel">
          <div className="fin-chart-card apple-glass-card">
            <svg viewBox="0 0 460 220" style={{ width: '100%', height: 'auto' }} aria-label="Investment growth curve">
              {/* Grid lines */}
              <line x1="50" y1="20" x2="50" y2="190" stroke="rgba(0,0,0,0.08)" strokeWidth="1" />
              <line x1="50" y1="190" x2="430" y2="190" stroke="rgba(0,0,0,0.08)" strokeWidth="1" />
              <line x1="50" y1="105" x2="430" y2="105" stroke="rgba(0,0,0,0.04)" strokeDasharray="4 4" />
              <line x1="50" y1="20" x2="430" y2="20" stroke="rgba(0,0,0,0.04)" strokeDasharray="4 4" />

              {/* Shaded Area Under Curve */}
              <path 
                d={`${curvePathD} L 430,190 L 50,190 Z`} 
                fill="rgba(37, 99, 235, 0.08)" 
              />

              {/* Curve */}
              <path 
                d={curvePathD} 
                fill="none" 
                stroke="#2563eb" 
                strokeWidth="3" 
                strokeLinecap="round" 
              />

              {/* Data points */}
              {growthCurvePoints.map((pt, i) => (
                <circle 
                  key={i} 
                  cx={pt.x} 
                  cy={pt.y} 
                  r={i === chartHoverIndex ? 6 : 3.5} 
                  fill={i === chartHoverIndex ? '#111111' : '#2563eb'} 
                  stroke="#ffffff" 
                  strokeWidth="2" 
                  style={{ cursor: 'pointer', transition: 'r 150ms ease' }}
                  onMouseEnter={() => setChartHoverIndex(i)}
                />
              ))}

              {/* Active Hover Tooltip */}
              {chartHoverIndex !== null && growthCurvePoints[chartHoverIndex] && (
                <g transform={`translate(${growthCurvePoints[chartHoverIndex].x}, ${growthCurvePoints[chartHoverIndex].y - 32})`}>
                  <rect 
                    x="-55" 
                    y="-18" 
                    width="110" 
                    height="24" 
                    rx="6" 
                    fill="#111111" 
                  />
                  <text 
                    x="0" 
                    y="-2" 
                    textAnchor="middle" 
                    fill="#ffffff" 
                    fontSize="10.5" 
                    fontWeight="600" 
                    fontFamily="monospace"
                  >
                    Year {growthCurvePoints[chartHoverIndex].t}: ${growthCurvePoints[chartHoverIndex].fv.toLocaleString()}
                  </text>
                </g>
              )}

              {/* Axis Labels */}
              <text x="50" y="206" fill="#71717a" fontSize="10" fontFamily="sans-serif">Yr 0</text>
              <text x="240" y="206" fill="#71717a" fontSize="10" fontFamily="sans-serif" textAnchor="middle">Yr {Math.round(years / 2)}</text>
              <text x="430" y="206" fill="#71717a" fontSize="10" fontFamily="sans-serif" textAnchor="end">Yr {years}</text>
            </svg>
          </div>

          <div className="fin-metrics-deck">
            <div className="fin-metric-box apple-glass-card">
              <span>Future Value (A)</span>
              <strong>${Math.round(futureVal).toLocaleString()}</strong>
            </div>
            <div className="fin-metric-box apple-glass-card">
              <span>Total Interest</span>
              <strong style={{ color: '#059669' }}>+${Math.round(totalInt).toLocaleString()}</strong>
            </div>
            <div className="fin-metric-box apple-glass-card">
              <span>Growth Multiple</span>
              <strong>{growthMult}×</strong>
            </div>
          </div>

          <div className="prob-formula-card">
            <div className="prob-formula-math" style={{ fontSize: '1.15rem' }}>
              A = P(1 + r/n)^(nt)
            </div>
            <p className="prob-formula-caption">
              P = Principal (${principal.toLocaleString()}) · r = Rate ({annualRate}%) · n = Compounding ({compoundingN}×/yr) · t = Time ({years} yrs)
            </p>
          </div>
        </div>
      </div>

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
