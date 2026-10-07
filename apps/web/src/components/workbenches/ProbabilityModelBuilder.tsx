import { analyzeBinaryBayes, analyzeDiscreteDistribution, analyzeTwoWayTable, makeTwoWayTable, wilsonProportionInterval } from '@amat19/domain-probability';
import { Rational } from '@amat19/math-core';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '../ui/Button';
import { Feedback } from '../ui/Feedback';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/Tabs';
import { loadDraft, saveDraft } from '../../lib/draft';
import { usePersistenceFlush } from '../../lib/use-persistence-flush';
import { checkProbabilityAnswer, type ProbabilityAnswerFeedback } from '../../lib/probability-answer-feedback';
import { coinMappingDistribution, resolveProbabilityView, type ProbabilityView } from './probability-model';

type Condition = 'a-given-b' | 'b-given-a';
type Row = { value: string; probability: string };
type Four = [string, string, string, string];
type Draft = { view: ProbabilityView; cells: Four; condition: Condition; distribution: Row[]; mappings: Four; successes: string; sampleSize: string; confidence: 90 | 95 | 99 };
const LAB_ID = 'workbench.probability-model';
const VERSION = '1';
const INITIAL: Draft = { view: 'conditional', cells: ['20', '10', '5', '15'], condition: 'a-given-b', distribution: [{ value: '0', probability: '1/4' }, { value: '1', probability: '1/2' }, { value: '2', probability: '1/4' }], mappings: ['0', '1', '1', '2'], successes: '40', sampleSize: '100', confidence: 95 };
const card = 'rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-6';
const field = 'min-h-11 w-full min-w-0 rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-[var(--foreground)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]';
const muted = 'text-sm text-[var(--foreground-muted)]';
function result<T>(fn: () => T): { value?: T; error?: string } { try { return { value: fn() }; } catch (error) { return { error: error instanceof Error ? error.message : 'Enter valid exact values.' }; } }
function count(raw: string, label: string): number {
  if (!/^(0|[1-9]\d*)$/.test(raw.trim())) throw new RangeError(`${label} must be a whole-number count.`);
  const parsed = Number(raw);
  if (!Number.isSafeInteger(parsed)) throw new RangeError(`${label} exceeds the safe integer range.`);
  return parsed;
}

export default function ProbabilityModelBuilder() {
  const [hydrated, setHydrated] = useState(false);
  const [view, setView] = useState<ProbabilityView>(INITIAL.view);
  const [cells, setCells] = useState<Four>(INITIAL.cells);
  const [condition, setCondition] = useState<Condition>(INITIAL.condition);
  const [distribution, setDistribution] = useState<Row[]>(INITIAL.distribution);
  const [mappings, setMappings] = useState<Four>(INITIAL.mappings);
  const [successes, setSuccesses] = useState(INITIAL.successes);
  const [sampleSize, setSampleSize] = useState(INITIAL.sampleSize);
  const [confidence, setConfidence] = useState<Draft['confidence']>(INITIAL.confidence);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState<ProbabilityAnswerFeedback>();
  const [revealed, setRevealed] = useState(false);
  function clearFeedback() { setAnswer(''); setFeedback(undefined); setRevealed(false); }

  useEffect(() => {
    let active = true;
    void loadDraft<Partial<Draft> & { cells?: [string | number, string | number, string | number, string | number] }>(LAB_ID, VERSION).then((draft) => {
      if (!active) return;
      setView(resolveProbabilityView(window.location.search, draft?.view));
      if (draft?.cells?.length === 4) setCells(draft.cells.map(String) as Four);
      if (draft?.condition === 'a-given-b' || draft?.condition === 'b-given-a') setCondition(draft.condition);
      if (Array.isArray(draft?.distribution) && draft.distribution.length) setDistribution(draft.distribution);
      if (draft?.mappings?.length === 4) setMappings(draft.mappings);
      if (typeof draft?.successes === 'string') setSuccesses(draft.successes);
      if (typeof draft?.sampleSize === 'string') setSampleSize(draft.sampleSize);
      if (draft?.confidence === 90 || draft?.confidence === 95 || draft?.confidence === 99) setConfidence(draft.confidence);
      setHydrated(true);
    }).catch(() => { if (active) { setView(resolveProbabilityView(window.location.search)); setHydrated(true); } });
    return () => { active = false; };
  }, []);
  useEffect(() => {
    const onPopState = () => { setView(resolveProbabilityView(window.location.search)); clearFeedback(); };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);
  const draft = useMemo<Draft>(() => ({ view, cells, condition, distribution, mappings, successes, sampleSize, confidence }), [view, cells, condition, distribution, mappings, successes, sampleSize, confidence]);
  useEffect(() => { if (!hydrated) return; const timer = window.setTimeout(() => { void saveDraft(LAB_ID, VERSION, draft); }, 250); return () => window.clearTimeout(timer); }, [draft, hydrated]);
  usePersistenceFlush(() => saveDraft(LAB_ID, VERSION, draft), hydrated);

  const eventModel = useMemo(() => result(() => {
    const [aAndB, aAndNotB, notAAndB, notAAndNotB] = cells.map((raw, index) => count(raw, ['A and B', 'A and not B', 'not A and B', 'not A and not B'][index]!));
    const table = makeTwoWayTable({ aAndB: aAndB!, aAndNotB: aAndNotB!, notAAndB: notAAndB!, notAAndNotB: notAAndNotB! });
    return { table, analysis: analyzeTwoWayTable(table) };
  }), [cells]);
  const pmf = useMemo(() => result(() => {
    if (distribution.some((row) => !row.value.trim() || !row.probability.trim())) throw new RangeError('Enter an exact x and P(X=x) in every row.');
    return analyzeDiscreteDistribution(distribution);
  }), [distribution]);
  const mapped = useMemo(() => result(() => coinMappingDistribution(mappings)), [mappings]);
  const interval = useMemo(() => result(() => wilsonProportionInterval(count(successes, 'Successes'), count(sampleSize, 'Sample size'), confidence)), [successes, sampleSize, confidence]);
  const analysis = eventModel.value?.analysis;
  const expected = condition === 'a-given-b' ? analysis?.pAGivenB : analysis?.pBGivenA;
  const label = condition === 'a-given-b' ? 'P(A | B)' : 'P(B | A)';
  function changeView(next: string) {
    if (next !== 'conditional' && next !== 'distribution' && next !== 'random-variable' && next !== 'inference') return;
    if (next === view) return;
    const url = new URL(window.location.href);
    url.searchParams.set('view', next);
    url.searchParams.delete('mode');
    window.history.pushState(null, '', url);
    setView(next);
    clearFeedback();
  }
  return <section className="probability-builder space-y-5" data-testid="probability-model-builder" data-hydrated={hydrated ? 'true' : undefined}>
    <header className="space-y-2"><h2 className="text-2xl font-semibold">Build a probability model</h2><p className={muted}>Edit the model and read the mathematical result beside it.</p></header>
    <Tabs value={view} onValueChange={changeView} activationMode="automatic">
      <TabsList aria-label="Probability views" className="flex gap-1 overflow-x-auto pb-2">
        <TabsTrigger value="conditional" className="min-h-11 shrink-0 px-3">Conditional Probability</TabsTrigger>
        <TabsTrigger value="distribution" className="min-h-11 shrink-0 px-3">Distributions</TabsTrigger>
        <TabsTrigger value="random-variable" className="min-h-11 shrink-0 px-3">Random Variables</TabsTrigger>
        <TabsTrigger value="inference" className="min-h-11 shrink-0 px-3">Inference <span className="ml-1 text-xs">Supplemental</span></TabsTrigger>
      </TabsList>
      <TabsContent value="conditional" className={`${card} space-y-5`}>
        <header><h3 className="text-xl font-semibold">Conditional probability</h3><p className={muted}>The event table and Venn labels use the same four disjoint counts.</p></header>
        <div className="overflow-x-auto"><table aria-label="Two-way count table" className="w-full min-w-[300px] text-left"><thead><tr><th scope="col" className="p-2">Event</th><th scope="col" className="p-2">B</th><th scope="col" className="p-2">Bᶜ</th></tr></thead><tbody>{[['A', 0, 1], ['Aᶜ', 2, 3]].map(([row, first, second]) => <tr key={row}><th scope="row" className="p-2">{row}</th>{[first, second].map((index) => <td key={index} className="p-1"><label><span className="sr-only">{['A and B', 'A and not B', 'not A and B', 'not A and not B'][Number(index)]}</span><input className={field} inputMode="numeric" value={cells[Number(index)]} disabled={!hydrated} onChange={(event) => { setCells((current) => current.map((cell, i) => i === index ? event.target.value : cell) as Four); clearFeedback(); }} /></label></td>)}</tr>)}</tbody></table></div>
        {eventModel.error && <Feedback tone="error" role="alert">{eventModel.error}</Feedback>}
        {analysis && <><div className="grid gap-4 lg:grid-cols-2"><figure className="rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] p-3"><svg viewBox="0 0 360 230" role="img" aria-label={`Schematic Venn diagram: A only ${cells[1]}, intersection ${cells[0]}, B only ${cells[2]}, neither ${cells[3]}`} className="w-full"><rect x="1" y="1" width="358" height="228" rx="8" fill="none" stroke="var(--border-strong)" /><circle cx="145" cy="106" r="75" fill="var(--accent-soft)" stroke="var(--primary)" strokeWidth="2" /><circle cx="215" cy="106" r="75" fill="var(--accent-soft)" stroke="var(--primary)" strokeWidth="2" /><text x="98" y="110" textAnchor="middle" fill="var(--foreground)">A only {cells[1]}</text><text x="180" y="110" textAnchor="middle" fill="var(--foreground)">A ∩ B {cells[0]}</text><text x="262" y="110" textAnchor="middle" fill="var(--foreground)">B only {cells[2]}</text><text x="180" y="207" textAnchor="middle" fill="var(--foreground)">Neither {cells[3]}</text></svg><figcaption className={muted}>Schematic regions. Exact count out of {analysis.total.toString()} in each label.</figcaption></figure><dl className="grid grid-cols-2 gap-2 content-start">{[['P(A)', analysis.pA.toString()], ['P(B)', analysis.pB.toString()], ['P(A ∩ B)', analysis.pIntersection.toString()], ['Independent?', analysis.independent ? 'Yes' : 'No'], ['P(A | B)', analysis.pAGivenB?.toString() ?? 'undefined'], ['P(B | A)', analysis.pBGivenA?.toString() ?? 'undefined']].map(([name, value]) => <div key={name} className="rounded-lg border border-[var(--border)] p-3"><dt className={muted}>{name}</dt><dd className="font-mono text-lg">{value}</dd></div>)}</dl></div>
          <fieldset className="flex flex-wrap gap-4"><legend className="font-medium">Question</legend><label className="flex min-h-11 items-center gap-2"><input type="radio" name="condition" checked={condition === 'a-given-b'} onChange={() => { setCondition('a-given-b'); clearFeedback(); }} />P(A | B)</label><label className="flex min-h-11 items-center gap-2"><input type="radio" name="condition" checked={condition === 'b-given-a'} onChange={() => { setCondition('b-given-a'); clearFeedback(); }} />P(B | A)</label></fieldset>
          {expected ? <><form className="flex flex-wrap items-end gap-3" onSubmit={(event) => { event.preventDefault(); const checked = checkProbabilityAnswer(answer, expected, 'conditional probability'); setFeedback(checked); setRevealed(checked.status === 'correct'); }}><label className="min-w-[180px] flex-1"><span className="block text-sm font-medium">Conditional probability answer</span><input className={field} value={answer} onChange={(event) => { setAnswer(event.target.value); setFeedback(undefined); setRevealed(false); }} placeholder="For example, 4/5" /></label><Button type="submit" variant="primary">Check answer</Button></form>{feedback && <Feedback tone={feedback.status === 'correct' ? 'success' : 'error'}>{feedback.message}</Feedback>}{revealed && <p className="font-mono" data-probability-result>{label} = {expected.toString()} · {analysis.intersection.toString()} favorable inside {(condition === 'a-given-b' ? analysis.countB : analysis.countA).toString()} observations.</p>}</> : <p role="status">The conditioning event has zero observations, so {label} is undefined.</p>}
          <details className="rounded-lg border border-[var(--border)] p-3"><summary className="min-h-11 cursor-pointer font-medium">Update with Bayes · Supplemental</summary><BayesDisclosure table={eventModel.value!.table} analysis={analysis} /></details>
        </>}
      </TabsContent>
      <TabsContent value="distribution" className={`${card} space-y-5`}>
        <header><h3 className="text-xl font-semibold">Discrete distribution</h3><p className={muted}>Enter exact x and P(X=x). The probabilities must sum to 1.</p></header>
        <div className="overflow-x-auto"><table aria-label="Discrete probability distribution" className="w-full min-w-[300px] text-left"><thead><tr><th scope="col" className="p-2">x</th><th scope="col" className="p-2">P(X=x)</th><th scope="col" className="p-2">Row</th></tr></thead><tbody>{distribution.map((row, index) => <tr key={index}><td className="p-1"><label><span className="sr-only">x for row {index + 1}</span><input className={field} value={row.value} onChange={(event) => setDistribution((current) => current.map((item, i) => i === index ? { ...item, value: event.target.value } : item))} /></label></td><td className="p-1"><label><span className="sr-only">Probability for row {index + 1}</span><input className={field} value={row.probability} onChange={(event) => setDistribution((current) => current.map((item, i) => i === index ? { ...item, probability: event.target.value } : item))} /></label></td><td className="p-1"><Button type="button" variant="ghost" disabled={distribution.length === 1} onClick={() => setDistribution((current) => current.filter((_, i) => i !== index))}>Remove row {index + 1}</Button></td></tr>)}</tbody></table></div>
        <Button type="button" onClick={() => setDistribution((current) => [...current, { value: '', probability: '' }])}>Add outcome</Button>
        {pmf.error && <Feedback tone="error" role="alert">{pmf.error}</Feedback>}
        {pmf.value && <><div aria-label="Probability mass function" className="space-y-2">{pmf.value.outcomes.map((outcome) => <div key={outcome.value.toString()} className="grid grid-cols-[4rem_1fr_4rem] items-center gap-2"><span className="font-mono">{outcome.value.toString()}</span><div className="h-5 bg-[var(--surface-muted)]"><div className="h-full bg-[var(--primary)]" style={{ width: `${outcome.probability.toNumber() * 100}%` }} /></div><span className="font-mono text-sm">{outcome.probability.toString()}</span></div>)}</div><Moments value={pmf.value} /></>}
      </TabsContent>
      <TabsContent value="random-variable" className={`${card} space-y-5`}>
        <header><h3 className="text-xl font-semibold">Map outcomes to X</h3><p className={muted}>X : Ω → ℝ maps each two-coin outcome to a value. Ω = {'{HH, HT, TH, TT}'}; each outcome has probability 1/4.</p></header>
        <div className="overflow-x-auto"><table aria-label="Two-coin random-variable mapping" className="w-full min-w-[280px] text-left"><thead><tr><th scope="col" className="p-2">Outcome ω</th><th scope="col" className="p-2">X(ω)</th></tr></thead><tbody>{['HH', 'HT', 'TH', 'TT'].map((outcome, index) => <tr key={outcome}><th scope="row" className="p-2 font-mono">{outcome}</th><td className="p-1"><label><span className="sr-only">X for {outcome}</span><input className={field} value={mappings[index]} onChange={(event) => setMappings((current) => current.map((value, i) => i === index ? event.target.value : value) as Four)} /></label></td></tr>)}</tbody></table></div>
        {mapped.error && <Feedback tone="error" role="alert">{mapped.error}</Feedback>}
        {mapped.value && <><div><h4 className="font-semibold">Derived PMF</h4><ul className="flex flex-wrap gap-2">{mapped.value.outcomes.map((row) => <li key={row.value.toString()} className="rounded-lg border border-[var(--border)] p-3 font-mono">P(X={row.value.toString()}) = {row.probability.toString()}</li>)}</ul></div><Moments value={mapped.value} /></>}
      </TabsContent>
      <TabsContent value="inference" className={`${card} space-y-5`}>
        <header><span className="text-sm font-semibold text-[var(--primary)]">Supplemental</span><h3 className="text-xl font-semibold">Estimate one population proportion</h3><p className={muted}>Enter a sample of independent, representative Bernoulli observations.</p></header>
        <div className="grid gap-3 sm:grid-cols-3"><label><span className="block text-sm font-medium">Successes</span><input className={field} inputMode="numeric" value={successes} onChange={(event) => setSuccesses(event.target.value)} /></label><label><span className="block text-sm font-medium">Sample size</span><input className={field} inputMode="numeric" value={sampleSize} onChange={(event) => setSampleSize(event.target.value)} /></label><label><span className="block text-sm font-medium">Confidence level</span><select className={field} value={confidence} onChange={(event) => setConfidence(Number(event.target.value) as Draft['confidence'])}><option value="90">90%</option><option value="95">95%</option><option value="99">99%</option></select></label></div>
        {interval.error && <Feedback tone="error" role="alert">{interval.error}</Feedback>}
        {interval.value && <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] p-4" data-probability-result><p>Sample proportion p̂ = <strong className="font-mono">{interval.value.sampleProportion.toString()}</strong></p><p>{confidence}% Wilson score interval: <strong className="font-mono">[{interval.value.lower.toFixed(4)}, {interval.value.upper.toFixed(4)}]</strong></p><p className={muted}>Approximate Wilson score method with a standard normal critical value. Assumes independent Bernoulli observations and a representative sample. This estimates an unknown population proportion; it is not an exact probability proof or a guarantee for this one interval.</p></div>}
      </TabsContent>
    </Tabs>
  </section>;
}

function Moments({ value }: { value: ReturnType<typeof analyzeDiscreteDistribution> }) {
  return <dl className="grid gap-2 sm:grid-cols-3">{[['E[X]', value.expectedValue.toString()], ['E[X²]', value.secondMoment.toString()], ['Var(X)', value.variance.toString()]].map(([label, answer]) => <div key={label} className="rounded-lg border border-[var(--border)] p-3"><dt className={muted}>{label}</dt><dd className="font-mono text-lg">{answer}</dd></div>)}</dl>;
}
function BayesDisclosure({ table, analysis }: { table: ReturnType<typeof makeTwoWayTable>; analysis: ReturnType<typeof analyzeTwoWayTable> }) {
  const bayes = result(() => {
    const notA = analysis.total - analysis.countA;
    if (!analysis.pBGivenA || notA === 0n) throw new RangeError('Bayes needs observations in A and Aᶜ.');
    return analyzeBinaryBayes({ priorA: analysis.pA, positiveGivenA: analysis.pBGivenA, positiveGivenNotA: new Rational(table.notAAndB, notA) });
  });
  return <div className="space-y-2 pt-3">{bayes.error ? <Feedback tone="error">{bayes.error}</Feedback> : bayes.value && <><p>Prior P(A) = {bayes.value.priorA.toString()}; likelihood P(B | A) = {bayes.value.positiveGivenA.toString()}.</p><p>A ∩ B = {bayes.value.jointAPositive.toString()}; all B evidence = {bayes.value.positive.toString()}.</p><p className="font-mono">P(A | B) = {bayes.value.posteriorAGivenPositive.toString()}</p></>}</div>;
}
