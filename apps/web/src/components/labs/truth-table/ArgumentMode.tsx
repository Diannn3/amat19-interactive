import {
  checkArgumentValidity,
  evaluateLogic,
  generateAssignments,
  parseLogic,
  type Assignment,
  type LogicNode
} from '@amat19/domain-logic';
import { AlertTriangle, CheckCircle2, Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '../../ui/Button';

function tf(value: boolean): 'T' | 'F' {
  return value ? 'T' : 'F';
}

type ParsedArgument = {
  premises: LogicNode[];
  conclusion: LogicNode;
  symbols: string[];
  counterexamples: Assignment[];
  valid: boolean;
};

export function ArgumentMode() {
  const [premises, setPremises] = useState(['~P | (Q -> R)', '~R']);
  const [conclusion, setConclusion] = useState('~(P & Q)');

  const parsed = useMemo<{ value?: ParsedArgument; error?: string }>(() => {
    try {
      const result = checkArgumentValidity(premises.filter(Boolean), conclusion);
      return {
        value: {
          premises: premises.filter(Boolean).map(parseLogic),
          conclusion: parseLogic(conclusion),
          symbols: result.symbols,
          counterexamples: result.counterexamples,
          valid: result.valid
        }
      };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'The argument could not be parsed.' };
    }
  }, [premises, conclusion]);

  const rows = parsed.value ? generateAssignments(parsed.value.symbols) : [];
  const counterexampleKeys = new Set(
    parsed.value?.counterexamples.map((assignment) => JSON.stringify(assignment)) ?? []
  );

  function updatePremise(index: number, value: string): void {
    setPremises((current) => current.map((premise, premiseIndex) => premiseIndex === index ? value : premise));
  }

  return (
    <section className="truth-lab__argument" aria-labelledby="argument-heading">
      <div className="truth-lab__argument-builder">
        <p className="truth-lab__section-label">Argument mode</p>
        <h2 id="argument-heading">Test validity by counterexample</h2>
        <p>
          An argument is invalid exactly when at least one row makes <strong>every premise true</strong> and the
          <strong> conclusion false</strong>. Those rows stay highlighted below.
        </p>

        <div className="truth-lab__argument-inputs">
          {premises.map((premise, index) => (
            <label key={index}>
              <span>Premise {index + 1}</span>
              <span className="truth-lab__argument-input-row">
                <input
                  className="truth-lab__input"
                  value={premise}
                  onChange={(event) => updatePremise(index, event.target.value)}
                  aria-label={`Premise ${index + 1}`}
                />
                {premises.length > 1 && (
                  <Button
                    variant="ghost"
                    type="button"
                    aria-label={`Remove premise ${index + 1}`}
                    onClick={() => setPremises((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                  >
                    <Trash2 size={17} aria-hidden="true" />
                  </Button>
                )}
              </span>
            </label>
          ))}
          <Button variant="ghost" type="button" onClick={() => setPremises((current) => [...current, ''])}>
            <Plus size={16} aria-hidden="true" /> Add premise
          </Button>
          <label>
            <span>Conclusion</span>
            <input
              className="truth-lab__input"
              value={conclusion}
              onChange={(event) => setConclusion(event.target.value)}
              aria-label="Conclusion"
            />
          </label>
        </div>

        {parsed.error && <p className="truth-lab__error" role="alert">{parsed.error}</p>}
        {parsed.value && (
          <div className="truth-lab__argument-verdict" data-valid={parsed.value.valid} role="status">
            {parsed.value.valid ? <CheckCircle2 aria-hidden="true" /> : <AlertTriangle aria-hidden="true" />}
            <span>
              <strong>{parsed.value.valid ? 'Valid argument' : 'Invalid argument'}</strong>
              {parsed.value.valid
                ? ' — there is no row with all premises true and the conclusion false.'
                : ` — ${parsed.value.counterexamples.length} counterexample row${parsed.value.counterexamples.length === 1 ? '' : 's'} found.`}
            </span>
          </div>
        )}
      </div>

      {parsed.value && (
        <div className="truth-table-scroll" tabIndex={0} aria-label="Argument validity truth table">
          <table className="truth-table truth-table--argument">
            <caption className="sr-only">Truth table for the current argument. Counterexample rows are marked.</caption>
            <thead>
              <tr>
                {parsed.value.symbols.map((symbol) => <th scope="col" key={symbol}>{symbol}</th>)}
                {premises.filter(Boolean).map((premise, index) => <th scope="col" key={`p-${index}`}>Premise {index + 1}<br /><small>{premise}</small></th>)}
                <th scope="col">Conclusion<br /><small>{conclusion}</small></th>
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
