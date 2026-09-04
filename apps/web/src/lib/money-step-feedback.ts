import { FinanceDecimal, valueAtTime } from '@amat19/domain-finance';

export type MoneyStep = { amount: string; time: string; focalDate: string; rate: string };
export type MoneyStepFeedback = {
  status: 'correct' | 'incorrect' | 'invalid' | 'model-error';
  code: 'correct' | 'invalid-exponent' | 'invalid-value' | 'time-shift' | 'cash-flow-sign' | 'arithmetic' | 'model';
  field?: 'exponent' | 'value';
  message: string;
};

/** Validate entry, diagnose the step, then explain; the finance engine remains authoritative. */
export function checkMoneyStep(step: MoneyStep, answer: { exponent: string; value: string }): MoneyStepFeedback {
  let exponent: FinanceDecimal;
  let expected: FinanceDecimal;
  try {
    exponent = FinanceDecimal.from(step.focalDate).subtract(step.time);
    expected = FinanceDecimal.from(valueAtTime(step.amount, step.time, step.focalDate, step.rate).decimalValue);
  } catch (error) {
    return { status: 'model-error', code: 'model', message: `Check the timeline inputs first. ${error instanceof Error ? error.message : ''}` };
  }

  let enteredExponent: FinanceDecimal;
  try {
    enteredExponent = FinanceDecimal.from(answer.exponent);
  } catch {
    return { status: 'invalid', code: 'invalid-exponent', field: 'exponent', message: 'Enter the time shift as a signed number, such as −3 or 0.5.' };
  }
  if (enteredExponent.compare(exponent) !== 0) {
    return { status: 'incorrect', code: 'time-shift', field: 'exponent', message: `Use focal date minus cash-flow time: ${step.focalDate} − (${step.time}). Moving backward needs a negative exponent.` };
  }

  let enteredValue: FinanceDecimal;
  try {
    enteredValue = FinanceDecimal.from(answer.value);
  } catch {
    return { status: 'invalid', code: 'invalid-value', field: 'value', message: 'Enter a signed amount without a currency symbol or commas. Round to two decimal places.' };
  }
  // Compare decimal strings rounded by the same fixed-point policy, never floats.
  if (enteredValue.toFixed(2) === expected.toFixed(2)) {
    return { status: 'correct', code: 'correct', message: 'Correct. This cash flow is now valued at the focal date (to the nearest cent).' };
  }
  if (enteredValue.compare(0) !== 0 && expected.compare(0) !== 0 && enteredValue.compare(0) !== expected.compare(0)) {
    return { status: 'incorrect', code: 'cash-flow-sign', field: 'value', message: 'Keep the cash flow’s sign. Moving its date does not change a receipt into a payment, or a payment into a receipt.' };
  }
  return { status: 'incorrect', code: 'arithmetic', field: 'value', message: `The time shift is right. Recheck ${step.amount} × (1 + ${step.rate}) raised to ${exponent.toString()}. Keep full precision until the final cent.` };
}
