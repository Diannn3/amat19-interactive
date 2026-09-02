import { DexiePersistence } from '@amat19/persistence';
import { useEffect, useRef } from 'react';
import type { TruthTable } from '@amat19/domain-logic';
import type { TruthLabState } from './logic-state';
import { createAttemptId, recordAssessmentResult } from '../../../lib/local-progress';
import { truthTableProblemFingerprint } from '../../../lib/problem-fingerprint';

function practiceFingerprint(table: TruthTable, practiceColumnId: string): string { return truthTableProblemFingerprint(table,'practice',practiceColumnId); }
const PRACTICE_EXERCISE_ID='logic.truth-table.practice';


export function useTruthPracticePersistence(state: TruthLabState, table: TruthTable | undefined, practiceColumnId?: string): void {
  const attemptIdRef = useRef(createAttemptId('truth-practice'));
  const startedAtRef = useRef(new Date().toISOString());
  const masteredRef = useRef(false);
  const revealRecordedRef = useRef(false);
  const fingerprintRef = useRef<string | undefined>(undefined);
  const wrongRowsRef = useRef<Set<number>>(new Set());
  const recordedWrongRowsRef = useRef<Set<number>>(new Set());

  const fingerprint = table && practiceColumnId ? practiceFingerprint(table, practiceColumnId) : undefined;

  useEffect(() => {
    if (!fingerprint || fingerprintRef.current === fingerprint) return;
    fingerprintRef.current = fingerprint;
    attemptIdRef.current = createAttemptId('truth-practice');
    startedAtRef.current = new Date().toISOString();
    masteredRef.current = false;
    revealRecordedRef.current = false;
    wrongRowsRef.current = new Set();
    recordedWrongRowsRef.current = new Set();
  }, [fingerprint]);

  useEffect(() => {
    if (state.mode !== 'practice' || !table || !practiceColumnId || !fingerprint) return;
    const entries = Object.entries(state.practiceGuesses);
    if (entries.length === 0 && !state.revealedPractice) return;

    for (const [row, guess] of entries) {
      const rowIndex = Number(row);
      if (guess.status !== 'wrong') continue;
      wrongRowsRef.current.add(rowIndex);
      if (!recordedWrongRowsRef.current.has(rowIndex)) {
        recordedWrongRowsRef.current.add(rowIndex);
        void recordAssessmentResult({
          prefix: 'truth-practice',
          attemptId: attemptIdRef.current,
          startedAt: startedAtRef.current,
          exerciseId: PRACTICE_EXERCISE_ID,
          problemFingerprint: fingerprint,
          module: 'logic',
          skillId: 'logic.truth-table.evaluate',
          result: 'incorrect',
          firstAttemptCorrect: false,
          incorrectAttempts: wrongRowsRef.current.size,
          hintsUsed: state.hintVisible ? 1 : 0,
          revealsUsed: 0,
          difficulty: 'standard',
          payload: { expression: table.expression, practiceColumnId, rowIndex, guess },
        }).catch(() => undefined);
      }
    }

    const guesses = entries.map(([, guess]) => guess);
    const complete = guesses.length === table.rows.length && guesses.every((guess) => guess.status === 'correct');
    const timer = !complete && !state.revealedPractice ? window.setTimeout(() => {
      try {
        const db = new DexiePersistence();
        void db.saveAttempt({
          attemptId: attemptIdRef.current,
          exerciseId: PRACTICE_EXERCISE_ID,
          module: 'logic',
          startedAt: startedAtRef.current,
          updatedAt: new Date().toISOString(),
          finalState: 'incomplete',
          payload: {
            problemFingerprint: fingerprint,
            expression: table.expression,
            practiceColumnId,
            guesses: state.practiceGuesses,
            hintUsed: state.hintVisible,
            revealed: false,
          },
          skillIds: ['logic.truth-table.evaluate'],
          difficulty: 'standard',
        });
      } catch {
        // Persistence is progressive enhancement; mathematical interaction remains available.
      }
    }, 250) : undefined;

    if (state.revealedPractice && !revealRecordedRef.current) {
      revealRecordedRef.current = true;
      masteredRef.current = true;
      void recordAssessmentResult({
        prefix: 'truth-practice',
        attemptId: attemptIdRef.current,
        startedAt: startedAtRef.current,
        exerciseId: PRACTICE_EXERCISE_ID,
        problemFingerprint: fingerprint,
        module: 'logic',
        skillId: 'logic.truth-table.evaluate',
        result: 'revealed',
        firstAttemptCorrect: false,
        incorrectAttempts: wrongRowsRef.current.size,
        hintsUsed: state.hintVisible ? 1 : 0,
        revealsUsed: 1,
        difficulty: 'standard',
        payload: { expression: table.expression, practiceColumnId, guesses: state.practiceGuesses },
      }).catch(() => undefined);
    } else if (complete && !masteredRef.current) {
      masteredRef.current = true;
      void recordAssessmentResult({
        prefix: 'truth-practice',
        attemptId: attemptIdRef.current,
        startedAt: startedAtRef.current,
        exerciseId: PRACTICE_EXERCISE_ID,
        problemFingerprint: fingerprint,
        module: 'logic',
        skillId: 'logic.truth-table.evaluate',
        result: 'correct',
        firstAttemptCorrect: wrongRowsRef.current.size === 0 && !state.hintVisible,
        incorrectAttempts: wrongRowsRef.current.size,
        hintsUsed: state.hintVisible ? 1 : 0,
        revealsUsed: 0,
        difficulty: 'standard',
        payload: { expression: table.expression, practiceColumnId, guesses: state.practiceGuesses },
      }).catch(() => undefined);
    }
    return () => { if (timer !== undefined) window.clearTimeout(timer); };
  }, [state.mode, state.practiceGuesses, state.hintVisible, state.revealedPractice, table, practiceColumnId, fingerprint]);
}
