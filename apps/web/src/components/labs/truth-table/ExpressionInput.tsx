import { ArrowRight, Parentheses, RotateCcw } from 'lucide-react';
import { useRef } from 'react';
import { Button } from '../../ui/Button';

const SYMBOLS = [
  { symbol: '∼', insert: '∼', label: 'Negation', help: 'not P' },
  { symbol: '∧', insert: ' ∧ ', label: 'Conjunction', help: 'P and Q' },
  { symbol: '∨', insert: ' ∨ ', label: 'Inclusive disjunction', help: 'P or Q, including both' },
  { symbol: '→', insert: ' → ', label: 'Implication', help: 'if P then Q' },
  { symbol: '↔', insert: ' ↔ ', label: 'Biconditional', help: 'P if and only if Q' },
  { symbol: '( )', insert: '()', label: 'Parentheses', help: 'group a subexpression' }
] as const;

const EXAMPLES = [
  ['Implication', 'P -> Q'],
  ['Contrapositive', '(P -> Q) <-> (~Q -> ~P)'],
  ['De Morgan', '~(P & Q) <-> (~P | ~Q)']
] as const;

export function ExpressionInput({
  expression,
  error,
  errorSpan,
  onChange
}: {
  expression: string;
  error?: string;
  errorSpan?: { start: number; end: number };
  onChange: (expression: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  function insertSymbol(insert: string): void {
    const input = inputRef.current;
    if (!input) { onChange(expression + insert); return; }
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

  const markedStart = errorSpan ? Math.max(0, Math.min(expression.length, errorSpan.start)) : 0;
  const markedEnd = errorSpan ? Math.max(markedStart + 1, Math.min(expression.length, errorSpan.end || errorSpan.start + 1)) : 0;

  return (
    <section className="truth-lab__toolbar" aria-labelledby="expression-heading">
      <div>
        <p className="truth-lab__section-label" id="expression-heading">1 · Enter a proposition</p>
        <div className="truth-lab__input-row">
          <input
            ref={inputRef}
            className="truth-lab__input"
            aria-label="Logic proposition"
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
          <span>Aliases: <strong>~ &amp; | -&gt; &lt;-&gt;</strong></span>
          <span>Course symbols: <strong>∼ ∧ ∨ → ↔</strong></span>
        </p>
        {error && (
          <div className="truth-lab__error" id="truth-expression-error" role="alert">
            <p>{error}</p>
            {errorSpan && (
              <code className="parse-error-preview" aria-label={`Error near character ${markedStart + 1}`}>
                <span>{expression.slice(0, markedStart)}</span>
                <mark>{expression.slice(markedStart, markedEnd) || ' '}</mark>
                <span>{expression.slice(markedEnd)}</span>
              </code>
            )}
          </div>
        )}
      </div>

      <div className="truth-lab__symbol-row" aria-label="Logic symbol toolbar">
        {SYMBOLS.map((item) => (
          <button
            type="button"
            key={item.symbol}
            className="truth-lab__symbol-button"
            aria-label={`Insert ${item.label}: ${item.help}`}
            onClick={() => insertSymbol(item.insert)}
          >
            {item.symbol === '( )' ? <Parentheses size={18} aria-hidden="true" /> : item.symbol}
            <span className="sr-only">{item.help}</span>
          </button>
        ))}
      </div>

      <div className="truth-lab__examples" aria-label="Original example propositions">
        {EXAMPLES.map(([label, value]) => (
          <button type="button" className="truth-lab__chip" key={label} onClick={() => onChange(value)}>
            {label} <ArrowRight size={14} aria-hidden="true" />
          </button>
        ))}
      </div>
    </section>
  );
}
