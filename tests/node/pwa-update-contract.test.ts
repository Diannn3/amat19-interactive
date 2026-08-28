import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('PWA update activation waits for the application persistence contract', async () => {
  const source = await readFile(new URL('../../apps/web/src/layouts/AppLayout.astro', import.meta.url), 'utf8');
  const hook = await readFile(new URL('../../apps/web/src/lib/use-persistence-flush.ts', import.meta.url), 'utf8');

  assert.match(source, /new CustomEvent\('amat:before-update',\s*\{\s*detail:\s*\{\s*tasks\s*\}\s*\}\)/);
  assert.match(source, /Promise\.allSettled\(tasks\.map/);
  assert.match(source, /waitingWorker\.postMessage\(\{ type: 'SKIP_WAITING' \}\)/);
  assert.doesNotMatch(source, /setTimeout\(\(\) => waitingWorker\.postMessage/);
  assert.match(hook, /deferPersistenceTask/);
  assert.doesNotMatch(hook, /if \(!enabled\) return undefined/);
});
