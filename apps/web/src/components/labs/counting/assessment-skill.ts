export type CountingMethod = 'permutation' | 'combination' | 'arrangements-with-repetition' | 'combination-with-repetition';
export type CountingAssessmentSkill = 'probability.counting.permutation' | 'probability.counting.combination' | 'probability.counting.product-rule';

/**
 * Map only to skills that already exist in the canonical course skill graph.
 * Combination-with-repetition intentionally returns undefined: the lab supports
 * the computation, but the current graph has no dedicated assessable leaf and
 * Pass 1 must not invent one.
 */
export function countingAssessmentSkill(method: CountingMethod): CountingAssessmentSkill | undefined {
  if (method === 'permutation') return 'probability.counting.permutation';
  if (method === 'combination') return 'probability.counting.combination';
  if (method === 'arrangements-with-repetition') return 'probability.counting.product-rule';
  return undefined;
}
