import type { CheckResult } from './contracts.ts';

export function checkTruthGuess(input: {
  expected: boolean;
  guess: boolean;
  rowIndex: number;
  objectId: string;
}): CheckResult {
  if (input.expected === input.guess) {
    return {
      ok: true,
      scope: { objectId: input.objectId, stepId: `row-${input.rowIndex}` },
      kind: 'correct',
      message: `Row ${input.rowIndex + 1} is correct.`
    };
  }

  return {
    ok: false,
    scope: { objectId: input.objectId, stepId: `row-${input.rowIndex}` },
    kind: 'wrong-result',
    message: `Re-evaluate row ${input.rowIndex + 1} using the connective rule before changing another row.`,
    nextHintId: 'inspect-selected-cell'
  };
}
