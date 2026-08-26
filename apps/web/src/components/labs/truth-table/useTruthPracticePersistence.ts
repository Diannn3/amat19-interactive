import { DexiePersistence } from '@amat19/persistence';
import { useEffect, useRef } from 'react';
import type { TruthTable } from '@amat19/domain-logic';
import type { TruthLabState } from './logic-state';
import { recordSkillEvidence } from '../../../lib/local-progress';

export function useTruthPracticePersistence(state: TruthLabState, table: TruthTable | undefined, practiceColumnId?: string): void {
  const attemptIdRef = useRef(`truth-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
  const startedAtRef = useRef(new Date().toISOString());
  const masteredRef = useRef(false);

  useEffect(() => {
    if (state.mode !== 'practice' || !table || !practiceColumnId) return;
    const guesses = Object.values(state.practiceGuesses);
    if (guesses.length === 0) return;

    const complete = guesses.length === table.rows.length && guesses.every((guess) => guess.status === 'correct');
    const timer = window.setTimeout(() => {
      try {
        const db = new DexiePersistence();
        void db.saveAttempt({
          attemptId: attemptIdRef.current,
          exerciseId: `logic.truth-table.${practiceColumnId}`,
          module: 'logic',
          startedAt: startedAtRef.current,
          updatedAt: new Date().toISOString(),
          finalState: state.revealedPractice ? 'revealed' : complete ? 'correct' : 'incomplete',
          payload: {
            expression: table.expression,
            practiceColumnId,
            guesses: state.practiceGuesses,
            hintUsed: state.hintVisible,
            revealed: state.revealedPractice
          }
        });
      } catch {
        // Persistence is progressive enhancement; mathematical interaction remains available.
      }
    }, 250);

    if (complete && !state.revealedPractice && !masteredRef.current) {
      masteredRef.current = true;
      void recordSkillEvidence('logic.truth-values', state.hintVisible ? 0.9 : 1).catch(() => undefined);
    }
    return () => window.clearTimeout(timer);
  }, [state.mode, state.practiceGuesses, state.hintVisible, state.revealedPractice, table, practiceColumnId]);
}
