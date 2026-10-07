import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('PWA update activation waits for persistence and has a bounded failure path', async () => {
  const source = await readFile(new URL('../../apps/web/src/lib/release-update.ts', import.meta.url), 'utf8');
  const hook = await readFile(new URL('../../apps/web/src/lib/use-persistence-flush.ts', import.meta.url), 'utf8');

  assert.match(source, /new CustomEvent\('amat:before-update',\s*\{\s*detail:\s*\{\s*tasks\s*\}\s*\}\)/);
  assert.match(source, /PERSISTENCE_FLUSH_TIMEOUT_MS\s*=\s*8000/);
  assert.match(source, /COORDINATE_UPDATE/);
  assert.match(source, /UPDATE_SAVED/);
  assert.match(source, /main.inert = true/);
  assert.doesNotMatch(source, /SKIP_WAITING/);
  assert.match(hook, /deferPersistenceTask/);
  assert.doesNotMatch(hook, /if \(!enabled\) return undefined/);
});
