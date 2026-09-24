import type { ReactNode } from 'react';
import type { NumericCertainty, AnnuityTiming, ValueDirection } from '@amat19/domain-finance';
import type { TeachingStep } from './StepTrace';

type Scenario = 'cashflows' | 'annuity' | 'bond';
type Formula = { nodes: ReactNode; label: string };

function annuityFactor(symbol: 'a' | 's', rate: 'i' | 'j', due = false): ReactNode {
  const base = due ? <mover><mi>{symbol}</mi><mo>¨</mo></mover> : <mi>{symbol}</mi>;
  return <msub>{base}<mrow><mover><mi>n</mi><mo>¯</mo></mover><mo>|</mo><mi>{rate}</mi></mrow></msub>;
}

function formulaForStep(
  stepId: string,
  scenario: Scenario,
  direction: ValueDirection,
  timing: AnnuityTiming,
  zeroRate: boolean,
): Formula | undefined {
  if (scenario === 'cashflows') {
    const discount = <msup><mrow><mo>(</mo><mn>1</mn><mo>+</mo><mi>i</mi><mo>)</mo></mrow><mrow><mi>f</mi><mo>−</mo><mi>t</mi></mrow></msup>;
    if (stepId.startsWith('flow-')) return {
      nodes: <><msub><mi>C</mi><mi>t</mi></msub><mo>·</mo>{discount}</>,
      label: 'C sub t times (1 plus i) to the power f minus t',
    };
    if (stepId === 'sum') return {
      nodes: <><msub><mi>V</mi><mi>f</mi></msub><mo>=</mo><munder><mo>∑</mo><mi>t</mi></munder><msub><mi>C</mi><mi>t</mi></msub><mo>·</mo>{discount}</>,
      label: 'V sub f equals the sum over t of C sub t times (1 plus i) to the power f minus t',
    };
  }
  if (scenario === 'annuity') {
    const symbol = direction === 'present' ? 'a' : 's';
    const immediateFactor = annuityFactor(symbol, 'i');
    const selectedFactor = annuityFactor(symbol, 'i', timing === 'due');
    if (stepId === 'base') {
      const factor = zeroRate
        ? <mi>n</mi>
        : direction === 'present'
          ? <mfrac><mrow><mn>1</mn><mo>−</mo><msup><mrow><mo>(</mo><mn>1</mn><mo>+</mo><mi>i</mi><mo>)</mo></mrow><mrow><mo>−</mo><mi>n</mi></mrow></msup></mrow><mi>i</mi></mfrac>
          : <mfrac><mrow><msup><mrow><mo>(</mo><mn>1</mn><mo>+</mo><mi>i</mi><mo>)</mo></mrow><mi>n</mi></msup><mo>−</mo><mn>1</mn></mrow><mi>i</mi></mfrac>;
      return { nodes: <>{immediateFactor}<mo>=</mo>{factor}</>, label: `${direction} annuity factor equals ${zeroRate ? 'n' : 'its exact geometric series formula'}` };
    }
    if (stepId === 'due') return {
      nodes: <>{selectedFactor}<mo>=</mo><mo>(</mo><mn>1</mn><mo>+</mo><mi>i</mi><mo>)</mo>{immediateFactor}</>,
      label: 'Annuity due equals (1 plus i) times the immediate annuity factor',
    };
    if (stepId === 'payment') return {
      nodes: <><mi>V</mi><mo>=</mo><mi>R</mi><mo>·</mo>{selectedFactor}</>,
      label: 'Value equals payment R times the annuity factor',
    };
  }
  if (scenario === 'bond') {
    if (stepId === 'coupon') return {
      nodes: <><mi>F</mi><mi>r</mi><mo>=</mo><mi>F</mi><mo>·</mo><mi>r</mi></>,
      label: 'Coupon Fr equals face value F times coupon rate r',
    };
    if (stepId === 'coupons') return {
      nodes: <><msub><mi>P</mi><mtext>coupons</mtext></msub><mo>=</mo>{zeroRate ? <><mi>n</mi><mi>F</mi><mi>r</mi></> : <><mi>F</mi><mi>r</mi>{annuityFactor('a', 'j')}</>}</>,
      label: zeroRate ? 'Coupon value equals n times face value F times coupon rate r at zero yield' : 'Coupon value equals Fr times the annuity factor',
    };
    if (stepId === 'redemption') return {
      nodes: <><msub><mi>P</mi><mtext>redemption</mtext></msub><mo>=</mo>{zeroRate ? <mi>C</mi> : <><mi>C</mi><msup><mrow><mo>(</mo><mn>1</mn><mo>+</mo><mi>j</mi><mo>)</mo></mrow><mrow><mo>−</mo><mi>n</mi></mrow></msup></>}</>,
      label: zeroRate ? 'Redemption value equals C at zero yield' : 'Redemption value equals C times (1 plus j) to the power negative n',
    };
    if (stepId === 'price') return {
      nodes: <><mi>P</mi><mo>=</mo><msub><mi>P</mi><mtext>coupons</mtext></msub><mo>+</mo><msub><mi>P</mi><mtext>redemption</mtext></msub></>,
      label: 'Price equals coupon value plus redemption value',
    };
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
  const formula = formulaForStep(step.id, scenario, direction, timing, zeroRate);
  if (!formula) return <code>{step.expression}</code>;
  const displayedValue = step.expression.split(' = ').at(-1);
  return (
    <div className="max-w-full min-w-0">
      <div className="max-w-full overflow-x-auto py-2 text-sm">
        <math display="block" aria-label={formula.label}><mrow>{formula.nodes}</mrow></math>
      </div>
      {displayedValue && (
        <code className="block max-w-full break-all" aria-label={`${certainty === 'exact' ? 'Value' : 'Approximate value'}: ${displayedValue}`}>
          {certainty === 'exact' ? '=' : '≈'} {displayedValue}
        </code>
      )}
    </div>
  );
}
