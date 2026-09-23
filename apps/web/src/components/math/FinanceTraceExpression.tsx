import katex from 'katex';
import type { NumericCertainty, AnnuityTiming, ValueDirection } from '@amat19/domain-finance';
import type { TeachingStep } from './StepTrace';

type Scenario = 'cashflows' | 'annuity' | 'bond';

function formulaForStep(
  stepId: string,
  scenario: Scenario,
  direction: ValueDirection,
  timing: AnnuityTiming,
  zeroRate: boolean,
): string | undefined {
  if (scenario === 'cashflows') {
    if (stepId.startsWith('flow-')) return 'C_t(1+i)^{f-t}';
    if (stepId === 'sum') return 'V_f = \\sum_t C_t(1+i)^{f-t}';
  }
  if (scenario === 'annuity') {
    const symbol = direction === 'present' ? 'a' : 's';
    const annuity = `${timing === 'due' ? '\\ddot{' + symbol + '}' : symbol}_{\\overline{n}|i}`;
    if (stepId === 'base') {
      const factor = zeroRate
        ? 'n'
        : direction === 'present'
          ? '\\frac{1-(1+i)^{-n}}{i}'
          : '\\frac{(1+i)^n-1}{i}';
      return `${symbol}_{\\overline{n}|i} = ${factor}`;
    }
    if (stepId === 'due') return `${annuity} = (1+i)${symbol}_{\\overline{n}|i}`;
    if (stepId === 'payment') return `V = R\\,${annuity}`;
  }
  if (scenario === 'bond') {
    if (stepId === 'coupon') return 'Fr = F\\cdot r';
    if (stepId === 'coupons') return 'P_{\\mathrm{coupons}} = Fr\\,a_{\\overline{n}|j}';
    if (stepId === 'redemption') return 'P_{\\mathrm{redemption}} = C(1+j)^{-n}';
    if (stepId === 'price') return 'P = P_{\\mathrm{coupons}} + P_{\\mathrm{redemption}}';
  }
  return undefined;
}

export default function FinanceTraceExpression({
  step,
  scenario,
  direction,
  timing,
  zeroRate,
  certainty,
}: {
  step: TeachingStep;
  scenario: Scenario;
  direction: ValueDirection;
  timing: AnnuityTiming;
  zeroRate: boolean;
  certainty: NumericCertainty;
}) {
  // Formulae are trusted, fixed templates. Never pass learner input to KaTeX as HTML.
  const formula = formulaForStep(step.id, scenario, direction, timing, zeroRate);
  if (!formula) return <code>{step.expression}</code>;
  const math = katex.renderToString(formula, { output: 'htmlAndMathml', throwOnError: true });
  const displayedValue = step.expression.split(' = ').at(-1);
  return (
    <div className="max-w-full min-w-0">
      <span className="block max-w-full overflow-x-auto py-2 text-sm" dangerouslySetInnerHTML={{ __html: math }} />
      {displayedValue && (
        <code className="block max-w-full break-all" aria-label={`${certainty === 'exact' ? 'Value' : 'Approximate value'}: ${displayedValue}`}>
          {certainty === 'exact' ? '=' : '≈'} {displayedValue}
        </code>
      )}
    </div>
  );
}
