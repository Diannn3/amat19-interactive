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
import WorkbenchTaskPicker, { type WorkbenchTaskOption } from './WorkbenchTaskPicker';

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

const MODE_VALUES: readonly Mode[] = ['counting', 'conditioning', 'bayes', 'verify'];
const TASK_OPTIONS: readonly WorkbenchTaskOption[] = [
  { value: 'counting', label: 'Count outcomes', group: 'Start here' },
  { value: 'conditioning', label: 'Condition on an event', group: 'Model events' },
  { value: 'bayes', label: 'Apply Bayes', group: 'Model events' },
  { value: 'verify', label: 'Run a seeded check', group: 'Check evidence' },
];

function isMode(value: unknown): value is Mode {
  return typeof value === 'string' && MODE_VALUES.includes(value as Mode);
}

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

  // Mockup 6 Interactive Venn Model Builder State
  const [sliderA, setSliderA] = useState(0.40);
  const [sliderB, setSliderB] = useState(0.50);
  const [sliderAB, setSliderAB] = useState(0.20);
  const [activeTab, setActiveTab] = useState<'conditional' | 'distributions' | 'variables' | 'inference'>('conditional');

  const calcPAGivenB = sliderB > 0 ? (sliderAB / sliderB).toFixed(2) : '0.00';
  const calcPBGivenA = sliderA > 0 ? (sliderAB / sliderA).toFixed(2) : '0.00';

  function handleSliderA(val: number) {
    setSliderA(val);
    if (sliderAB > val) setSliderAB(Number(val.toFixed(2)));
  }

  function handleSliderB(val: number) {
    setSliderB(val);
    if (sliderAB > val) setSliderAB(Number(val.toFixed(2)));
  }

  function handleSliderAB(val: number) {
    const maxAllowed = Math.min(sliderA, sliderB);
    setSliderAB(Number(Math.min(val, maxAllowed).toFixed(2)));
  }

  useEffect(() => {
    let active = true;
    const requestedMode = readWorkbenchOption('mode', MODE_VALUES);
    loadDraft<Draft>(LAB_ID, CONTENT_VERSION).then((draft) => {
      if (!active) return;
      if (draft) {
        setMode(requestedMode ?? (isMode(draft.mode) ? draft.mode : INITIAL.mode)); setOrderMatters(draft.orderMatters); setRepetitionAllowed(draft.repetitionAllowed);
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
    resetCountingModel();
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
      {/* Mockup 6: Visual Hero & Interactive Venn Instrument */}
      <header className="prob-hero">
        <h2 className="prob-title">Model. Calculate. Understand.</h2>
        <p className="prob-lede">
          Explore probability through interactive visuals, formulas, and simulations.
        </p>

        <div className="prob-mode-bar" role="tablist" aria-label="Probability mode selection">
          <button 
            type="button" 
            className={`prob-mode-pill ${activeTab === 'conditional' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('conditional')}
          >
            Conditional Probability
          </button>
          <button 
            type="button" 
            className={`prob-mode-pill ${activeTab === 'distributions' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('distributions')}
          >
            Distributions
          </button>
          <button 
            type="button" 
            className={`prob-mode-pill ${activeTab === 'variables' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('variables')}
          >
            Random Variables
          </button>
          <button 
            type="button" 
            className={`prob-mode-pill ${activeTab === 'inference' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('inference')}
          >
            Inference
          </button>
        </div>
      </header>

      <div className="prob-instrument-grid" style={{ marginBottom: '2.5rem' }}>
        <div className="prob-venn-panel apple-glass-card">
          <svg className="prob-venn-svg" viewBox="0 0 400 280" aria-label="Interactive Venn Diagram">
            <defs>
              <linearGradient id="vennGradA" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#2563eb" stopOpacity="0.15" />
              </linearGradient>
              <linearGradient id="vennGradB" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.15" />
              </linearGradient>
              <linearGradient id="vennGradAB" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.45" />
                <stop offset="100%" stopColor="#059669" stopOpacity="0.35" />
              </linearGradient>
            </defs>

            {/* Circle A */}
            <circle 
              cx={160 - (sliderA - 0.4) * 20} 
              cy="140" 
              r={75 + sliderA * 30} 
              fill="url(#vennGradA)" 
              stroke="#3b82f6" 
              strokeWidth="2" 
            />
            {/* Circle B */}
            <circle 
              cx={240 + (sliderB - 0.4) * 20} 
              cy="140" 
              r={75 + sliderB * 30} 
              fill="url(#vennGradB)" 
              stroke="#8b5cf6" 
              strokeWidth="2" 
            />

            {/* Intersection Highlight */}
            <path 
              d={`M 200,${140 - Math.min(sliderA, sliderB) * 60} A ${75 + sliderA * 30} ${75 + sliderA * 30} 0 0 1 200,${140 + Math.min(sliderA, sliderB) * 60} A ${75 + sliderB * 30} ${75 + sliderB * 30} 0 0 1 200,${140 - Math.min(sliderA, sliderB) * 60}`}
              fill="url(#vennGradAB)"
              stroke="#10b981"
              strokeWidth="1.5"
            />

            {/* Labels */}
            <text x="120" y="145" textAnchor="middle" fill="#1e40af" fontWeight="700" fontSize="14" fontFamily="sans-serif">
              Event A
            </text>
            <text x="120" y="165" textAnchor="middle" fill="#64748b" fontSize="11" fontFamily="monospace">
              P(A) = {sliderA.toFixed(2)}
            </text>

            <text x="280" y="145" textAnchor="middle" fill="#5b21b6" fontWeight="700" fontSize="14" fontFamily="sans-serif">
              Event B
            </text>
            <text x="280" y="165" textAnchor="middle" fill="#64748b" fontSize="11" fontFamily="monospace">
              P(B) = {sliderB.toFixed(2)}
            </text>

            <text x="200" y="138" textAnchor="middle" fill="#065f46" fontWeight="700" fontSize="12" fontFamily="sans-serif">
              A ∩ B
            </text>
            <text x="200" y="154" textAnchor="middle" fill="#047857" fontWeight="600" fontSize="11" fontFamily="monospace">
              {sliderAB.toFixed(2)}
            </text>
          </svg>
        </div>

        <div className="prob-controls-panel apple-glass-card">
          <div className="prob-formula-card">
            <div className="prob-formula-math">
              P(A|B) = P(A ∩ B) / P(B)
            </div>
            <p className="prob-formula-caption">
              The probability of event A occurring given that event B has already occurred.
            </p>
          </div>

          <div className="prob-slider-group">
            <div className="prob-slider-row">
              <div className="prob-slider-labels">
                <span>P(A) — Event A</span>
                <span>{sliderA.toFixed(2)}</span>
              </div>
              <input 
                type="range" 
                className="prob-slider" 
                min="0.05" 
                max="0.95" 
                step="0.05" 
                value={sliderA} 
                onChange={(e) => handleSliderA(Number(e.target.value))} 
              />
            </div>

            <div className="prob-slider-row">
              <div className="prob-slider-labels">
                <span>P(B) — Event B</span>
                <span>{sliderB.toFixed(2)}</span>
              </div>
              <input 
                type="range" 
                className="prob-slider" 
                min="0.05" 
                max="0.95" 
                step="0.05" 
                value={sliderB} 
                onChange={(e) => handleSliderB(Number(e.target.value))} 
              />
            </div>

            <div className="prob-slider-row">
              <div className="prob-slider-labels">
                <span>P(A ∩ B) — Overlap</span>
                <span>{sliderAB.toFixed(2)}</span>
              </div>
              <input 
                type="range" 
                className="prob-slider" 
                min="0.01" 
                max={Math.min(sliderA, sliderB)} 
                step="0.01" 
                value={sliderAB} 
                onChange={(e) => handleSliderAB(Number(e.target.value))} 
              />
            </div>
          </div>

          <div className="prob-results-row">
            <div className="prob-result-pill">
              <span>P(A|B)</span>
              <strong>{calcPAGivenB}</strong>
            </div>
            <div className="prob-result-pill">
              <span>P(B|A)</span>
              <strong>{calcPBGivenA}</strong>
            </div>
          </div>
        </div>
      </div>

      <WorkbenchTaskPicker
        value={mode}
        options={TASK_OPTIONS}
        disabled={!hydrated}
        onChange={(value) => { if (isMode(value)) selectMode(value); }}
      />

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
