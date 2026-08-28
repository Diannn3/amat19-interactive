import assert from 'node:assert/strict';
import test from 'node:test';
import { deferPersistenceTask, flushPersistenceTasks } from '../../apps/web/src/lib/persistence-flush.ts';

test('persistence flush waits for every task before reporting success', async () => {
  let release!: () => void;
  const pending = new Promise<void>((resolve) => { release = resolve; });
  const order: string[] = [];

  const resultPromise = flushPersistenceTasks([
    async () => { await pending; order.push('draft'); },
    () => { order.push('progress'); }
  ]);

  await new Promise<void>((resolve) => setImmediate(resolve));
  assert.deepEqual(order, ['progress']);

  release();
  const result = await resultPromise;
  assert.equal(result.ok, true);
  assert.deepEqual(order, ['progress', 'draft']);
});

test('persistence flush fails closed for rejected and false-returning tasks', async () => {
  const result = await flushPersistenceTasks([
    () => false,
    async () => { throw new Error('IndexedDB unavailable'); }
  ]);

  assert.equal(result.ok, false);
  assert.equal(result.errors.length, 2);
});

test('a persistence task waits for draft restoration before writing', async () => {
  let release!: (ready: boolean) => void;
  const ready = new Promise<boolean>((resolve) => { release = resolve; });
  let writes = 0;
  const flush = deferPersistenceTask(() => { writes += 1; return true; }, ready);
  const resultPromise = flush();

  await new Promise<void>((resolve) => setImmediate(resolve));
  assert.equal(writes, 0);

  release(true);
  assert.equal(await resultPromise, true);
  assert.equal(writes, 1);
});

test('a persistence task fails closed when its draft never becomes ready', async () => {
  let writes = 0;
  const flush = deferPersistenceTask(() => { writes += 1; return true; }, Promise.resolve(false));

  assert.equal(await flush(), false);
  assert.equal(writes, 0);
});
