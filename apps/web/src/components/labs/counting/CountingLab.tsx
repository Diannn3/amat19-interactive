import { useEffect, useMemo, useState } from 'react';
import {
  arrangementsWithRepetition,
  combinations,
  combinationsWithRepetition,
  inclusionExclusion2,
  permutations,
  recommendCountingMethod
} from '@amat19/domain-probability';
import { Button } from '../../ui/Button';
import { Feedback } from '../../ui/Feedback';
import { recordAttempt, recordSkillEvidence } from '../../../lib/local-progress';
import { loadDraft, saveDraft } from '../../../lib/draft';
import { usePersistenceFlush } from '../../../lib/use-persistence-flush';

type Method = 'permutation' | 'combination' | 'arrangements-with-repetition' | 'combination-with-repetition';

function exactCount(method: Method, n: number, r: number): bigint | undefined {
  if (method === 'permutation') return permutations(n, r);
  if (method === 'combination') return combinations(n, r);
  if (method === 'arrangements-with-repetition') return arrangementsWithRepetition(n, r);
  if (method === 'combination-with-repetition') return combinationsWithRepetition(n, r);
  return undefined;
}

const LAB_ID = 'probability.counting';
const CONTENT_VERSION = '2';
type CountingDraft = { orderMatters:boolean; repetitionAllowed:boolean; n:number; r:number; a:number; b:number; intersection:number };

export default function CountingLab() {
  const [orderMatters, setOrderMatters] = useState(true);
  const [repetitionAllowed, setRepetitionAllowed] = useState(false);
  const [n, setN] = useState(8);
  const [r, setR] = useState(3);
  const [prediction, setPrediction] = useState<Method>();
  const [revealed, setRevealed] = useState(false);
  const [restored, setRestored] = useState(false);
  const decision = useMemo(() => recommendCountingMethod({ orderMatters, repetitionAllowed }), [orderMatters, repetitionAllowed]);

  const result = useMemo(() => {
    try {
      return { value: exactCount(decision.method, n, r), error: undefined };
    } catch (error) {
      return { value: undefined, error: error instanceof Error ? error.message : 'The count is not defined for these values.' };
    }
  }, [decision.method, n, r]);

  const correct = prediction === decision.method;

  async function check() {
    if (!prediction) return;
    setRevealed(true);
    await Promise.all([
      recordAttempt({ prefix:'counting', exerciseId:'probability.counting.method', module:'probability', finalState: correct ? 'correct' : 'incomplete', payload:{ orderMatters,repetitionAllowed,n,r,prediction,expected:decision.method } }),
      recordSkillEvidence('probability.counting', correct ? 1 : 0)
    ]).catch(() => undefined);
  }

  const [a, setA] = useState(18);
  const [b, setB] = useState(13);
  const [intersection, setIntersection] = useState(5);
  const union = useMemo(() => {
    try { return { value: inclusionExclusion2(a, b, intersection), error: undefined }; }
    catch (error) { return { value: undefined, error: error instanceof Error ? error.message : 'Invalid set counts.' }; }
  }, [a, b, intersection]);

  useEffect(() => {
    loadDraft<CountingDraft>(LAB_ID, CONTENT_VERSION).then((draft) => {
      if (draft) { setOrderMatters(draft.orderMatters); setRepetitionAllowed(draft.repetitionAllowed); setN(draft.n); setR(draft.r); setA(draft.a); setB(draft.b); setIntersection(draft.intersection); }
      setRestored(true);
    });
  }, []);

  useEffect(() => {
    if (!restored) return;
    const timer = window.setTimeout(() => void saveDraft(LAB_ID, CONTENT_VERSION, { orderMatters,repetitionAllowed,n,r,a,b,intersection }), 300);
    return () => window.clearTimeout(timer);
  }, [restored,orderMatters,repetitionAllowed,n,r,a,b,intersection]);

  usePersistenceFlush(() => saveDraft(LAB_ID, CONTENT_VERSION, { orderMatters,repetitionAllowed,n,r,a,b,intersection }), restored);

  return (
    <section className="learning-lab learning-lab--wide" data-testid="counting-lab" data-hydrated={restored?'true':undefined}>
      <div className="learning-lab__prompt">
        <h2>Choose the model before touching the formula.</h2>
        <p className="section-context">Counting decision helper</p>
        <p className="learning-lab__question">
          You have <strong>{n}</strong> available choices and need to fill/select <strong>{r}</strong> positions or objects.
          Describe what creates a new outcome.
        </p>

        <fieldset className="toggle-question">
          <legend>Does order matter?</legend>
          <label><input type="radio" checked={orderMatters} onChange={() => { setOrderMatters(true); setRevealed(false); }} /> Yes — changing order creates a new outcome</label>
          <label><input type="radio" checked={!orderMatters} onChange={() => { setOrderMatters(false); setRevealed(false); }} /> No — only the chosen group matters</label>
        </fieldset>
        <fieldset className="toggle-question">
          <legend>Can the same choice be used again?</legend>
          <label><input type="radio" checked={repetitionAllowed} onChange={() => { setRepetitionAllowed(true); setRevealed(false); }} /> Yes</label>
          <label><input type="radio" checked={!repetitionAllowed} onChange={() => { setRepetitionAllowed(false); setRevealed(false); }} /> No</label>
        </fieldset>

        <div className="number-pair">
          <label className="form-field"><span className="form-field__label">Available choices, n</span><input className="text-input" type="number" min="0" value={n} onChange={(e) => setN(Number(e.target.value))} /></label>
          <label className="form-field"><span className="form-field__label">Selected/filled, r</span><input className="text-input" type="number" min="0" value={r} onChange={(e) => setR(Number(e.target.value))} /></label>
        </div>

        <fieldset className="prediction-fieldset">
          <legend>Predict the method</legend>
          {[
            ['permutation', 'Permutation nPr'],
            ['combination', 'Combination nCr'],
            ['arrangements-with-repetition', 'Ordered selections with repetition'],
            ['combination-with-repetition', 'Combination with repetition']
          ].map(([value, label]) => (
            <label key={value}><input type="radio" name="counting-method" checked={prediction === value} onChange={() => { setPrediction(value as Method); setRevealed(false); }} /> {label}</label>
          ))}
        </fieldset>
        <Button variant="primary" type="button" disabled={!prediction} onClick={check}>Check method</Button>
      </div>

      <aside className="learning-lab__explain">
        <p className="section-label">Reasoning trace</p>
        {!revealed && <p>Answer the structural questions first. The formula appears only after you commit to a method.</p>}
        {revealed && (
          <>
            <Feedback tone={correct ? 'success' : 'error'} role={correct ? 'status' : 'alert'}>
              <strong>{correct ? 'Correct method.' : 'Reconsider the model.'}</strong> {decision.reason}
            </Feedback>
            <div className="formula-callout">
              <span>{decision.label}</span>
              {decision.method === 'permutation' && <strong>P({n}, {r}) = {result.value?.toString() ?? '—'}</strong>}
              {decision.method === 'combination' && <strong>C({n}, {r}) = {result.value?.toString() ?? '—'}</strong>}
              {decision.method === 'arrangements-with-repetition' && <strong>{n}^{r} = {result.value?.toString() ?? '—'}</strong>}
              {decision.method === 'combination-with-repetition' && <strong>C({n} + {r} − 1, {r}) = {result.value?.toString() ?? '—'}</strong>}
            </div>
            {result.error && <Feedback tone="error" role="alert">{result.error}</Feedback>}
            {(
              <div className="slot-visual" aria-label={`${r} positions`}>
                {Array.from({ length: Math.min(r, 10) }, (_, index) => <span key={index}>slot {index + 1}</span>)}
                {r > 10 && <span>… {r - 10} more</span>}
              </div>
            )}
          </>
        )}
      </aside>

      <div className="learning-lab__full" id="inclusion-exclusion">
        <section className="sub-lab">
          <div>
            <h2>Subtract the overlap once.</h2>
            <p className="section-context">Inclusion–exclusion</p>
            <p>When A and B overlap, |A| + |B| counts the intersection twice. The union is |A| + |B| − |A∩B|.</p>
          </div>
          <div className="number-triple">
            <label className="form-field"><span className="form-field__label">|A|</span><input className="text-input" type="number" min="0" value={a} onChange={(e) => setA(Number(e.target.value))} /></label>
            <label className="form-field"><span className="form-field__label">|B|</span><input className="text-input" type="number" min="0" value={b} onChange={(e) => setB(Number(e.target.value))} /></label>
            <label className="form-field"><span className="form-field__label">|A ∩ B|</span><input className="text-input" type="number" min="0" value={intersection} onChange={(e) => setIntersection(Number(e.target.value))} /></label>
          </div>
          {union.error ? <Feedback tone="error" role="alert">{union.error}</Feedback> : <div className="formula-callout"><span>|A ∪ B|</span><strong>{a} + {b} − {intersection} = {union.value?.toString()}</strong></div>}
        </section>
      </div>
    </section>
  );
}
