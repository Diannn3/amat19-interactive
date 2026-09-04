import {
  analyzeBinaryBayes,
  analyzeTwoWayTable,
  arrangementsWithRepetition,
  combinations,
  combinationsWithRepetition,
  makeTwoWayTable,
  permutations,
  recommendCountingMethod,
  simulateBernoulli,
  type BernoulliSimulation,
} from '@amat19/domain-probability';
import { Rational } from '@amat19/math-core';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '../ui/Button';
import { Feedback } from '../ui/Feedback';
import { loadDraft, saveDraft } from '../../lib/draft';
import { checkProbabilityAnswer, type ProbabilityAnswerFeedback } from '../../lib/probability-answer-feedback';
import { checkCountingModel, COUNTING_METHOD_OPTIONS, isCountingMethod, type CountingAnswerFeedback, type CountingMethod } from '../../lib/counting-answer-feedback';
import { usePersistenceFlush } from '../../lib/use-persistence-flush';
import { readWorkbenchOption } from '../../lib/workbench-route';

type Mode = 'counting' | 'conditioning' | 'bayes' | 'verify';
type Condition = 'a-given-b' | 'b-given-a';
type Draft = {
  mode: Mode;
  orderMatters: boolean;
  repetitionAllowed: boolean;
  n: number;
  r: number;
  countingMethod?: CountingMethod;
  cells: [number, number, number, number];
  condition: Condition;
  trials: number;
  seed: string;
};

const LAB_ID = 'workbench.probability-model';
const CONTENT_VERSION = '1';
const INITIAL: Draft = {
  mode: 'counting',
  orderMatters: true,
  repetitionAllowed: false,
  n: 8,
  r: 3,
  cells: [20, 10, 5, 15],
  condition: 'a-given-b',
  trials: 10_000,
  seed: 'amat19-verification',
};

const MODES: Array<{ id: Mode; label: string }> = [
  { id: 'counting', label: 'Counting' },
  { id: 'conditioning', label: 'Conditioning' },
  { id: 'bayes', label: 'Bayes' },
  { id: 'verify', label: 'Verify' },
];

function errorText(error: unknown): string {
  return error instanceof Error ? error.message : 'This probability model could not be evaluated.';
}

function exactCount(method: ReturnType<typeof recommendCountingMethod>['method'], n: number, r: number): bigint {
  if (method === 'permutation') return permutations(n, r);
  if (method === 'combination') return combinations(n, r);
  if (method === 'arrangements-with-repetition') return arrangementsWithRepetition(n, r);
  return combinationsWithRepetition(n, r);
}

function countFormula(method: ReturnType<typeof recommendCountingMethod>['method'], n: number, r: number, value: bigint): string {
  if (method === 'permutation') return `P(${n}, ${r}) = ${value}`;
  if (method === 'combination') return `C(${n}, ${r}) = ${value}`;
  if (method === 'arrangements-with-repetition') return `${n}^${r} = ${value}`;
  return `C(${n} + ${r} - 1, ${r}) = ${value}`;
}

export default function ProbabilityModelBuilder() {
  const [hydrated, setHydrated] = useState(false);
  const [mode, setMode] = useState<Mode>(INITIAL.mode);
  const [orderMatters, setOrderMatters] = useState(INITIAL.orderMatters);
  const [repetitionAllowed, setRepetitionAllowed] = useState(INITIAL.repetitionAllowed);
  const [n, setN] = useState(INITIAL.n);
  const [r, setR] = useState(INITIAL.r);
  const [countingMethod, setCountingMethod] = useState<CountingMethod | ''>('');
  const [countingFeedback, setCountingFeedback] = useState<CountingAnswerFeedback>();
  const [countingRevealed, setCountingRevealed] = useState(false);
  const [cells, setCells] = useState<[number, number, number, number]>(INITIAL.cells);
  const [condition, setCondition] = useState<Condition>(INITIAL.condition);
  const [conditionalAnswerRaw, setConditionalAnswerRaw] = useState('');
  const [conditionalFeedback, setConditionalFeedback] = useState<ProbabilityAnswerFeedback>();
  const [conditionalRevealed, setConditionalRevealed] = useState(false);
  const [bayesAnswerRaw, setBayesAnswerRaw] = useState('');
  const [bayesFeedback, setBayesFeedback] = useState<ProbabilityAnswerFeedback>();
  const [bayesRevealed, setBayesRevealed] = useState(false);
  const [trials, setTrials] = useState(INITIAL.trials);
  const [seed, setSeed] = useState(INITIAL.seed);
  const [simulation, setSimulation] = useState<BernoulliSimulation>();
  const [simulationError, setSimulationError] = useState<string>();

  useEffect(() => {
    let active = true;
    const requestedMode = readWorkbenchOption('mode', MODES.map((item) => item.id));
    loadDraft<Draft>(LAB_ID, CONTENT_VERSION).then((draft) => {
      if (!active) return;
      if (draft) {
        setMode(requestedMode ?? draft.mode); setOrderMatters(draft.orderMatters); setRepetitionAllowed(draft.repetitionAllowed);
        setN(draft.n); setR(draft.r); setCountingMethod(isCountingMethod(draft.countingMethod) ? draft.countingMethod : ''); setCells(draft.cells); setCondition(draft.condition);
        setTrials(draft.trials); setSeed(draft.seed);
      }
      if (!draft && requestedMode) setMode(requestedMode);
      setHydrated(true);
    }).catch(() => setHydrated(true));
    return () => { active = false; };
  }, []);

  const draft = useMemo<Draft>(() => ({ mode, orderMatters, repetitionAllowed, n, r, countingMethod: countingMethod || undefined, cells, condition, trials, seed }), [mode, orderMatters, repetitionAllowed, n, r, countingMethod, cells, condition, trials, seed]);
  useEffect(() => {
    if (!hydrated) return;
    const timer = window.setTimeout(() => { void saveDraft(LAB_ID, CONTENT_VERSION, draft); }, 250);
    return () => window.clearTimeout(timer);
  }, [draft, hydrated]);
  usePersistenceFlush(() => saveDraft(LAB_ID, CONTENT_VERSION, draft), hydrated);

  const counting = useMemo(() => {
    const decision = recommendCountingMethod({ orderMatters, repetitionAllowed });
    try {
      const value = exactCount(decision.method, n, r);
      return { decision, value, formula: countFormula(decision.method, n, r, value), error: undefined };
    } catch (error) {
      return { decision, value: undefined, formula: undefined, error: errorText(error) };
    }
  }, [orderMatters, repetitionAllowed, n, r]);

  const conditioning = useMemo(() => {
    try {
      const table = makeTwoWayTable({ aAndB: cells[0], aAndNotB: cells[1], notAAndB: cells[2], notAAndNotB: cells[3] });
      return { table, analysis: analyzeTwoWayTable(table), error: undefined };
    } catch (error) {
      return { table: undefined, analysis: undefined, error: errorText(error) };
    }
  }, [cells]);

  const bayes = useMemo(() => {
    if (!conditioning.table || !conditioning.analysis) return { result: undefined, error: conditioning.error ?? 'Build a valid event table first.' };
    try {
      const notACount = conditioning.analysis.total - conditioning.analysis.countA;
      if (!conditioning.analysis.pBGivenA || notACount === 0n) throw new RangeError('Bayes needs observations in both A and not A.');
      return {
        result: analyzeBinaryBayes({
          priorA: conditioning.analysis.pA,
          positiveGivenA: conditioning.analysis.pBGivenA,
          positiveGivenNotA: new Rational(conditioning.table.notAAndB, notACount),
        }),
        error: undefined,
      };
    } catch (error) {
      return { result: undefined, error: errorText(error) };
    }
  }, [conditioning]);

  function updateCell(index: number, value: number) {
    setCells((current) => current.map((cell, cellIndex) => cellIndex === index ? value : cell) as [number, number, number, number]);
    setConditionalAnswerRaw('');
    setConditionalFeedback(undefined);
    setConditionalRevealed(false);
    setBayesAnswerRaw('');
    setBayesFeedback(undefined);
    setBayesRevealed(false);
    setSimulation(undefined);
    setSimulationError(undefined);
  }

  function selectMode(next: Mode) {
    setMode(next);
    setConditionalAnswerRaw('');
    setConditionalFeedback(undefined);
    setConditionalRevealed(false);
    setBayesAnswerRaw('');
    setBayesFeedback(undefined);
    setBayesRevealed(false);
    setSimulation(undefined);
    setSimulationError(undefined);
  }

  function resetCountingModel() {
    setCountingMethod('');
    setCountingFeedback(undefined);
    setCountingRevealed(false);
  }

  function resetCountingResult() {
    setCountingFeedback(undefined);
    setCountingRevealed(false);
  }

  function checkCounting() {
    const result = checkCountingModel(countingMethod, counting.decision.method);
    setCountingFeedback(result);
    setCountingRevealed(result.status === 'correct' && !counting.error);
  }

  function checkConditionalAnswer() {
    if (!conditioning.analysis) return;
    const expected = condition === 'a-given-b' ? conditioning.analysis.pAGivenB : conditioning.analysis.pBGivenA;
    if (!expected) return;
    const result = checkProbabilityAnswer(conditionalAnswerRaw, expected, 'conditional probability');
    setConditionalFeedback(result);
    setConditionalRevealed(result.status === 'correct');
  }

  function checkBayesAnswer() {
    if (!bayes.result) return;
    const result = checkProbabilityAnswer(bayesAnswerRaw, bayes.result.posteriorAGivenPositive, 'posterior');
    setBayesFeedback(result);
    setBayesRevealed(result.status === 'correct');
  }

  function runVerification() {
    try {
      const probability = conditioning.analysis?.pB;
      if (!probability) throw new RangeError('Build a valid event table before running a simulation.');
      if (trials > 100_000) throw new RangeError('The interactive verifier is limited to 100,000 trials per run.');
      setSimulation(simulateBernoulli({ probability, trials, seed, checkpointCount: 28 }));
      setSimulationError(undefined);
    } catch (error) {
      setSimulation(undefined);
      setSimulationError(errorText(error));
    }
  }

  return (
    <section className="probability-builder" data-testid="probability-model-builder" data-hydrated={hydrated ? 'true' : undefined}>
      <fieldset className="probability-builder__mode-fieldset" disabled={!hydrated}>
        <legend className="sr-only">Choose a probability model</legend>
        <div className="probability-builder__modes" role="group" aria-label="Probability model">
          {MODES.map((item) => <button data-primary-control className="probability-builder__mode" data-active={mode === item.id} aria-pressed={mode === item.id} type="button" key={item.id} onClick={() => selectMode(item.id)}>{item.label}</button>)}
        </div>
      </fieldset>

      {mode === 'counting' && <section className="probability-builder__stage" aria-labelledby="counting-heading">
        <header className="probability-builder__header"><h2 id="counting-heading">Name what makes an outcome different.</h2><p>Order and repetition choose the formula. Set those rules before entering the size of the selection.</p></header>
        <fieldset className="probability-builder__counting-controls" disabled={!hydrated}>
          <legend className="sr-only">Counting model</legend>
          <label className="form-field"><span className="form-field__label">Order</span><select data-primary-control className="select-input" value={String(orderMatters)} onChange={(event) => { setOrderMatters(event.target.value === 'true'); resetCountingModel(); }}><option value="true">Order changes the outcome</option><option value="false">Only the chosen group matters</option></select></label>
          <label className="form-field"><span className="form-field__label">Repetition</span><select data-primary-control className="select-input" value={String(repetitionAllowed)} onChange={(event) => { setRepetitionAllowed(event.target.value === 'true'); resetCountingModel(); }}><option value="false">A choice cannot repeat</option><option value="true">A choice may repeat</option></select></label>
          <label className="form-field"><span className="form-field__label">Available choices, n</span><input data-primary-control className="text-input" type="number" min="0" step="1" value={n} onChange={(event) => { setN(Number(event.target.value)); resetCountingResult(); }} /></label>
          <label className="form-field"><span className="form-field__label">Selected positions, r</span><input data-primary-control className="text-input" type="number" min="0" step="1" value={r} onChange={(event) => { setR(Number(event.target.value)); resetCountingResult(); }} /></label>
        </fieldset>
        <form className="probability-builder__counting-check" onSubmit={(event) => { event.preventDefault(); checkCounting(); }}>
          <fieldset disabled={!hydrated}>
            <legend className="sr-only">Check your counting model</legend>
            <label className="form-field"><span className="form-field__label">Your model</span><select data-primary-control className="select-input" aria-label="Counting model" value={countingMethod} onChange={(event) => { setCountingMethod(event.target.value as CountingMethod | ''); setCountingFeedback(undefined); setCountingRevealed(false); }}><option value="">Choose a model</option>{COUNTING_METHOD_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
            <Button data-primary-control variant="primary" type="submit" disabled={!countingMethod}>Check model</Button>
          </fieldset>
        </form>
        <div data-counting-feedback>{countingFeedback && <Feedback tone={countingFeedback.status === 'correct' ? 'success' : countingFeedback.status === 'incomplete' ? 'warning' : 'error'}>{countingFeedback.message}</Feedback>}</div>
        {counting.error ? <Feedback tone="error" role="alert">{counting.error}</Feedback> : countingRevealed && <div className="probability-builder__result" data-probability-result><span>{counting.decision.label}</span><strong>{counting.formula}</strong><small>{counting.decision.reason}</small></div>}
      </section>}

      {mode === 'conditioning' && <section className="probability-builder__stage" aria-labelledby="conditioning-heading">
        <header className="probability-builder__header"><h2 id="conditioning-heading">Shrink the sample space first.</h2><p>The highlighted event becomes the denominator. Edit the same four regions used by the other probability views.</p></header>
        <EventModelTable cells={cells} condition={condition} hydrated={hydrated} showConditionChoice onConditionChange={(next) => { setCondition(next); setConditionalAnswerRaw(''); setConditionalFeedback(undefined); setConditionalRevealed(false); }} onCellChange={updateCell} />
        {conditioning.error ? <Feedback tone="error" role="alert">{conditioning.error}</Feedback> : conditioning.analysis && <>
          <form className="probability-builder__answer" onSubmit={(event) => { event.preventDefault(); checkConditionalAnswer(); }}>
            <label className="form-field"><span className="form-field__label">Conditional probability answer</span><input data-primary-control className="text-input" name="conditional-answer" value={conditionalAnswerRaw} onChange={(event) => { setConditionalAnswerRaw(event.target.value); setConditionalFeedback(undefined); setConditionalRevealed(false); }} placeholder="For example, 4/5" autoComplete="off" /></label>
            <Button data-primary-control variant="primary" type="submit">Check answer</Button>
          </form>
          <div id="conditional-answer-feedback">{conditionalFeedback && <Feedback tone={conditionalFeedback.status === 'correct' ? 'success' : 'error'}>{conditionalFeedback.message}</Feedback>}</div>
          {conditionalRevealed && <ConditionalResult condition={condition} analysis={conditioning.analysis} />}
          <Button type="button" variant="ghost" aria-expanded={conditionalRevealed} onClick={() => setConditionalRevealed((revealed) => !revealed)}>{conditionalRevealed ? 'Hide exact result' : 'Show exact result'}</Button>
        </>}
      </section>}

      {mode === 'bayes' && <section className="probability-builder__stage" aria-labelledby="bayes-heading">
        <header className="probability-builder__header"><h2 id="bayes-heading">Follow the same paths to the evidence.</h2><p>Bayes is another view of the event table: multiply each path, add the paths ending in B, then divide.</p></header>
        <EventModelTable cells={cells} condition={condition} hydrated={hydrated} onCellChange={updateCell} />
        {bayes.error ? <Feedback tone="error" role="alert">{bayes.error}</Feedback> : bayes.result && <>
          <form className="probability-builder__answer" onSubmit={(event) => { event.preventDefault(); checkBayesAnswer(); }}>
            <label className="form-field"><span className="form-field__label">Posterior probability answer</span><input data-primary-control className="text-input" name="posterior-answer" value={bayesAnswerRaw} onChange={(event) => { setBayesAnswerRaw(event.target.value); setBayesFeedback(undefined); setBayesRevealed(false); }} placeholder="For example, 4/5" autoComplete="off" /></label>
            <Button data-primary-control variant="primary" type="submit">Check answer</Button>
          </form>
          <div id="bayes-answer-feedback">{bayesFeedback && <Feedback tone={bayesFeedback.status === 'correct' ? 'success' : 'error'}>{bayesFeedback.message}</Feedback>}</div>
          {bayesRevealed && <BayesPaths result={bayes.result} />}
          <Button type="button" variant="ghost" aria-expanded={bayesRevealed} onClick={() => setBayesRevealed((revealed) => !revealed)}>{bayesRevealed ? 'Hide path accounting' : 'Show path accounting'}</Button>
        </>}
      </section>}

      {mode === 'verify' && <section className="probability-builder__stage" aria-labelledby="verify-heading">
        <header className="probability-builder__header"><h2 id="verify-heading">Check long-run behavior without calling it proof.</h2><p>Run the event B from the same table. A seed makes the experiment reproducible; the result remains evidence, not proof.</p></header>
        <EventModelTable cells={cells} condition={condition} hydrated={hydrated} onCellChange={updateCell} />
        {conditioning.analysis && <div className="probability-builder__exact-event"><span>Exact P(B) from this table</span><strong>{conditioning.analysis.pB.toString()}</strong><small>The simulation below should move toward this value.</small></div>}
        <fieldset className="probability-builder__verify-controls" disabled={!hydrated}>
          <legend className="sr-only">Simulation verification</legend>
          <label className="form-field"><span className="form-field__label">Trials</span><input data-primary-control className="text-input" type="number" min="1" max="100000" step="1000" value={trials} onChange={(event) => { setTrials(Number(event.target.value)); setSimulation(undefined); }} /></label>
          <label className="form-field"><span className="form-field__label">Seed</span><input data-primary-control className="text-input" value={seed} onChange={(event) => { setSeed(event.target.value); setSimulation(undefined); }} /></label>
          <Button data-primary-control variant="primary" type="button" onClick={runVerification}>Run verification</Button>
        </fieldset>
        {simulationError && <Feedback tone="error" role="alert">{simulationError}</Feedback>}
        {simulation && <SimulationResult result={simulation} />}
      </section>}
    </section>
  );
}

function EventModelTable({
  cells,
  condition,
  hydrated,
  showConditionChoice = false,
  onConditionChange,
  onCellChange,
}: {
  cells: [number, number, number, number];
  condition: Condition;
  hydrated: boolean;
  showConditionChoice?: boolean;
  onConditionChange?: (condition: Condition) => void;
  onCellChange: (index: number, value: number) => void;
}) {
  return <section className="probability-builder__event-model" aria-labelledby="event-model-heading">
    <div className="probability-builder__event-model-heading">
      <h3 id="event-model-heading">One shared event model.</h3>
      <p>Edit four disjoint regions; the conditional, Bayes, and simulation views use these same counts.</p>
    </div>
    {showConditionChoice && onConditionChange && <fieldset className="probability-builder__condition-choice" disabled={!hydrated}>
      <legend>Question</legend>
      <label><input data-primary-control type="radio" name="condition" checked={condition === 'a-given-b'} onChange={() => onConditionChange('a-given-b')} /> P(A | B)</label>
      <label><input data-primary-control type="radio" name="condition" checked={condition === 'b-given-a'} onChange={() => onConditionChange('b-given-a')} /> P(B | A)</label>
    </fieldset>}
    <div className="probability-builder__table-scroll" tabIndex={0}>
      <table aria-label="Two-way count table" className="probability-builder__two-way">
        <thead><tr><th></th><th data-active={condition === 'a-given-b'}>B</th><th>not B</th></tr></thead>
        <tbody>
          <tr data-active={condition === 'b-given-a'}><th>A</th><td><label><span className="sr-only">A and B</span><input data-primary-control disabled={!hydrated} type="number" min="0" value={Number.isNaN(cells[0]) ? '' : cells[0]} onChange={(event) => onCellChange(0, Number(event.target.value))} /></label></td><td><label><span className="sr-only">A and not B</span><input data-primary-control disabled={!hydrated} type="number" min="0" value={Number.isNaN(cells[1]) ? '' : cells[1]} onChange={(event) => onCellChange(1, Number(event.target.value))} /></label></td></tr>
          <tr><th>not A</th><td><label><span className="sr-only">not A and B</span><input data-primary-control disabled={!hydrated} type="number" min="0" value={Number.isNaN(cells[2]) ? '' : cells[2]} onChange={(event) => onCellChange(2, Number(event.target.value))} /></label></td><td><label><span className="sr-only">not A and not B</span><input data-primary-control disabled={!hydrated} type="number" min="0" value={Number.isNaN(cells[3]) ? '' : cells[3]} onChange={(event) => onCellChange(3, Number(event.target.value))} /></label></td></tr>
        </tbody>
      </table>
    </div>
  </section>;
}

function BayesPaths({ result }: { result: ReturnType<typeof analyzeBinaryBayes> }) {
  return <div className="probability-builder__bayes-paths">
    <div><span>A → B</span><strong>{result.priorA.toString()} × {result.positiveGivenA.toString()} = {result.jointAPositive.toString()}</strong></div>
    <div><span>Aᶜ → B</span><strong>{result.priorNotA.toString()} × {result.positiveGivenNotA.toString()} = {result.jointNotAPositive.toString()}</strong></div>
    <div><span>All B evidence</span><strong>{result.jointAPositive.toString()} + {result.jointNotAPositive.toString()} = {result.positive.toString()}</strong></div>
    <div className="probability-builder__result" data-probability-result><span>Posterior</span><strong>P(A | B) = {result.posteriorAGivenPositive.toString()}</strong><small>target path ÷ all paths ending in B</small></div>
  </div>;
}

function ConditionalResult({ condition, analysis }: { condition: Condition; analysis: ReturnType<typeof analyzeTwoWayTable> }) {
  const denominator = condition === 'a-given-b' ? analysis.countB : analysis.countA;
  const value = condition === 'a-given-b' ? analysis.pAGivenB : analysis.pBGivenA;
  const label = condition === 'a-given-b' ? 'P(A | B)' : 'P(B | A)';
  const event = condition === 'a-given-b' ? 'B' : 'A';
  return <div className="probability-builder__result" data-probability-result><span>Restricted sample space</span><strong>{label} = {value?.toString() ?? 'undefined'}</strong><small>{analysis.intersection.toString()} favorable inside {denominator.toString()} observations in {event}.</small></div>;
}

function SimulationResult({ result }: { result: BernoulliSimulation }) {
  const width = 560;
  const height = 180;
  const points = result.checkpoints.map((point, index) => {
    const x = result.checkpoints.length === 1 ? 0 : index * width / (result.checkpoints.length - 1);
    const y = height - point.frequency * height;
    return `${x},${y}`;
  }).join(' ');
  const theoryY = height - result.probability.toNumber() * height;
  return <div className="probability-builder__simulation" data-probability-result>
    <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`Observed frequency approaches theoretical probability ${result.probability.toString()}`}>
      <line x1="0" y1={theoryY} x2={width} y2={theoryY} className="probability-builder__theory-line" />
      <polyline points={points} className="probability-builder__frequency-line" />
    </svg>
    <div><strong>Completed {result.trials.toLocaleString('en-US')} seeded trials.</strong><span>{result.successes.toLocaleString('en-US')} successes · observed {result.frequency.toString()}</span><span>Theoretical probability {result.probability.toString()}</span><small>Simulation is evidence, not proof of the exact probability.</small></div>
  </div>;
}
