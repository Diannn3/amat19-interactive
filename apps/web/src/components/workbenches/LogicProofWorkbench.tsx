import {
  buildTruthTable,
  checkArgumentValidity,
  formatLogic,
  parseLogic,
  type Assignment,
  type TruthTable as TruthTableResult,
} from '@amat19/domain-logic';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '../ui/Button';
import { Feedback } from '../ui/Feedback';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/Tabs';
import { loadDraft, saveDraft } from '../../lib/draft';
import { usePersistenceFlush } from '../../lib/use-persistence-flush';
import { readWorkbenchOption } from '../../lib/workbench-route';

type Mode = 'table' | 'argument';
type Draft = {
  mode: Mode;
  expression: string;
  premises: string;
  conclusion: string;
};

const LAB_ID = 'workbench.logic-proof';
const CONTENT_VERSION = '1';
const MODE_VALUES: readonly Mode[] = ['table', 'argument'];
const INITIAL_DRAFT: Draft = {
  mode: 'table',
  expression: 'P -> Q',
  premises: 'P -> Q\nQ',
  conclusion: 'P',
};

function isMode(value: unknown): value is Mode {
  return value === 'table' || value === 'argument';
}

function message(error: unknown): string {
  return error instanceof Error ? error.message : 'The logic expression could not be analyzed.';
}

function assignmentText(symbols: string[], assignment?: Assignment): string {
  if (!assignment) return '';
  return symbols.map((symbol) => `${symbol}=${assignment[symbol] ? 'T' : 'F'}`).join(', ');
}

function setUrlMode(mode: Mode, method: 'pushState' | 'replaceState') {
  const url = new URL(window.location.href);
  if (url.searchParams.get('mode') === mode) return;
  url.searchParams.set('mode', mode);
  window.history[method](window.history.state, '', url);
}

export default function LogicProofWorkbench() {
  const [hydrated, setHydrated] = useState(false);
  const [mode, setMode] = useState<Mode>(INITIAL_DRAFT.mode);
  const [expression, setExpression] = useState(INITIAL_DRAFT.expression);
  const [premises, setPremises] = useState(INITIAL_DRAFT.premises);
  const [conclusion, setConclusion] = useState(INITIAL_DRAFT.conclusion);
  const [argumentChecked, setArgumentChecked] = useState(false);

  useEffect(() => {
    let active = true;
    const requestedMode = readWorkbenchOption('mode', MODE_VALUES);
    void loadDraft<Draft>(LAB_ID, CONTENT_VERSION).then((saved) => {
      if (!active) return;
      const selected = requestedMode ?? (isMode(saved?.mode) ? saved.mode : INITIAL_DRAFT.mode);
      setMode(selected);
      setUrlMode(selected, 'replaceState');
      if (saved) {
        if (typeof saved.expression === 'string') setExpression(saved.expression);
        if (typeof saved.premises === 'string') setPremises(saved.premises);
        if (typeof saved.conclusion === 'string') setConclusion(saved.conclusion);
      }
      setHydrated(true);
    }).catch(() => {
      if (!active) return;
      const selected = requestedMode ?? INITIAL_DRAFT.mode;
      setMode(selected);
      setUrlMode(selected, 'replaceState');
      setHydrated(true);
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const restoreMode = () => {
      setMode(readWorkbenchOption('mode', MODE_VALUES) ?? INITIAL_DRAFT.mode);
      setArgumentChecked(false);
    };
    window.addEventListener('popstate', restoreMode);
    return () => window.removeEventListener('popstate', restoreMode);
  }, []);

  const draft = useMemo<Draft>(() => ({ mode, expression, premises, conclusion }), [mode, expression, premises, conclusion]);
  useEffect(() => {
    if (!hydrated) return;
    const timer = window.setTimeout(() => { void saveDraft(LAB_ID, CONTENT_VERSION, draft); }, 250);
    return () => window.clearTimeout(timer);
  }, [draft, hydrated]);
  usePersistenceFlush(() => saveDraft(LAB_ID, CONTENT_VERSION, draft), hydrated);

  const tableAnalysis = useMemo(() => {
    try {
      const table = buildTruthTable(expression);
      return { table, formatted: formatLogic(table.ast), error: undefined };
    } catch (error) {
      return { table: undefined, formatted: undefined, error: message(error) };
    }
  }, [expression]);

  const argument = useMemo(() => {
    try {
      const premiseList = premises.split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
      if (premiseList.length === 0) throw new Error('Enter at least one premise, one per line.');
      const result = checkArgumentValidity(premiseList, conclusion);
      const formatted = `${premiseList.map((premise) => formatLogic(parseLogic(premise))).join('; ')} ∴ ${formatLogic(parseLogic(conclusion))}`;
      return { result, formatted, error: undefined };
    } catch (error) {
      return { result: undefined, formatted: undefined, error: message(error) };
    }
  }, [premises, conclusion]);

  function selectMode(next: Mode) {
    if (next === mode) return;
    setMode(next);
    setArgumentChecked(false);
    setUrlMode(next, 'pushState');
  }

  return (
    <section className="logic-workbench" data-testid="logic-proof-workbench" data-hydrated={hydrated ? 'true' : undefined}>
      <Tabs value={mode} onValueChange={(value) => { if (isMode(value)) selectMode(value); }}>
        <TabsList aria-label="Logic workbench task" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', width: '100%' }}>
          {MODE_VALUES.map((value) => (
            <TabsTrigger
              key={value}
              value={value}
              disabled={!hydrated}
              style={{ minWidth: 0, minHeight: 44, padding: '0.55rem', border: '1px solid var(--border)', background: mode === value ? 'var(--primary)' : 'var(--surface-muted)', color: mode === value ? 'var(--primary-foreground)' : 'var(--foreground)', fontWeight: mode === value ? 700 : 500, cursor: 'pointer' }}
            >
              {value === 'table' ? 'Truth Table' : 'Test an Argument'}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="table" className="logic-workbench__stage">
          <header className="logic-workbench__header">
            <h2>See every truth value.</h2>
            <p>Enter one proposition. Every row and subexpression comes from the exact logic engine.</p>
          </header>
          <fieldset className="logic-workbench__controls" disabled={!hydrated}>
            <label className="form-field">
              <span className="form-field__label">Logic expression</span>
              <input data-primary-control className="text-input logic-input logic-input--large" aria-label="Logic expression" value={expression} onChange={(event) => setExpression(event.target.value)} autoComplete="off" spellCheck={false} />
              <span className="form-field__hint">Type ~, &amp;, |, -&gt;, &lt;-&gt; or ∼, ∧, ∨, →, ↔.</span>
            </label>
          </fieldset>
          {tableAnalysis.error ? <Feedback tone="error" role="alert">{tableAnalysis.error}</Feedback> : tableAnalysis.table && tableAnalysis.formatted ? (
            <>
              <div className="logic-workbench__summary" role="status" aria-live="polite">
                <div className="logic-summary-badge">
                  <strong className="logic-summary-class">{tableAnalysis.table.classification}</strong>
                  <span className="logic-summary-meta">{tableAnalysis.table.rows.length} rows · {tableAnalysis.table.symbols.length} variables · {tableAnalysis.formatted}</span>
                </div>
              </div>
              <TruthTable table={tableAnalysis.table} formatted={tableAnalysis.formatted} />
            </>
          ) : null}
        </TabsContent>

        <TabsContent value="argument" className="logic-workbench__stage">
          <header className="logic-workbench__header">
            <h2>Try to make the conclusion false.</h2>
            <p>An argument is invalid exactly when all premises can be true while the conclusion is false.</p>
          </header>
          <fieldset className="logic-workbench__argument-grid" disabled={!hydrated}>
            <legend className="sr-only">Argument to test</legend>
            <label className="form-field"><span className="form-field__label">Premises · one per line</span><textarea data-primary-control className="text-input logic-input" rows={3} value={premises} onChange={(event) => { setPremises(event.target.value); setArgumentChecked(false); }} /></label>
            <label className="form-field"><span className="form-field__label">Conclusion</span><input data-primary-control className="text-input logic-input" value={conclusion} onChange={(event) => { setConclusion(event.target.value); setArgumentChecked(false); }} /></label>
            <Button data-primary-control variant="primary" type="button" onClick={() => setArgumentChecked(true)}>Test validity</Button>
          </fieldset>
          {argumentChecked && (argument.error ? <Feedback tone="error" role="alert">{argument.error}</Feedback> : argument.result && (
            <div className="logic-workbench__verdict" data-valid={argument.result.valid} role="status">
              <strong>{argument.result.valid ? 'Valid argument.' : 'Invalid argument.'}</strong>
              <span>{argument.formatted}</span>
              <span>{argument.result.valid
                ? `No assignment among ${2 ** argument.result.symbols.length} possibilities makes every premise true and the conclusion false.`
                : `Falsifying assignment: ${assignmentText(argument.result.symbols, argument.result.counterexamples[0])}`}</span>
            </div>
          ))}
        </TabsContent>
      </Tabs>
      <details className="logic-workbench__notation">
        <summary>Read the notation</summary>
        <dl>
          <div><dt>∼P</dt><dd>not P</dd></div>
          <div><dt>P ∧ Q</dt><dd>P and Q</dd></div>
          <div><dt>P ∨ Q</dt><dd>P or Q, inclusive</dd></div>
          <div><dt>P → Q</dt><dd>if P, then Q; P is sufficient for Q</dd></div>
          <div><dt>P ↔ Q</dt><dd>P if and only if Q</dd></div>
        </dl>
      </details>
    </section>
  );
}

function TruthTable({ table, formatted }: { table: TruthTableResult; formatted: string }) {
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
