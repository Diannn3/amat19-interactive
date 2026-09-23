import { Rational } from '@amat19/math-core';

export type ProbabilityAnswerFeedback = {
  status: 'correct' | 'incorrect' | 'invalid';
  message: string;
};

/** Compare a learner's exact probability without putting the target in an error message. */
export function checkProbabilityAnswer(raw: string, expected: Rational, label: string): ProbabilityAnswerFeedback {
  try {
    const answer = Rational.parse(raw);
    if (answer.equals(expected)) {
      return { status: 'correct', message: `Correct. Your ${label} is exact.` };
    }
    return { status: 'incorrect', message: `Recheck the ${label}; compare the favorable path with the correct denominator.` };
  } catch {
    return { status: 'invalid', message: `Enter an exact probability for the ${label}, such as 1/2 or 0.5.` };
  }
}
