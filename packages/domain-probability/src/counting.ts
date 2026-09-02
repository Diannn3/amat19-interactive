export const MAX_COUNTING_INPUT = 10_000;

function requireNonnegativeInteger(name: string, value: number, options: { positive?: boolean } = {}): void {
  if (!Number.isSafeInteger(value) || value < (options.positive ? 1 : 0)) {
    throw new RangeError(options.positive ? `${name} must be a positive safe integer.` : `${name} must be a nonnegative safe integer.`);
  }
  if (value > MAX_COUNTING_INPUT) throw new RangeError(`${name} cannot exceed the interactive counting limit of ${MAX_COUNTING_INPUT}.`);
}

function validateNR(n: number, r: number): void {
  requireNonnegativeInteger('n', n);
  requireNonnegativeInteger('r', r);
  if (r > n) throw new RangeError('Require integers with 0 ≤ r ≤ n.');
}

export function factorial(n: number): bigint {
  requireNonnegativeInteger('n', n);
  let result = 1n;
  for (let value = 2n; value <= BigInt(n); value += 1n) result *= value;
  return result;
}
export function permutations(n: number, r: number): bigint {
  validateNR(n, r);
  let result = 1n;
  for (let value = 0; value < r; value += 1) result *= BigInt(n - value);
  return result;
}
export function combinations(n: number, r: number): bigint {
  validateNR(n, r);
  const k = Math.min(r, n - r);
  let numerator = 1n, denominator = 1n;
  for (let value = 1; value <= k; value += 1) {
    numerator *= BigInt(n - k + value);
    denominator *= BigInt(value);
  }
  return numerator / denominator;
}
export function combinationsWithRepetition(n: number, r: number): bigint {
  requireNonnegativeInteger('r', r);
  requireNonnegativeInteger('n', n, { positive: true });
  const transformedN = n + r - 1;
  if (transformedN > MAX_COUNTING_INPUT) {
    throw new RangeError(`The stars-and-bars transformed n (${transformedN}) exceeds the interactive counting limit of ${MAX_COUNTING_INPUT}.`);
  }
  return combinations(transformedN, r);
}
export function arrangementsWithRepetition(choices: number, slots: number): bigint {
  requireNonnegativeInteger('Choices', choices);
  requireNonnegativeInteger('Slots', slots);
  return BigInt(choices) ** BigInt(slots);
}
export function multisetPermutations(total: number, groupSizes: number[]): bigint {
  requireNonnegativeInteger('Total', total);
  if (groupSizes.length > MAX_COUNTING_INPUT) throw new RangeError(`Group count cannot exceed ${MAX_COUNTING_INPUT}.`);
  for (const size of groupSizes) requireNonnegativeInteger('Group size', size);
  if (groupSizes.reduce((sum, value) => sum + value, 0) !== total) throw new RangeError('Group sizes must sum to the total.');
  return groupSizes.reduce((value, size) => value / factorial(size), factorial(total));
}
export type CountingDecisionInput = { orderMatters: boolean; repetitionAllowed: boolean; chooseAll?: boolean; };
export type CountingDecision = {
  method: 'permutation' | 'combination' | 'arrangements-with-repetition' | 'combination-with-repetition';
  label: string; reason: string;
};
export function recommendCountingMethod(input: CountingDecisionInput): CountingDecision {
  if (input.orderMatters && input.repetitionAllowed) return {
    method: 'arrangements-with-repetition',
    label: 'Multiplication rule / arrangements with repetition',
    reason: 'Order matters and the same choice may be used again, so each position keeps the full choice set.'
  };
  if (input.orderMatters) return { method: 'permutation', label: 'Permutation', reason: 'Order matters and selected objects cannot repeat.' };
  if (!input.repetitionAllowed) return { method: 'combination', label: 'Combination', reason: 'Only the selected group matters; rearranging the same chosen objects does not create a new outcome.' };
  return { method: 'combination-with-repetition', label: 'Combination with repetition', reason: 'Order does not matter and choices may repeat, so use the stars-and-bars count C(n + r − 1, r).' };
}
