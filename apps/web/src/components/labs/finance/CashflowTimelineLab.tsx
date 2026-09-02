import { useMemo, useState } from 'react';
import { BookmarkPlus, Plus, Trash2 } from 'lucide-react';
import { valueCashflowsAt } from '@amat19/domain-finance';
import { DexiePersistence } from '@amat19/persistence';
import { Button } from '../../ui/Button';
import { Feedback } from '../../ui/Feedback';
import Timeline from '../../math/Timeline';
import StepTrace from '../../math/StepTrace';
type Flow = { id: number; time: number; amount: number; label: string };
const money = (value: number) => new Intl.NumberFormat('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);

export default function CashflowTimelineLab() {
  const [flows, setFlows] = useState<Flow[]>([{ id: 1, time: 0, amount: -2000, label: 'Initial payment' }, { id: 2, time: 1, amount: 800, label: 'Receipt 1' }, { id: 3, time: 2, amount: 900, label: 'Receipt 2' }, { id: 4, time: 3, amount: 1000, label: 'Receipt 3' }]);
  const [valuationTime, setValuationTime] = useState(0), [rate, setRate] = useState(.05), [message, setMessage] = useState<string>();
  const result = useMemo(() => { try { return { value: valueCashflowsAt(flows.map((flow) => ({ time: flow.time, amount: flow.amount, label: flow.label })), valuationTime, rate), error: undefined }; } catch (error) { return { value: undefined, error: error instanceof Error ? error.message : 'Cash flows could not be valued.' }; } }, [flows, valuationTime, rate]);
  const update = (id: number, patch: Partial<Flow>) => setFlows((current) => current.map((flow) => flow.id === id ? { ...flow, ...patch } : flow));
  async function save() { const db = new DexiePersistence(); const now = new Date().toISOString(); await db.saveItem({ id: `finance-scenario-${Date.now()}`, kind: 'custom-problem', title: `Cash-flow timeline at t=${valuationTime}`, href: '/labs/cashflow-timeline', module: 'finance', skillIds: ['finance.tvm.focal-date'], createdAt: now, updatedAt: now, payload: { flows, valuationTime, rate } }); setMessage('Scenario saved to your local library.'); }
  const times = [...flows.map((flow) => flow.time), valuationTime]; const min = Math.min(...times), max = Math.max(...times, min + 1);

  return <section className="finance-instrument finance-cashflow-instrument" data-testid="cashflow-timeline-lab">
    <div className="finance-instrument__modebar finance-cashflow-toolbar"><label className="form-field"><span className="form-field__label">Focal date</span><input className="text-input" type="number" value={valuationTime} onChange={(event) => setValuationTime(Number(event.target.value))} /></label><label className="form-field"><span className="form-field__label">Effective rate / period</span><input className="text-input" type="number" step="0.001" value={rate} onChange={(event) => setRate(Number(event.target.value))} /></label><Button variant="secondary" onClick={() => void save()}><BookmarkPlus size={15} /> Save scenario</Button></div>

    <aside className="finance-instrument__controls" aria-label="Cash flow editor"><div><h2>Move every amount to one focal date.</h2><p className="section-label">Cash-flow ledger</p><p className="instrument-note">Amounts stay separate in the ledger; the center line shows where they become comparable.</p></div><div className="cashflow-ledger">{flows.map((flow) => <div className="cashflow-ledger__row" key={flow.id}><label><span>t</span><input type="number" value={flow.time} onChange={(event) => update(flow.id, { time: Number(event.target.value) })} /></label><label><span>PHP</span><input type="number" value={flow.amount} onChange={(event) => update(flow.id, { amount: Number(event.target.value) })} /></label><label className="cashflow-ledger__label"><span>label</span><input value={flow.label} onChange={(event) => update(flow.id, { label: event.target.value })} /></label><Button variant="ghost" aria-label={`Remove ${flow.label}`} disabled={flows.length <= 1} onClick={() => setFlows((current) => current.filter((item) => item.id !== flow.id))}><Trash2 size={15} /></Button></div>)}</div><Button variant="ghost" onClick={() => setFlows((current) => [...current, { id: Math.max(0, ...current.map((flow) => flow.id)) + 1, time: max + 1, amount: 500, label: `Cash flow ${current.length + 1}` }])}><Plus size={15} /> Add cash flow</Button>{message && <Feedback tone="success">{message}</Feedback>}</aside>

    <div className="finance-instrument__canvas" aria-label="Cash-flow focal-date timeline"><div className="finance-instrument__canvas-head"><span>Focal-date timeline</span><strong>t = {valuationTime}</strong></div><div className="finance-native-timeline"><Timeline minTime={min} maxTime={max} points={[...flows.map((flow) => ({ time: flow.time, label: flow.label, value: `${flow.amount < 0 ? '−' : '+'}₱${money(Math.abs(flow.amount))}`, tone: flow.amount < 0 ? 'muted' as const : 'accent' as const })), { time: valuationTime, label: 'Focal date', value: 'combine here', tone: 'primary' as const }]} /></div>{result.error ? <Feedback tone="error">{result.error}</Feedback> : result.value && <div className="finance-result-strip"><span>Equivalent total at t = {valuationTime}</span><strong>₱ {money(result.value.value)}</strong><small>Exact: {result.value.exactValue.slice(0, 28)}</small></div>}</div>

    <aside className="finance-instrument__inspector" aria-label="Cash-flow valuation trace"><p className="section-label">Move each cash flow</p>{result.value && <StepTrace steps={result.value.trace} initialCount={Math.min(5, result.value.trace.length)} />}</aside>
  </section>;
}
