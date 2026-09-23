import { Rational } from '@amat19/math-core';

export type OptimizationAnswerFeedback = {
  status: 'correct' | 'incorrect' | 'invalid';
  message: string;
};

export type ExactCorner = { x: Rational; y: Rational };
export type DominanceChoice = 'none' | 'row:1>2' | 'row:2>1' | 'column:1>2' | 'column:2>1';
export type DominancePair = { kind: 'row' | 'column'; dominated: number; by: number };
export type ModelStatus = 'optimal' | 'infeasible' | 'unbounded';

/** Check the learner's chosen corner without putting the target coordinates in wrong-answer feedback. */
export function checkBestCornerAnswer(rawX: string, rawY: string, expected: readonly ExactCorner[]): OptimizationAnswerFeedback {
  try {
    const x = Rational.parse(rawX);
    const y = Rational.parse(rawY);
    if (expected.some((point) => point.x.equals(x) && point.y.equals(y))) {
      return { status: 'correct', message: 'Correct. That corner gives the best feasible objective value.' };
    }
    return { status: 'incorrect', message: 'Recheck the feasible corner; evaluate the objective at the point you chose.' };
  } catch {
    return { status: 'invalid', message: 'Enter exact x and y coordinates, such as 3 and 1 or 1/2.' };
  }
}

/** Check whether the learner identified a strict dominance relationship without exposing the target pair. */
export function checkDominanceAnswer(choice: DominanceChoice, expected: readonly DominancePair[]): OptimizationAnswerFeedback {
  const expectedChoices = expected.map((pair) => `${pair.kind}:${pair.dominated + 1}>${pair.by + 1}` as DominanceChoice);
  if ((expected.length === 0 && choice === 'none') || expectedChoices.includes(choice)) {
    return { status: 'correct', message: expected.length === 0 ? 'Correct. No strategy is strictly dominated.' : 'Correct. That comparison establishes strict dominance.' };
  }
  return { status: 'incorrect', message: 'Recheck every payoff in the comparison; strict dominance requires an improvement in every cell.' };
}

/** Check the model classification needed before revealing an infeasible or unbounded result. */
export function checkModelStatus(choice: ModelStatus, expected: ModelStatus): OptimizationAnswerFeedback {
  if (choice === expected) return { status: 'correct', message: 'Correct. That classification matches the model.' };
  return { status: 'incorrect', message: 'Recheck the constraints and the direction in which the objective can move.' };
}
