import { useState, type ReactNode } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '../ui/Button';

export type TeachingStep = {
  id: string;
  label: string;
  expression: string;
  explanation: string;
  value?: number;
  exactValue?: string;
};

export default function StepTrace({
  steps,
  title = 'Step trace',
  initialCount = 3,
  renderExpression,
}: {
  steps: TeachingStep[];
  title?: string;
  initialCount?: number;
  renderExpression?: (step: TeachingStep) => ReactNode;
}) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? steps : steps.slice(0, initialCount);

  return (
    <section className="step-trace" aria-label={title}>
      {visible.map((step, index) => (
        <article className="step-trace__item" key={step.id}>
          <span className="step-trace__index">{index + 1}</span>
          <div>
            <strong>{step.label}</strong>
            {renderExpression ? renderExpression(step) : <code>{step.expression}</code>}
            <p>{step.explanation}</p>
          </div>
        </article>
      ))}
      {steps.length > initialCount && (
        <Button type="button" variant="ghost" onClick={() => setExpanded((value) => !value)}>
          {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          {expanded ? 'Show fewer steps' : `Show all ${steps.length} steps`}
        </Button>
      )}
    </section>
  );
}
