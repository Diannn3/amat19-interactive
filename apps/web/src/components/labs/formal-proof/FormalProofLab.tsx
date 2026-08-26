import { useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, Lightbulb, Plus, RotateCcw, Trash2 } from 'lucide-react';
import {
  PROOF_RULES,
  proofReachesConclusion,
  validateProofLine,
  type CheckedProofLine,
  type ProofRuleId
} from '@amat19/domain-logic';
import { Button } from '../../ui/Button';
import { Feedback } from '../../ui/Feedback';
import { loadDraft, saveDraft } from '../../../lib/draft';
import { recordAttempt, recordSkillEvidence } from '../../../lib/local-progress';

const LAB_ID = 'logic.formal-proof';
const CONTENT_VERSION = '2';

const PREMISES = ['A -> B', '~B', 'C'];
const CONCLUSION = '~A & C';

function startingLines(): CheckedProofLine[] {
  const lines: CheckedProofLine[] = [];
  for (const expression of PREMISES) {
    lines.push(validateProofLine(lines, { expression, ruleId: 'Premise', references: [] }));
  }
  return lines;
}

type Draft = { lines: CheckedProofLine[]; hintLevel?: number };

const HINTS = [
  'Look for a cited conditional whose consequent is contradicted by another premise.',
  'Premises 1 and 2 fit Modus Tollens, which can derive ∼A.',
  'Once ∼A is available, combine it with premise C using Conjunction.'
];

export default function FormalProofLab() {
  const [lines, setLines] = useState<CheckedProofLine[]>(startingLines);
  const [expression, setExpression] = useState('');
  const [ruleId, setRuleId] = useState<ProofRuleId>('MT');
  const [references, setReferences] = useState('1, 2');
  const [restored, setRestored] = useState(false);
  const [hintLevel, setHintLevel] = useState(0);
  const recordedRef = useRef(false);

  useEffect(() => {
    loadDraft<Draft>(LAB_ID, CONTENT_VERSION).then((draft) => {
      if (draft?.lines && draft.lines.length >= PREMISES.length) setLines(draft.lines);
      if (draft?.hintLevel) setHintLevel(Math.min(draft.hintLevel, HINTS.length));
      setRestored(true);
    });
  }, []);

  useEffect(() => {
    if (!restored) return;
    const timer = window.setTimeout(() => void saveDraft(LAB_ID, CONTENT_VERSION, { lines, hintLevel }), 250);
    return () => window.clearTimeout(timer);
  }, [lines, hintLevel, restored]);

  const complete = useMemo(() => proofReachesConclusion(lines, CONCLUSION), [lines]);

  useEffect(() => {
    if (!complete || recordedRef.current) return;
    recordedRef.current = true;
    const score = Math.max(0.7, 1 - hintLevel * 0.08);
    void Promise.all([
      recordAttempt({ prefix:'formal-proof', exerciseId:'logic.formal-proof.direct-1', module:'logic', finalState:'correct', payload:{ lines, hintsUsed:hintLevel } }),
      recordSkillEvidence('logic.formal-proof', score)
    ]).catch(() => undefined);
  }, [complete, hintLevel, lines]);

  function parseReferences(): number[] {
    if (!references.trim()) return [];
    return references.split(',').map((part) => Number(part.trim())).filter((value) => Number.isFinite(value));
  }

  function addLine() {
    if (!expression.trim()) return;
    const checked = validateProofLine(lines, { expression, ruleId, references: parseReferences() });
    setLines((current) => [...current, checked]);
    if (checked.ok) setExpression('');
  }

  function reset() {
    setLines(startingLines());
    setExpression('');
    setRuleId('MT');
    setReferences('1, 2');
    setHintLevel(0);
    recordedRef.current = false;
  }

  const selectableRules = PROOF_RULES.filter((rule) => rule.id !== 'Premise' && rule.id !== 'PA' && rule.id !== 'CP' && rule.id !== 'IP');

  return (
    <section className="proof-lab" data-testid="formal-proof-lab">
      <header className="proof-lab__goal">
        <div>
          <p className="section-label">Direct proof · production-ready</p>
          <h2>Derive the goal one justified line at a time.</h2>
          <p>Every accepted line must follow from its cited earlier lines under the exact AMAT rule you select.</p>
        </div>
        <div className="goal-card" aria-label="Current proof goal">
          <span>Goal</span>
          <strong>{CONCLUSION}</strong>
        </div>
      </header>

      <div className="proof-table-wrap">
        <table className="proof-table">
          <caption className="sr-only">Formal proof lines with statements, justifications, references, and validation status.</caption>
          <thead><tr><th>#</th><th>Statement</th><th>Justification</th><th>Status</th></tr></thead>
          <tbody>
            {lines.map((line) => (
              <tr key={line.lineNumber} data-valid={line.ok}>
                <th scope="row">{line.lineNumber}</th>
                <td className="logic-expression">{line.expression}</td>
                <td>{line.ruleId}{line.references.length ? ` · ${line.references.join(', ')}` : ''}</td>
                <td>
                  <span className="proof-status" data-valid={line.ok}>{line.ok ? 'Valid' : 'Needs revision'}</span>
                  {!line.ok && <small>{line.message}</small>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {complete && (
        <Feedback tone="success">
          <CheckCircle2 size={18} aria-hidden="true" />
          <strong>QED.</strong> The last valid line matches the goal.
        </Feedback>
      )}

      <form className="proof-editor" onSubmit={(event) => { event.preventDefault(); addLine(); }}>
        <div className="proof-editor__statement">
          <label className="form-field">
            <span className="form-field__label">Next statement</span>
            <input
              className="text-input logic-input"
              value={expression}
              onChange={(event) => setExpression(event.target.value)}
              placeholder="e.g. ~A"
              aria-label="Next proof statement"
            />
            <span className="form-field__hint">Aliases: ~ / ¬, & / ∧, | / ∨, -&gt; / →, &lt;-&gt; / ↔</span>
          </label>
        </div>
        <label className="form-field">
          <span className="form-field__label">Rule</span>
          <select className="select-input" value={ruleId} onChange={(event) => setRuleId(event.target.value as ProofRuleId)} aria-label="Proof rule">
            {selectableRules.map((rule) => <option key={rule.id} value={rule.id}>{rule.id} · {rule.name}</option>)}
          </select>
        </label>
        <label className="form-field">
          <span className="form-field__label">Cited lines</span>
          <input className="text-input" value={references} onChange={(event) => setReferences(event.target.value)} placeholder="1, 2" aria-label="Cited line numbers" />
          <span className="form-field__hint">Only earlier valid lines can be cited.</span>
        </label>
        <div className="action-row proof-editor__actions">
          <Button variant="primary" type="submit" disabled={!expression.trim()}><Plus size={16} aria-hidden="true" /> Add checked line</Button>
          {lines.length > PREMISES.length && (
            <Button variant="ghost" type="button" onClick={() => setLines((current) => current.slice(0, -1))}>
              <Trash2 size={16} aria-hidden="true" /> Undo last line
            </Button>
          )}
          <Button variant="ghost" type="button" onClick={reset}><RotateCcw size={16} aria-hidden="true" /> Reset proof</Button>
        </div>
      </form>


      <div className="proof-hints" aria-live="polite">
        <div className="action-row">
          <Button variant="ghost" type="button" disabled={hintLevel >= HINTS.length} onClick={() => setHintLevel((level) => Math.min(HINTS.length, level + 1))}>
            <Lightbulb size={16} aria-hidden="true" /> {hintLevel === 0 ? 'Reveal one hint' : 'Reveal next hint'}
          </Button>
          {hintLevel > 0 && <span>{hintLevel}/{HINTS.length} hints revealed</span>}
        </div>
        {hintLevel > 0 && <ol>{HINTS.slice(0, hintLevel).map((hint) => <li key={hint}>{hint}</li>)}</ol>}
      </div>

      <aside className="proof-reference">
        <p className="section-label">Rule reference</p>
        <div className="rule-grid">
          {PROOF_RULES.filter((rule) => rule.family !== 'method').map((rule) => (
            <details key={rule.id}>
              <summary><strong>{rule.id}</strong> · {rule.name}</summary>
              <p>{rule.description}</p>
            </details>
          ))}
        </div>
        <details className="experimental-note">
          <summary>Conditional and indirect proof status</summary>
          <p>
            Direct proof is fully checked in this pass. Conditional and indirect proof require reference-scope
            enforcement before they can be learner-facing, so they remain deliberately disabled rather than accepting
            invalid cross-scope citations.
          </p>
        </details>
      </aside>
    </section>
  );
}
