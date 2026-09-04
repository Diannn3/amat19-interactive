import { formatLogic, parseLogic } from '@amat19/domain-logic';

export type LogicTranslationPrompt = {
  id: 'if-then' | 'only-if' | 'necessary' | 'and-not' | 'iff';
  sentence: string;
  expected: string;
  explanation: string;
};

export type LogicTranslationFeedback = {
  status: 'correct' | 'incorrect' | 'invalid';
  message: string;
};

/** A bounded set of course-language templates keeps translation practice predictable and honest. */
export const LOGIC_TRANSLATION_PROMPTS: readonly LogicTranslationPrompt[] = [
  { id: 'if-then', sentence: 'If P, then Q.', expected: 'P → Q', explanation: 'The condition is the antecedent; the result follows it.' },
  { id: 'only-if', sentence: 'P only if Q.', expected: 'P → Q', explanation: '“Only if” makes Q necessary whenever P is true.' },
  { id: 'necessary', sentence: 'Q is necessary for P.', expected: 'P → Q', explanation: 'A necessary condition belongs on the right side of the implication.' },
  { id: 'and-not', sentence: 'P and Q, but not R.', expected: 'P ∧ Q ∧ ∼R', explanation: '“But not R” adds a negated third proposition to the conjunction.' },
  { id: 'iff', sentence: 'P if and only if Q.', expected: 'P ↔ Q', explanation: '“If and only if” makes the two propositions equivalent.' },
];

/** Compare a symbolic answer using the course parser, while keeping wrong-answer feedback local. */
export function checkLogicTranslation(raw: string, expected: string): LogicTranslationFeedback {
  try {
    const answer = formatLogic(parseLogic(raw));
    const target = formatLogic(parseLogic(expected));
    if (answer === target) return { status: 'correct', message: 'Correct. Your symbolic form matches the statement.' };
    return { status: 'incorrect', message: 'Recheck the connective, implication direction, and scope of any negation.' };
  } catch {
    return { status: 'invalid', message: 'Enter a complete symbolic statement using the notation shown below.' };
  }
}
