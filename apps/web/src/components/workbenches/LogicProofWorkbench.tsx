import {
  buildTruthTable,
  checkArgumentValidity,
  checkEquivalence,
  formatLogic,
  type Assignment,
  type TruthTable,
} from '@amat19/domain-logic';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '../ui/Button';
import { Feedback } from '../ui/Feedback';
import { loadDraft, saveDraft } from '../../lib/draft';
import { usePersistenceFlush } from '../../lib/use-persistence-flush';
import { readWorkbenchOption } from '../../lib/workbench-route';
import {
  checkLogicTranslation,
  LOGIC_TRANSLATION_PROMPTS,
  type LogicTranslationFeedback,
  type LogicTranslationPrompt,
} from '../../lib/logic-translation';
import FormalProofLab from '../labs/formal-proof/FormalProofLab';

type Mode = 'translate' | 'table' | 'compare' | 'argument' | 'proof';
type Draft = {
  mode: Mode;
  expression: string;
  left: string;
  right: string;
  premises: string;
  conclusion: string;
  translationPromptId?: LogicTranslationPrompt['id'];
  translationAnswer?: string;
};

const LAB_ID = 'workbench.logic-proof';
const CONTENT_VERSION = '1';
const INITIAL_DRAFT: Draft = {
  mode: 'table',
  expression: 'P -> Q',
  left: 'P -> Q',
  right: '~Q -> ~P',
  premises: 'P -> Q\nQ',
  conclusion: 'P',
  translationPromptId: 'if-then',
  translationAnswer: '',
};

const MODES: Array<{ id: Mode; label: string }> = [
  { id: 'translate', label: 'Translate' },
  { id: 'table', label: 'Truth table' },
  { id: 'compare', label: 'Compare' },
  { id: 'argument', label: 'Argument' },
  { id: 'proof', label: 'Guided proof' },
];

function message(error: unknown): string {
  return error instanceof Error ? error.message : 'The logic expression could not be analyzed.';
}

function assignmentText(symbols: string[], assignment?: Assignment): string {
  if (!assignment) return '';
  return symbols.map((symbol) => `${symbol}=${assignment[symbol] ? 'T' : 'F'}`).join(', ');
}

function truthTableAnalysis(expression: string): { table?: TruthTable; formatted?: string; error?: string } {
  try {
    const table = buildTruthTable(expression);
    return { table, formatted: formatLogic(table.ast) };
  } catch (error) {
    return { error: message(error) };
  }
}

export default function LogicProofWorkbench() {
  const [hydrated, setHydrated] = useState(false);
  const [mode, setMode] = useState<Mode>(INITIAL_DRAFT.mode);
  const [expression, setExpression] = useState(INITIAL_DRAFT.expression);
  const [left, setLeft] = useState(INITIAL_DRAFT.left);
  const [right, setRight] = useState(INITIAL_DRAFT.right);
  const [premises, setPremises] = useState(INITIAL_DRAFT.premises);
  const [conclusion, setConclusion] = useState(INITIAL_DRAFT.conclusion);
  const [argumentChecked, setArgumentChecked] = useState(false);
  const [translationPromptId, setTranslationPromptId] = useState<LogicTranslationPrompt['id']>(INITIAL_DRAFT.translationPromptId!);
  const [translationAnswer, setTranslationAnswer] = useState(INITIAL_DRAFT.translationAnswer!);
  const [translationFeedback, setTranslationFeedback] = useState<LogicTranslationFeedback>();
  const [translationRevealed, setTranslationRevealed] = useState(false);

  useEffect(() => {
    let active = true;
    const requestedMode = readWorkbenchOption('mode', MODES.map((item) => item.id));
    loadDraft<Draft>(LAB_ID, CONTENT_VERSION).then((draft) => {
      if (!active) return;
      if (draft) {
        setMode(requestedMode ?? draft.mode);
        setExpression(draft.expression);
        setLeft(draft.left);
        setRight(draft.right);
        setPremises(draft.premises);
        setConclusion(draft.conclusion);
        setTranslationPromptId(draft.translationPromptId ?? INITIAL_DRAFT.translationPromptId!);
        setTranslationAnswer(draft.translationAnswer ?? '');
      }
      if (!draft && requestedMode) setMode(requestedMode);
      setHydrated(true);
    }).catch(() => setHydrated(true));
    return () => { active = false; };
  }, []);

  const draft = useMemo<Draft>(() => ({ mode, expression, left, right, premises, conclusion, translationPromptId, translationAnswer }), [mode, expression, left, right, premises, conclusion, translationPromptId, translationAnswer]);
  useEffect(() => {
    if (!hydrated) return;
    const timer = window.setTimeout(() => { void saveDraft(LAB_ID, CONTENT_VERSION, draft); }, 250);
    return () => window.clearTimeout(timer);
  }, [draft, hydrated]);
  usePersistenceFlush(() => saveDraft(LAB_ID, CONTENT_VERSION, draft), hydrated);

  const tableAnalysis = useMemo(() => truthTableAnalysis(expression), [expression]);
  const comparison = useMemo(() => {
    try {
      return { result: checkEquivalence(left, right), error: undefined };
    } catch (error) {
      return { result: undefined, error: message(error) };
    }
  }, [left, right]);
  const argument = useMemo(() => {
    try {
      const premiseList = premises.split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
      if (premiseList.length === 0) throw new Error('Enter at least one premise, one per line.');
      return { result: checkArgumentValidity(premiseList, conclusion), error: undefined };
    } catch (error) {
      return { result: undefined, error: message(error) };
    }
  }, [premises, conclusion]);

  const translationPrompt = LOGIC_TRANSLATION_PROMPTS.find((item) => item.id === translationPromptId) ?? LOGIC_TRANSLATION_PROMPTS[0]!;

  function selectMode(next: Mode) {
    setMode(next);
    setArgumentChecked(false);
    setTranslationFeedback(undefined);
    setTranslationRevealed(false);
  }

  function checkTranslation() {
    const feedback = checkLogicTranslation(translationAnswer, translationPrompt.expected);
    setTranslationFeedback(feedback);
    setTranslationRevealed(feedback.status === 'correct');
  }

  return (
    <section className="logic-workbench" data-testid="logic-proof-workbench" data-hydrated={hydrated ? 'true' : undefined}>
      <fieldset className="logic-workbench__mode-fieldset" disabled={!hydrated}>
        <legend className="sr-only">Choose a logic task</legend>
        <div className="logic-workbench__modes" role="group" aria-label="Logic task">
          {MODES.map((item) => (
            <button
              data-primary-control
              className="logic-workbench__mode"
              data-active={mode === item.id}
              type="button"
              aria-pressed={mode === item.id}
              key={item.id}
              onClick={() => selectMode(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </fieldset>

      {mode === 'translate' && (
        <section className="logic-workbench__stage" aria-labelledby="translation-heading">
          <header className="logic-workbench__header">
            <h2 id="translation-heading">Turn controlled language into symbols.</h2>
            <p>Read the relationship first, then write the proposition with the notation used in the course.</p>
          </header>
          <form className="logic-workbench__translation-form" onSubmit={(event) => { event.preventDefault(); checkTranslation(); }}>
            <fieldset disabled={!hydrated}>
              <legend className="sr-only">Controlled-language translation</legend>
              <label className="form-field"><span className="form-field__label">Statement to translate</span><select data-primary-control className="select-input" value={translationPrompt.id} onChange={(event) => { setTranslationPromptId(event.target.value as LogicTranslationPrompt['id']); setTranslationAnswer(''); setTranslationFeedback(undefined); setTranslationRevealed(false); }}>{LOGIC_TRANSLATION_PROMPTS.map((item) => <option key={item.id} value={item.id}>{item.sentence}</option>)}</select></label>
              <label className="form-field"><span className="form-field__label">Your symbolic form</span><input data-primary-control className="text-input logic-input" aria-label="Symbolic translation" value={translationAnswer} onChange={(event) => { setTranslationAnswer(event.target.value); setTranslationFeedback(undefined); setTranslationRevealed(false); }} placeholder="For example, P → Q" autoComplete="off" spellCheck={false} /></label>
              <Button data-primary-control variant="primary" type="submit">Check translation</Button>
            </fieldset>
          </form>
          <div data-logic-translation-feedback>{translationFeedback && <Feedback tone={translationFeedback.status === 'correct' ? 'success' : 'error'}>{translationFeedback.message}</Feedback>}</div>
          {translationRevealed && <div className="logic-workbench__translation-result" data-logic-translation-result><strong>Canonical form</strong><span>{translationPrompt.expected}</span><small>{translationPrompt.explanation}</small></div>}
        </section>
      )}

      {mode === 'table' && (
        <section className="logic-workbench__stage" aria-labelledby="truth-table-heading">
          <header className="logic-workbench__header">
            <h2 id="truth-table-heading">See every truth value.</h2>
            <p>Enter one proposition. The table keeps each subexpression visible so you can find the row that changes the result.</p>
          </header>
          <fieldset className="logic-workbench__controls" disabled={!hydrated}>
            <label className="form-field">
              <span className="form-field__label">Expression</span>
              <input
                data-primary-control
                className="text-input logic-input"
                aria-label="Logic expression"
                value={expression}
                onChange={(event) => setExpression(event.target.value)}
                autoComplete="off"
                spellCheck={false}
              />
              <span className="form-field__hint">Use ~, &amp;, |, -&gt;, &lt;-&gt; or ¬, ∧, ∨, →, ↔.</span>
            </label>
          </fieldset>
          {tableAnalysis.error ? (
            <Feedback tone="error" role="alert">{tableAnalysis.error}</Feedback>
          ) : tableAnalysis.table && tableAnalysis.formatted ? (
            <>
              <div className="logic-workbench__summary" role="status" aria-live="polite">
                <strong>{tableAnalysis.table.classification}</strong>
                <span>{tableAnalysis.table.rows.length} rows · {tableAnalysis.table.symbols.length} variables · {tableAnalysis.formatted}</span>
              </div>
              <TruthTable table={tableAnalysis.table} formatted={tableAnalysis.formatted} />
            </>
          ) : null}
        </section>
      )}

      {mode === 'compare' && (
        <section className="logic-workbench__stage" aria-labelledby="compare-heading">
          <header className="logic-workbench__header">
            <h2 id="compare-heading">Find the row that separates them.</h2>
            <p>Equivalent expressions agree on every assignment. A single counterexample settles a mismatch.</p>
          </header>
          <fieldset className="logic-workbench__compare-grid" disabled={!hydrated}>
            <legend className="sr-only">Expressions to compare</legend>
            <label className="form-field"><span className="form-field__label">Expression A</span><input data-primary-control className="text-input logic-input" value={left} onChange={(event) => setLeft(event.target.value)} /></label>
            <label className="form-field"><span className="form-field__label">Expression B</span><input data-primary-control className="text-input logic-input" value={right} onChange={(event) => setRight(event.target.value)} /></label>
          </fieldset>
          {comparison.error ? <Feedback tone="error" role="alert">{comparison.error}</Feedback> : comparison.result && (
            <div className="logic-workbench__verdict" data-valid={comparison.result.equivalent}>
              <strong>{comparison.result.equivalent ? 'Equivalent everywhere.' : 'Not equivalent.'}</strong>
              <span>{comparison.result.equivalent
                ? `All ${2 ** comparison.result.symbols.length} assignments agree.`
                : `Counterexample: ${assignmentText(comparison.result.symbols, comparison.result.counterexample)}`}</span>
            </div>
          )}
        </section>
      )}

      {mode === 'argument' && (
        <section className="logic-workbench__stage" aria-labelledby="argument-heading">
          <header className="logic-workbench__header">
            <h2 id="argument-heading">Try to make the conclusion false.</h2>
            <p>An argument is invalid exactly when all premises can be true while the conclusion is false.</p>
          </header>
          <fieldset className="logic-workbench__argument-grid" disabled={!hydrated}>
            <legend className="sr-only">Argument to test</legend>
            <label className="form-field"><span className="form-field__label">Premises · one per line</span><textarea data-primary-control className="text-input logic-input" rows={3} value={premises} onChange={(event) => { setPremises(event.target.value); setArgumentChecked(false); }} /></label>
            <label className="form-field"><span className="form-field__label">Conclusion</span><input data-primary-control className="text-input logic-input" value={conclusion} onChange={(event) => { setConclusion(event.target.value); setArgumentChecked(false); }} /></label>
            <Button data-primary-control variant="primary" type="button" onClick={() => setArgumentChecked(true)}>Check validity</Button>
          </fieldset>
          {argumentChecked && (argument.error ? <Feedback tone="error" role="alert">{argument.error}</Feedback> : argument.result && (
            <div className="logic-workbench__verdict" data-valid={argument.result.valid}>
              <strong>{argument.result.valid ? 'Valid argument.' : 'Invalid argument.'}</strong>
              <span>{argument.result.valid
                ? `No assignment among ${2 ** argument.result.symbols.length} possibilities makes every premise true and the conclusion false.`
                : `Falsifying assignment: ${assignmentText(argument.result.symbols, argument.result.counterexamples[0])}`}</span>
            </div>
          ))}
        </section>
      )}

      {mode === 'proof' && <div className="logic-workbench__proof"><FormalProofLab /></div>}

      {mode !== 'proof' && (
        <details className="logic-workbench__notation">
          <summary>Read the notation</summary>
          <dl>
            <div><dt>¬P</dt><dd>not P</dd></div>
            <div><dt>P ∧ Q</dt><dd>P and Q</dd></div>
            <div><dt>P ∨ Q</dt><dd>P or Q, inclusive</dd></div>
            <div><dt>P → Q</dt><dd>if P, then Q; P is sufficient for Q</dd></div>
            <div><dt>P ↔ Q</dt><dd>P if and only if Q</dd></div>
          </dl>
        </details>
      )}
    </section>
  );
}

function TruthTable({ table, formatted }: { table: TruthTable; formatted: string }) {
  const visibleRows = table.rows.slice(0, 16);
  return (
    <>
      <div className="logic-workbench__table-scroll" tabIndex={0}>
        <table aria-label={`Truth table for ${formatted}`}>
          <thead><tr>{table.columns.map((column) => <th key={column.id} scope="col">{column.label}</th>)}</tr></thead>
          <tbody>{visibleRows.map((row) => (
            <tr key={row.index} data-result={row.finalValue ? 'true' : 'false'}>
              {table.columns.map((column) => <td key={column.id}>{row.values[column.id] ? 'T' : 'F'}</td>)}
            </tr>
          ))}</tbody>
        </table>
      </div>
      {table.rows.length > visibleRows.length && (
        <details className="logic-workbench__remaining-rows">
          <summary>Show remaining {table.rows.length - visibleRows.length} rows</summary>
          <div className="logic-workbench__table-scroll" tabIndex={0}>
            <table aria-label={`Remaining truth-table rows for ${formatted}`}>
              <thead><tr>{table.columns.map((column) => <th key={column.id} scope="col">{column.label}</th>)}</tr></thead>
              <tbody>{table.rows.slice(16).map((row) => (
                <tr key={row.index} data-result={row.finalValue ? 'true' : 'false'}>
                  {table.columns.map((column) => <td key={column.id}>{row.values[column.id] ? 'T' : 'F'}</td>)}
                </tr>
              ))}</tbody>
            </table>
          </div>
        </details>
      )}
    </>
  );
}
