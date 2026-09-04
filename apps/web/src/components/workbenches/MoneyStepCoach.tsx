import { useId, useRef, useState, type ReactNode } from 'react';
import { checkMoneyStep, type MoneyStep, type MoneyStepFeedback } from '../../lib/money-step-feedback';
import { Button } from '../ui/Button';

export default function MoneyStepCoach({ step, disabled, children }: {
  step: MoneyStep & { label: string };
  disabled: boolean;
  children: ReactNode;
}) {
  const id = useId();
  const [exponent, setExponent] = useState('');
  const [value, setValue] = useState('');
  const [feedback, setFeedback] = useState<MoneyStepFeedback>();
  const [revealed, setRevealed] = useState(false);
  const exponentInput = useRef<HTMLInputElement>(null);
  const valueInput = useRef<HTMLInputElement>(null);

  return <section className="money-step" data-testid="money-step-coach" aria-labelledby={`${id}-title`}>
    <h3 id={`${id}-title`}>{step.label}: t={step.time} → t={step.focalDate}</h3>
    <p className="money-step__expression">{step.amount} × (1 + {step.rate})<sup>n</sup></p>
    <form onSubmit={event => {
      event.preventDefault();
      const checked = checkMoneyStep(step, { exponent, value });
      setFeedback(checked);
      if (checked.field === 'exponent') exponentInput.current?.focus();
      if (checked.field === 'value') valueInput.current?.focus();
    }}>
      <fieldset disabled={disabled} className="money-step__fields" data-primary-controls>
        <legend className="sr-only">Move this cash flow to the focal date</legend>
        <label className="form-field">
          <span className="form-field__label">Exponent</span>
          <input ref={exponentInput} className="text-input" value={exponent} name="cashflow-step-exponent" autoComplete="off" spellCheck={false}
            aria-invalid={feedback?.field === 'exponent' || undefined}
            aria-describedby={`${id}-feedback`}
            onChange={event => { setExponent(event.target.value); setFeedback(undefined); }} />
        </label>
        <label className="form-field">
          <span className="form-field__label">Value at focal date</span>
          <input ref={valueInput} className="text-input" value={value} name="cashflow-step-value" autoComplete="off" spellCheck={false}
            aria-invalid={feedback?.field === 'value' || undefined}
            aria-describedby={`${id}-feedback`}
            onChange={event => { setValue(event.target.value); setFeedback(undefined); }} />
        </label>
        <Button type="submit" variant="primary">Check step</Button>
      </fieldset>
      <p id={`${id}-feedback`} className="money-step__feedback" role="status" data-status={feedback?.status}>
        {feedback?.message ?? 'Enter the moved amount to the nearest cent.'}
      </p>
    </form>
    <Button type="button" variant="ghost" disabled={disabled} aria-expanded={revealed} aria-controls={`${id}-solution`} onClick={() => setRevealed(!revealed)}>
      {revealed ? 'Hide full calculation' : 'Show full calculation'}
    </Button>
    <div id={`${id}-solution`} hidden={!revealed} className="money-timeline__calculation">{children}</div>
  </section>;
}
