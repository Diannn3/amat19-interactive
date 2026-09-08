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
import WorkbenchTaskPicker, { type WorkbenchTaskOption } from './WorkbenchTaskPicker';

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
  mode: 'translate',
  expression: 'P -> Q',
  left: 'P -> Q',
  right: '~Q -> ~P',
  premises: 'P -> Q\nQ',
  conclusion: 'P',
  translationPromptId: 'if-then',
  translationAnswer: '',
};

const MODE_VALUES: readonly Mode[] = ['translate', 'table', 'compare', 'argument', 'proof'];
const TASK_OPTIONS: readonly WorkbenchTaskOption[] = [
  { value: 'translate', label: 'Translate a statement', group: 'Start here' },
  { value: 'table', label: 'Truth table', group: 'See the pattern' },
  { value: 'compare', label: 'Compare expressions', group: 'Test reasoning' },
  { value: 'argument', label: 'Test an argument', group: 'Test reasoning' },
  { value: 'proof', label: 'Build a proof', group: 'Go deeper' },
];

function isMode(value: unknown): value is Mode {
  return typeof value === 'string' && MODE_VALUES.includes(value as Mode);
}

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
    const requestedMode = readWorkbenchOption('mode', MODE_VALUES);
    loadDraft<Draft>(LAB_ID, CONTENT_VERSION).then((draft) => {
      if (!active) return;
      if (draft) {
        setMode(requestedMode ?? (isMode(draft.mode) ? draft.mode : INITIAL_DRAFT.mode));
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
      <WorkbenchTaskPicker
        value={mode}
        options={TASK_OPTIONS}
        disabled={!hydrated}
        onChange={(value) => { if (isMode(value)) selectMode(value); }}
      />

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
            <div className="logic-workbench__header-row">
              <div>
                <h2 id="truth-table-heading">See every truth value.</h2>
                <p>Enter one proposition. The table keeps each subexpression visible so you can find the row that changes the result.</p>
              </div>
              <button
                type="button"
                className="apple-filter-pill"
                onClick={() => setExpression('')}
                aria-label="Clear expression"
              >
                Clear
              </button>
            </div>
          </header>

          <div className="logic-instrument-grid">
            <div className="logic-instrument-main">
              <fieldset className="logic-workbench__controls" disabled={!hydrated}>
                <label className="form-field">
                  <span className="form-field__label">Logic expression</span>
                  <div className="logic-input-bar">
                    <input
                      data-primary-control
                      className="text-input logic-input logic-input--large"
                      aria-label="Logic expression"
                      value={expression}
                      onChange={(event) => setExpression(event.target.value)}
                      autoComplete="off"
                      spellCheck={false}
                    />
                  </div>
                  <span className="form-field__hint">Use ~, &amp;, |, -&gt;, &lt;-&gt; or ¬, ∧, ∨, →, ↔.</span>
                </label>
              </fieldset>

              <div className="logic-keypad" role="group" aria-label="Mathematical operator keypad">
                {['¬', '∧', '∨', '→', '↔', '(', ')', 'P', 'Q', 'R', 'S', 'T'].map((sym) => (
                  <button
                    key={sym}
                    type="button"
                    className="apple-keypad-pill"
                    onClick={() => setExpression((prev) => prev + (prev.length > 0 && !prev.endsWith(' ') && !['(', ')', '¬'].includes(sym) ? ' ' : '') + sym)}
                  >
                    {sym}
                  </button>
                ))}
                <button
                  type="button"
                  className="apple-keypad-pill apple-keypad-pill--backspace"
                  onClick={() => setExpression((prev) => prev.slice(0, -1).trimEnd())}
                  aria-label="Backspace"
                >
                  ⌫
                </button>
              </div>

              {tableAnalysis.error ? (
                <Feedback tone="error" role="alert">{tableAnalysis.error}</Feedback>
              ) : tableAnalysis.table && tableAnalysis.formatted ? (
                <>
                  <div className="logic-workbench__summary" role="status" aria-live="polite">
                    <div className="logic-summary-badge">
                      <strong className="logic-summary-class">{tableAnalysis.table.classification}</strong>
                      <span className="logic-summary-meta">{tableAnalysis.table.rows.length} rows &middot; {tableAnalysis.table.symbols.length} variables &middot; {tableAnalysis.formatted}</span>
                    </div>
                  </div>
                  <TruthTable table={tableAnalysis.table} formatted={tableAnalysis.formatted} />
                </>
              ) : null}
            </div>

            <aside className="logic-instrument-aside">
              <div className="logic-aside-card apple-glass-card">
                <div className="logic-aside-card__header">
                  <strong>Visualize with Sets</strong>
                  <span className="apple-formula-chip">A &cap; B</span>
                </div>
                <p className="logic-aside-card__desc">Explore set relationships for logical statements.</p>
                <div className="logic-venn-diagram" aria-label="Venn diagram showing intersection of sets A and B">
                  <svg viewBox="0 0 220 120" className="venn-svg" aria-hidden="true">
                    <circle cx="85" cy="60" r="44" fill="rgba(241, 245, 249, 0.7)" stroke="#94a3b8" strokeWidth="1.5" />
                    <circle cx="135" cy="60" r="44" fill="rgba(241, 245, 249, 0.7)" stroke="#94a3b8" strokeWidth="1.5" />
                    <path d="M 110,26 A 44,44 0 0,1 110,94 A 44,44 0 0,1 110,26" fill="rgba(148, 163, 184, 0.35)" stroke="#64748b" strokeWidth="1.5" />
                    <text x="68" y="65" fill="#475569" fontSize="13" fontWeight="600">A</text>
                    <text x="146" y="65" fill="#475569" fontSize="13" fontWeight="600">B</text>
                  </svg>
                  <div className="venn-caption">
                    <strong>A &cap; B</strong>
                    <small>Elements in both A and B.</small>
                  </div>
                </div>
              </div>

              <div className="logic-aside-card apple-glass-card">
                <div className="logic-aside-card__header">
                  <strong>Common Statements</strong>
                </div>
                <p className="logic-aside-card__desc">Try an example or modify it.</p>
                <div className="common-statements-list">
                  <button type="button" className="common-statement-item" onClick={() => setExpression('~(P & Q) <-> (~P | ~Q)')}>
                    <div>
                      <span className="statement-name">De Morgan's Law</span>
                      <span className="statement-formula">&not;(P &and; Q) &equiv; &not;P &or; &not;Q</span>
                    </div>
                    <span className="statement-arrow" aria-hidden="true">&rarr;</span>
                  </button>
                  <button type="button" className="common-statement-item" onClick={() => setExpression('P -> Q')}>
                    <div>
                      <span className="statement-name">Implication</span>
                      <span className="statement-formula">P &rarr; Q</span>
                    </div>
                    <span className="statement-arrow" aria-hidden="true">&rarr;</span>
                  </button>
                  <button type="button" className="common-statement-item" onClick={() => setExpression('P <-> Q')}>
                    <div>
                      <span className="statement-name">Biconditional</span>
                      <span className="statement-formula">P &harr; Q</span>
                    </div>
                    <span className="statement-arrow" aria-hidden="true">&rarr;</span>
                  </button>
                  <button type="button" className="common-statement-item" onClick={() => setExpression('(P -> Q) <-> (~Q -> ~P)')}>
                    <div>
                      <span className="statement-name">Contrapositive</span>
                      <span className="statement-formula">(P &rarr; Q) &equiv; (&not;Q &rarr; &not;P)</span>
                    </div>
                    <span className="statement-arrow" aria-hidden="true">&rarr;</span>
                  </button>
                </div>
              </div>
            </aside>
          </div>

          <div className="logic-examples-bar">
            <div className="logic-examples-header">
              <strong>Try These Examples</strong>
              <small>Click to load an example into the workbench.</small>
            </div>
            <div className="logic-examples-deck">
              <button type="button" className="logic-example-card apple-glass-card" onClick={() => setExpression('P -> Q')}>
                <span className="logic-example-card__formula">P &rarr; Q</span>
                <span className="logic-example-card__label">Simple implication</span>
              </button>
              <button type="button" className="logic-example-card apple-glass-card" onClick={() => setExpression('(P & Q) | R')}>
                <span className="logic-example-card__formula">(P &and; Q) &or; R</span>
                <span className="logic-example-card__label">Mixed operators</span>
              </button>
              <button type="button" className="logic-example-card apple-glass-card" onClick={() => setExpression('~(P | Q)')}>
                <span className="logic-example-card__formula">&not;(P &or; Q)</span>
                <span className="logic-example-card__label">De Morgan's Law</span>
              </button>
              <button type="button" className="logic-example-card apple-glass-card" onClick={() => setExpression('P <-> Q')}>
                <span className="logic-example-card__formula">P &harr; Q</span>
                <span className="logic-example-card__label">Equivalence</span>
              </button>
              <button type="button" className="logic-example-card apple-glass-card" onClick={() => setExpression('(P -> Q) -> (~Q -> ~P)')}>
                <span className="logic-example-card__formula">(P &rarr; Q) &rarr; (&not;Q &rarr; &not;P)</span>
                <span className="logic-example-card__label">Contrapositive</span>
              </button>
            </div>
          </div>
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
