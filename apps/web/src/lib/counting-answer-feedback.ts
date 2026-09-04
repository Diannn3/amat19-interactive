import { recommendCountingMethod } from '@amat19/domain-probability';

export type CountingMethod = ReturnType<typeof recommendCountingMethod>['method'];

export type CountingAnswerFeedback = {
  status: 'correct' | 'incorrect' | 'incomplete';
  message: string;
};

export const COUNTING_METHOD_OPTIONS: readonly { value: CountingMethod; label: string }[] = [
  { value: 'permutation', label: 'Permutation · order, no repeats' },
  { value: 'combination', label: 'Combination · no order, no repeats' },
  { value: 'arrangements-with-repetition', label: 'Arrangements · order, repeats' },
  { value: 'combination-with-repetition', label: 'Combination · no order, repeats' },
];

export function isCountingMethod(value: unknown): value is CountingMethod {
  return COUNTING_METHOD_OPTIONS.some((option) => option.value === value);
}

/** Check the learner's model choice without exposing the exact count on a wrong attempt. */
export function checkCountingModel(choice: CountingMethod | '', expected: CountingMethod): CountingAnswerFeedback {
  if (!choice) return { status: 'incomplete', message: 'Choose the counting model that matches the two rules.' };
  if (choice === expected) return { status: 'correct', message: 'Correct model. The exact count is ready to inspect.' };
  return { status: 'incorrect', message: 'Recheck whether order changes the outcome and whether a choice may repeat.' };
}
