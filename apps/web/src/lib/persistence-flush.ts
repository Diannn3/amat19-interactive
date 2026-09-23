export const PERSISTENCE_FLUSH_EVENT = 'amat:before-update';

export type PersistenceFlushTask = () => Promise<unknown> | unknown;

export type PersistenceFlushDetail = {
  tasks: PersistenceFlushTask[];
};

export type PersistenceFlushResult = {
  ok: boolean;
  errors: unknown[];
};

export function deferPersistenceTask(
  task: PersistenceFlushTask,
  ready: Promise<boolean>
): PersistenceFlushTask {
  return async () => {
    if (!(await ready)) return false;
    return task();
  };
}

function failedResult(result: PromiseSettledResult<unknown>): unknown | undefined {
  if (result.status === 'rejected') return result.reason;
  return result.value === false ? new Error('A persistence task reported failure.') : undefined;
}

export async function flushPersistenceTasks(
  tasks: readonly PersistenceFlushTask[]
): Promise<PersistenceFlushResult> {
  const results = await Promise.allSettled(tasks.map((task) => Promise.resolve().then(task)));
  const errors = results.map(failedResult).filter((error): error is unknown => error !== undefined);
  return { ok: errors.length === 0, errors };
}
