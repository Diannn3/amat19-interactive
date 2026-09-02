export type ConditionalCellKey = 'aAndB' | 'aAndNotB' | 'notAAndB' | 'notAAndNotB';
export type ConditionalCountInputs = Record<ConditionalCellKey, string>;
export type ConditionalParsedCounts = Record<ConditionalCellKey, bigint>;
export type ConditionalCountParse =
  | { kind: 'valid'; value: bigint }
  | { kind: 'incomplete' }
  | { kind: 'invalid'; message: string };

export function parseConditionalCountInput(value: string): ConditionalCountParse {
  const text = value.trim();
  if (!text) return { kind: 'incomplete' };
  if (!/^\d+$/.test(text)) return { kind: 'invalid', message: 'Use a nonnegative whole-number count.' };
  try { return { kind: 'valid', value: BigInt(text) }; }
  catch { return { kind: 'invalid', message: 'This count is too large or malformed.' }; }
}

export function parseConditionalCounts(input: ConditionalCountInputs): {
  value?: ConditionalParsedCounts;
  errors: Partial<Record<ConditionalCellKey, string>>;
  incomplete: boolean;
} {
  const errors: Partial<Record<ConditionalCellKey, string>> = {};
  const parsed = {} as ConditionalParsedCounts;
  let incomplete = false;
  for (const key of Object.keys(input) as ConditionalCellKey[]) {
    const result = parseConditionalCountInput(input[key]);
    if (result.kind === 'valid') parsed[key] = result.value;
    else if (result.kind === 'incomplete') incomplete = true;
    else errors[key] = result.message;
  }
  return { value: !incomplete && Object.keys(errors).length === 0 ? parsed : undefined, errors, incomplete };
}
