import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { runInNewContext } from 'node:vm';

test('generated production worker keeps v6 rescue semantics after revision stamping', async () => {
  const source = await readFile(new URL('../../apps/web/dist/sw.js', import.meta.url), 'utf8');
  assert.match(source, /RELEASE\s*=\s*['"]amat19-blueprint-v6['"]/);
  assert.match(source, /BUILD_REVISION\s*=\s*['"][a-f0-9]{16}['"]/);
  assert.doesNotMatch(source, /__AMAT19_BUILD_REVISION__/);

  const handlers = new Map();
  let skipWaitingCalled = false;
  runInNewContext(source, {
    console: { warn: () => {} },
    self: {
      addEventListener: (type: string, handler: unknown) => handlers.set(type, handler),
      skipWaiting: async () => { skipWaitingCalled = true; },
    },
    caches: {
      keys: async () => ['amat19-blueprint-v5-oldrevision-pages'],
      open: async () => ({ addAll: async () => {} }),
    },
    fetch: async () => ({
      ok: true,
      json: async () => ({ assets: ['/_astro/example.js'] }),
    }),
  });

  let installation: Promise<unknown> | undefined;
  handlers.get('install')({ waitUntil: (promise: Promise<unknown>) => { installation = promise; } });
  await installation;
  assert.equal(skipWaitingCalled, true);
});

test('generated production worker does not force-activate an ordinary v6-to-v6 update', async () => {
  const source = await readFile(new URL('../../apps/web/dist/sw.js', import.meta.url), 'utf8');
  const handlers = new Map();
  let skipWaitingCalled = false;

  runInNewContext(source, {
    self: {
      addEventListener: (type: string, handler: unknown) => handlers.set(type, handler),
      skipWaiting: async () => { skipWaitingCalled = true; },
    },
    caches: {
      keys: async () => ['amat19-blueprint-v6-previousrevision-pages'],
      open: async () => ({ addAll: async () => {} }),
    },
    fetch: async () => ({
      ok: true,
      json: async () => ({ assets: ['/_astro/example.js'] }),
    }),
  });

  let installation: Promise<unknown> | undefined;
  handlers.get('install')({ waitUntil: (promise: Promise<unknown>) => { installation = promise; } });
  await installation;
  assert.equal(skipWaitingCalled, false);
});
