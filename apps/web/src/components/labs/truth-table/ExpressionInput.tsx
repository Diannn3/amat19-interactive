import { ArrowRight, Parentheses, RotateCcw } from 'lucide-react';
import { useRef } from 'react';
import { Button } from '../../ui/Button';

const SYMBOLS = [
  { symbol: '∼', insert: '∼', label: 'Negation' },
  { symbol: '∧', insert: ' ∧ ', label: 'Conjunction' },
  { symbol: '∨', insert: ' ∨ ', label: 'Inclusive disjunction' },
  { symbol: '→', insert: ' → ', label: 'Implication' },
  { symbol: '↔', insert: ' ↔ ', label: 'Biconditional' },
  { symbol: '( )', insert: '()', label: 'Parentheses' }
] as const;

const EXAMPLES = [
  ['Implication', 'P -> Q'],
  ['Contrapositive', '(P -> Q) <-> (~Q -> ~P)'],
  ['De Morgan', '~(P & Q) <-> (~P | ~Q)']
] as const;

export function ExpressionInput({
  expression,
  error,
  onChange
}: {
  expression: string;
  error?: string;
  onChange: (expression: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  function insertSymbol(insert: string): void {
    const input = inputRef.current;
    if (!input) {
      onChange(expression + insert);
      return;
    }
    const start = input.selectionStart ?? expression.length;
    const end = input.selectionEnd ?? start;
    const next = expression.slice(0, start) + insert + expression.slice(end);
    onChange(next);
    requestAnimationFrame(() => {
      input.focus();
      const offset = insert === '()' ? 1 : insert.length;
      input.setSelectionRange(start + offset, start + offset);
    });
  }

  return (
    <section className="truth-lab__toolbar" aria-labelledby="expression-heading">
      <div>
        <p className="truth-lab__section-label" id="expression-heading">1 · Enter a proposition</p>
        <div className="truth-lab__input-row">
          <input
            ref={inputRef}
            className="truth-lab__input"
            aria-describedby={error ? 'truth-expression-error truth-expression-help' : 'truth-expression-help'}
            aria-invalid={Boolean(error)}
            value={expression}
            onChange={(event) => onChange(event.target.value)}
            spellCheck={false}
            autoCapitalize="characters"
            placeholder="Example: (P -> Q) <-> (~Q -> ~P)"
          />
          <Button variant="ghost" type="button" onClick={() => onChange('P -> Q')}>
            <RotateCcw size={17} aria-hidden="true" /> Reset
          </Button>
        </div>
        <p id="truth-expression-help" className="truth-lab__meta">
          <span>Aliases: <strong>~ &amp; &amp; | -&gt; &lt;-&gt;</strong></span>
          <span>Course symbols: <strong>∼ ∧ ∨ → ↔</strong></span>
        </p>
        {error && <p className="truth-lab__error" id="truth-expression-error" role="alert">{error}</p>}
      </div>

      <div className="truth-lab__symbol-row" aria-label="Logic symbol toolbar">
        {SYMBOLS.map((item) => (
          <button
            type="button"
            key={item.symbol}
            className="truth-lab__symbol-button"
            aria-label={`Insert ${item.label}`}
            title={item.label}
            onClick={() => insertSymbol(item.insert)}
          >
            {item.symbol === '( )' ? <Parentheses size={18} aria-hidden="true" /> : item.symbol}
          </button>
        ))}
      </div>

      <div className="truth-lab__examples" aria-label="Example propositions">
        {EXAMPLES.map(([label, value]) => (
          <button type="button" className="truth-lab__chip" key={label} onClick={() => onChange(value)}>
            {label} <ArrowRight size={14} aria-hidden="true" />
          </button>
        ))}
      </div>
    </section>
  );
}
