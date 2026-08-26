import { DexiePersistence } from '@amat19/persistence';
import { useEffect, useRef } from 'react';
import type { Dispatch } from 'react';
import type { TruthLabAction } from './logic-state';

const LAB_ID = 'logic.truth-table';
const CONTENT_VERSION = '1';

export function useDraftPersistence(expression: string, dispatch: Dispatch<TruthLabAction>): void {
  const dbRef = useRef<DexiePersistence | null>(null);
  const restoredRef = useRef(false);

  useEffect(() => {
    try {
      dbRef.current = new DexiePersistence();
      dbRef.current
        .getLabDraft<{ expression?: string }>(LAB_ID)
        .then((draft) => {
          if (draft?.contentVersion === CONTENT_VERSION && draft.state.expression) {
            dispatch({ type: 'restore-expression', expression: draft.state.expression });
          } else {
            dispatch({ type: 'set-persistence-status', status: 'idle' });
          }
          restoredRef.current = true;
        })
        .catch(() => {
          restoredRef.current = true;
          dispatch({ type: 'set-persistence-status', status: 'unavailable' });
        });
    } catch {
      restoredRef.current = true;
      dispatch({ type: 'set-persistence-status', status: 'unavailable' });
    }
  }, [dispatch]);

  useEffect(() => {
    if (!restoredRef.current || !dbRef.current) return;
    dispatch({ type: 'set-persistence-status', status: 'idle' });
    const timer = window.setTimeout(() => {
      dbRef.current
        ?.saveLabDraft({
          labId: LAB_ID,
          contentVersion: CONTENT_VERSION,
          updatedAt: new Date().toISOString(),
          state: { expression }
        })
        .then(() => dispatch({ type: 'set-persistence-status', status: 'saved' }))
        .catch(() => dispatch({ type: 'set-persistence-status', status: 'unavailable' }));
    }, 350);

    return () => window.clearTimeout(timer);
  }, [expression, dispatch]);
}
