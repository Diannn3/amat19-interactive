import { useEffect, useRef } from 'react';
import {
  PERSISTENCE_FLUSH_EVENT,
  deferPersistenceTask,
  type PersistenceFlushDetail,
  type PersistenceFlushTask
} from './persistence-flush';

type PersistenceReadiness = {
  promise: Promise<boolean>;
  resolve: (ready: boolean) => void;
};

function createPersistenceReadiness(): PersistenceReadiness {
  let resolve!: (ready: boolean) => void;
  const promise = new Promise<boolean>((settle) => { resolve = settle; });
  return { promise, resolve };
}

export function usePersistenceFlush(task: PersistenceFlushTask, ready = true) {
  const taskRef = useRef(task);
  taskRef.current = task;
  const readinessRef = useRef<PersistenceReadiness | null>(null);
  if (!readinessRef.current) readinessRef.current = createPersistenceReadiness();
  const readiness = readinessRef.current;

  useEffect(() => {
    if (ready) readiness.resolve(true);
  }, [ready, readiness]);

  useEffect(() => () => readiness.resolve(false), [readiness]);

  useEffect(() => {
    const handleFlushRequest = (event: Event) => {
      const detail = (event as CustomEvent<PersistenceFlushDetail>).detail;
      if (!detail || !Array.isArray(detail.tasks)) return;
      detail.tasks.push(deferPersistenceTask(() => taskRef.current(), readiness.promise));
    };

    window.addEventListener(PERSISTENCE_FLUSH_EVENT, handleFlushRequest);
    return () => window.removeEventListener(PERSISTENCE_FLUSH_EVENT, handleFlushRequest);
  }, [readiness]);
}
