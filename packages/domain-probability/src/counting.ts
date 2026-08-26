export function factorial(n: number): bigint {
  if (!Number.isInteger(n) || n < 0) throw new RangeError('n must be a nonnegative integer.');
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
  if (!Number.isInteger(n) || !Number.isInteger(r) || n < 1 || r < 0) throw new RangeError('Require integers with n ≥ 1 and r ≥ 0.');
  return combinations(n + r - 1, r);
}
export function arrangementsWithRepetition(choices: number, slots: number): bigint {
  if (!Number.isInteger(choices) || choices < 0 || !Number.isInteger(slots) || slots < 0) throw new RangeError('Choices and slots must be nonnegative integers.');
  return BigInt(choices) ** BigInt(slots);
}
export function multisetPermutations(total: number, groupSizes: number[]): bigint {
  if (!Number.isInteger(total) || total < 0) throw new RangeError('Total must be a nonnegative integer.');
  if (groupSizes.some((size) => !Number.isInteger(size) || size < 0)) throw new RangeError('Group sizes must be nonnegative integers.');
  if (groupSizes.reduce((sum, value) => sum + value, 0) !== total) throw new RangeError('Group sizes must sum to the total.');
  return groupSizes.reduce((value, size) => value / factorial(size), factorial(total));
}
function validateNR(n: number, r: number): void {
  if (!Number.isInteger(n) || !Number.isInteger(r) || n < 0 || r < 0 || r > n) throw new RangeError('Require integers with 0 ≤ r ≤ n.');
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
