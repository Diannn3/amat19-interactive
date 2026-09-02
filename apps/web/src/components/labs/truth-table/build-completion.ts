export type TruthBuildGuess = { value: boolean; ok: boolean };

export type TruthBuildGuessResult = {
  nextGuesses: Record<number, TruthBuildGuess>;
  ok: boolean;
  complete: boolean;
};

/**
 * Apply one truth-table row guess and derive completion from the resulting state.
 *
 * This deliberately computes completion from `nextGuesses`, not from React's stale
 * pre-update state. A build is complete only when every required row has been
 * attempted and every stored row guess is currently correct.
 */
export function applyTruthBuildGuess(
  current: Readonly<Record<number, TruthBuildGuess>>,
  rowIndex: number,
  value: boolean,
  expected: boolean,
  rowCount: number,
): TruthBuildGuessResult {
  if (!Number.isInteger(rowIndex) || rowIndex < 0 || rowIndex >= rowCount) {
    throw new RangeError('Truth-table row index is outside the current table.');
  }
  if (!Number.isInteger(rowCount) || rowCount < 1) {
    throw new RangeError('Truth-table row count must be a positive integer.');
  }

  const ok = value === expected;
  const nextGuesses = { ...current, [rowIndex]: { value, ok } };
  const guesses = Object.values(nextGuesses);
  const complete = guesses.length === rowCount && guesses.every((guess) => guess.ok);
  return { nextGuesses, ok, complete };
}
