import {
  checkArgumentValidity,
  evaluateLogic,
  generateAssignments,
  parseLogic,
  type Assignment,
  type LogicNode
} from '@amat19/domain-logic';
import { AlertTriangle, CheckCircle2, Plus, RotateCcw, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { Button } from '../../ui/Button';
import { Feedback } from '../../ui/Feedback';
import { loadDraft, saveDraft } from '../../../lib/draft';
import { createAttemptId, recordAssessmentResult } from '../../../lib/local-progress';
import { argumentProblemFingerprint } from '../../../lib/problem-fingerprint';
import { usePersistenceFlush } from '../../../lib/use-persistence-flush';
import { argumentReducer, initialArgumentState, type ArgumentState } from './argument-state';

const LAB_ID = 'logic.argument-validity';
const CONTENT_VERSION = '2';

function tf(value: boolean): 'T' | 'F' { return value ? 'T' : 'F'; }

type ParsedArgument = {
  premises: LogicNode[];
  conclusion: LogicNode;
  symbols: string[];
  counterexamples: Assignment[];
  valid: boolean;
};

export function ArgumentMode() {
  const [state, dispatch] = useReducer(argumentReducer, initialArgumentState);
  const [restored, setRestored] = useState(false);

  useEffect(() => {
    loadDraft<ArgumentState>(LAB_ID, CONTENT_VERSION).then((draft) => {
      if (draft?.premises?.length && typeof draft.conclusion === 'string') dispatch({ type: 'restore', state: draft });
      setRestored(true);
    });
  }, []);

  useEffect(() => {
    if (!restored) return;
    const timer = window.setTimeout(() => void saveDraft(LAB_ID, CONTENT_VERSION, state), 300);
    return () => window.clearTimeout(timer);
  }, [state, restored]);

  usePersistenceFlush(() => saveDraft(LAB_ID, CONTENT_VERSION, state), restored);

  const parsed = useMemo<{ value?: ParsedArgument; error?: string; premiseErrors: Record<number, string>; conclusionError?: string }>(() => {
    const premiseErrors: Record<number, string> = {};
    const premiseNodes: LogicNode[] = [];
    state.premises.forEach((premise, index) => {
      if (!premise.trim()) { premiseErrors[index] = 'Enter a premise or remove this row.'; return; }
      try { premiseNodes.push(parseLogic(premise)); }
      catch (error) { premiseErrors[index] = error instanceof Error ? error.message : 'Invalid premise.'; }
    });
    let conclusionNode: LogicNode | undefined;
    let conclusionError: string | undefined;
    try { conclusionNode = parseLogic(state.conclusion); }
    catch (error) { conclusionError = error instanceof Error ? error.message : 'Invalid conclusion.'; }

    if (Object.keys(premiseErrors).length || !conclusionNode) {
      return { error: 'Fix the marked expression before checking validity.', premiseErrors, conclusionError };
    }

    try {
      const result = checkArgumentValidity(state.premises, state.conclusion);
      return {
        value: { premises: premiseNodes, conclusion: conclusionNode, symbols: result.symbols, counterexamples: result.counterexamples, valid: result.valid },
        premiseErrors,
        conclusionError
      };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'The argument could not be parsed.', premiseErrors, conclusionError };
    }
  }, [state.premises, state.conclusion]);

  const rows = parsed.value ? generateAssignments(parsed.value.symbols) : [];
  const counterexampleKeys = new Set(parsed.value?.counterexamples.map((assignment) => JSON.stringify(assignment)) ?? []);
  const predictionCorrect = parsed.value && state.prediction ? (state.prediction === 'valid') === parsed.value.valid : false;
  const incorrectAttemptsRef = useRef(0);
  const attemptIdRef = useRef(createAttemptId('argument-validity'));
  const startedAtRef = useRef(new Date().toISOString());
  const problemFingerprint = parsed.value ? argumentProblemFingerprint(parsed.value.premises, parsed.value.conclusion) : undefined;

  useEffect(() => { incorrectAttemptsRef.current = 0; attemptIdRef.current=createAttemptId('argument-validity'); startedAtRef.current=new Date().toISOString(); }, [problemFingerprint]);

  async function reveal() {
    if (!parsed.value || !state.prediction) return;
    const wrongBefore = incorrectAttemptsRef.current;
    if (!predictionCorrect) incorrectAttemptsRef.current += 1;
    dispatch({ type: 'reveal' });
    await recordAssessmentResult({
      prefix: 'argument-validity',
      attemptId: attemptIdRef.current,
      startedAt: startedAtRef.current,
      exerciseId: 'logic.argument.validity',
      problemFingerprint: problemFingerprint!,
      module: 'logic',
      skillId: 'logic.argument.validity',
      result: predictionCorrect ? 'correct' : 'incorrect',
      firstAttemptCorrect: Boolean(predictionCorrect) && wrongBefore === 0,
      incorrectAttempts: incorrectAttemptsRef.current,
      hintsUsed: 0,
      revealsUsed: 0,
      difficulty: 'standard',
      payload: { premises: state.premises, conclusion: state.conclusion, prediction: state.prediction, valid: parsed.value.valid },
    }).catch(() => undefined);
  }

  return (
    <section className="truth-lab__argument" aria-labelledby="argument-heading" data-testid="argument-validity">
      <div className="truth-lab__argument-builder">
        <h2 id="argument-heading">Look for one counterexample.</h2>
        <p className="truth-lab__section-label">Argument mode</p>
        <p>
          An argument is invalid exactly when at least one row makes <strong>every premise true</strong> and the
          <strong> conclusion false</strong>. The default example is original to this app.
        </p>

        <div className="truth-lab__argument-inputs">
          {state.premises.map((premise, index) => (
            <label key={index} className="form-field">
              <span className="form-field__label">Premise {index + 1}</span>
              <span className="truth-lab__argument-input-row">
                <input className="truth-lab__input" value={premise} onChange={(event) => dispatch({ type: 'set-premise', index, value: event.target.value })} aria-label={`Premise ${index + 1}`} aria-invalid={Boolean(parsed.premiseErrors[index])} />
                {state.premises.length > 1 && (
                  <Button variant="ghost" type="button" aria-label={`Remove premise ${index + 1}`} onClick={() => dispatch({ type: 'remove-premise', index })}>
                    <Trash2 size={17} aria-hidden="true" />
                  </Button>
                )}
              </span>
              {parsed.premiseErrors[index] && <span className="form-field__error" role="alert">{parsed.premiseErrors[index]}</span>}
            </label>
          ))}
          <Button variant="ghost" type="button" onClick={() => dispatch({ type: 'add-premise' })}><Plus size={16} aria-hidden="true" /> Add premise</Button>
          <label className="form-field">
            <span className="form-field__label">Conclusion</span>
            <input className="truth-lab__input" value={state.conclusion} onChange={(event) => dispatch({ type: 'set-conclusion', value: event.target.value })} aria-label="Conclusion" aria-invalid={Boolean(parsed.conclusionError)} />
            {parsed.conclusionError && <span className="form-field__error" role="alert">{parsed.conclusionError}</span>}
          </label>
        </div>

        {parsed.error && <Feedback tone="error" role="alert">{parsed.error}</Feedback>}

        {parsed.value && (
          <>
            <fieldset className="prediction-fieldset">
              <legend>Predict the argument</legend>
              <label><input type="radio" name="argument-prediction" checked={state.prediction === 'valid'} onChange={() => dispatch({ type: 'predict', value: 'valid' })} /> Valid</label>
              <label><input type="radio" name="argument-prediction" checked={state.prediction === 'invalid'} onChange={() => dispatch({ type: 'predict', value: 'invalid' })} /> Invalid</label>
            </fieldset>
            <div className="action-row">
              <Button variant="primary" type="button" disabled={!state.prediction} onClick={reveal}>Check prediction</Button>
              <Button variant="ghost" type="button" onClick={() => dispatch({ type: 'reset' })}><RotateCcw size={16} aria-hidden="true" /> Reset original example</Button>
            </div>
          </>
        )}

        {state.revealed && parsed.value && (
          <div className="truth-lab__argument-verdict" data-valid={parsed.value.valid} role="status">
            {parsed.value.valid ? <CheckCircle2 aria-hidden="true" /> : <AlertTriangle aria-hidden="true" />}
            <span>
              <strong>{parsed.value.valid ? 'Valid argument' : 'Invalid argument'}</strong>
              {parsed.value.valid ? ' — no row has all premises true and the conclusion false.' : ` — ${parsed.value.counterexamples.length} counterexample row${parsed.value.counterexamples.length === 1 ? '' : 's'} found.`}
              {!predictionCorrect && ' Your prediction did not match the counterexample test.'}
            </span>
          </div>
        )}
      </div>

      {state.revealed && parsed.value && (
        <div className="truth-table-scroll" tabIndex={0} aria-label="Argument validity truth table">
          <table className="truth-table truth-table--argument">
            <caption className="sr-only">Truth table for the current argument. Counterexample rows are marked.</caption>
            <thead>
              <tr>
                {parsed.value.symbols.map((symbol) => <th scope="col" key={symbol}>{symbol}</th>)}
                {state.premises.map((premise, index) => <th scope="col" key={`p-${index}`}>Premise {index + 1}<br /><small>{premise}</small></th>)}
                <th scope="col">Conclusion<br /><small>{state.conclusion}</small></th>
                <th scope="col">Validity test</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((assignment, rowIndex) => {
                const premiseValues = parsed.value!.premises.map((premise) => evaluateLogic(premise, assignment).value);
                const conclusionValue = evaluateLogic(parsed.value!.conclusion, assignment).value;
                const isCounterexample = counterexampleKeys.has(JSON.stringify(assignment));
                return (
                  <tr key={rowIndex} data-counterexample={isCounterexample}>
                    {parsed.value!.symbols.map((symbol) => <td key={symbol}>{tf(assignment[symbol]!)}</td>)}
                    {premiseValues.map((value, index) => <td key={`pv-${index}`}>{tf(value)}</td>)}
                    <td>{tf(conclusionValue)}</td>
                    <td>{isCounterexample ? <strong>Counterexample</strong> : '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
