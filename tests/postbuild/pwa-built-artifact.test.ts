import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { runInNewContext } from 'node:vm';

class FakeMessageChannel {
  port1: { onmessage?: (event: { data: unknown }) => void } = {};
  port2 = {
    postMessage: (data: unknown) => this.port1.onmessage?.({ data }),
  };
}

test('generated production worker keeps v7 rescue semantics after revision stamping', async () => {
  const source = await readFile(new URL('../../apps/web/dist/sw.js', import.meta.url), 'utf8');
  assert.match(source, /RELEASE\s*=\s*['"]amat19-blueprint-v7['"]/);
  assert.match(source, /BUILD_REVISION\s*=\s*['"][a-f0-9]{16}['"]/);
  assert.doesNotMatch(source, /__AMAT19_BUILD_REVISION__/);

  const handlers = new Map();
  let skipWaitingCalled = false;
  runInNewContext(source, {
    console: { warn: () => {} },
    MessageChannel: FakeMessageChannel,
    setTimeout,
    clearTimeout,
    self: {
      registration: { active: null },
      addEventListener: (type: string, handler: unknown) => handlers.set(type, handler),
      skipWaiting: async () => { skipWaitingCalled = true; },
    },
    caches: {
      keys: async () => ['amat19-blueprint-v6-oldrevision-pages'],
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

test('generated v7 worker replaces an active v6 controller even if legacy caches were cleared', async () => {
  const source = await readFile(new URL('../../apps/web/dist/sw.js', import.meta.url), 'utf8');
  const handlers = new Map();
  let skipWaitingCalled = false;

  runInNewContext(source, {
    console: { warn: () => {} },
    MessageChannel: FakeMessageChannel,
    setTimeout,
    clearTimeout,
    self: {
      registration: {
        active: {
          postMessage(_message: unknown, ports: Array<{ postMessage: (data: unknown) => void }>) {
            ports[0]?.postMessage({ release: 'amat19-blueprint-v6', version: 'amat19-blueprint-v6-previousrevision' });
          },
        },
      },
      addEventListener: (type: string, handler: unknown) => handlers.set(type, handler),
      skipWaiting: async () => { skipWaitingCalled = true; },
    },
    caches: {
      keys: async () => [],
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

test('generated production worker keeps ordinary v7-to-v7 updates learner-controlled', async () => {
  const source = await readFile(new URL('../../apps/web/dist/sw.js', import.meta.url), 'utf8');
  const handlers = new Map();
  let skipWaitingCalled = false;

  runInNewContext(source, {
    MessageChannel: FakeMessageChannel,
    setTimeout,
    clearTimeout,
    self: {
      registration: {
        active: {
          postMessage(_message: unknown, ports: Array<{ postMessage: (data: unknown) => void }>) {
            ports[0]?.postMessage({ release: 'amat19-blueprint-v7', version: 'amat19-blueprint-v7-previousrevision' });
          },
        },
      },
      addEventListener: (type: string, handler: unknown) => handlers.set(type, handler),
      skipWaiting: async () => { skipWaitingCalled = true; },
    },
    caches: {
      keys: async () => ['amat19-blueprint-v7-previousrevision-pages'],
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

test('production build publishes a no-guessing commit fingerprint', async () => {
  const version = JSON.parse(await readFile(new URL('../../apps/web/dist/version.json', import.meta.url), 'utf8'));
  assert.equal(version.release, 'amat19-blueprint-v7');
  assert.match(version.revision, /^[a-f0-9]{16}$/);
  assert.ok(version.commit === 'local' || /^[a-f0-9]{40}$/.test(version.commit));
  assert.doesNotThrow(() => new Date(version.builtAt).toISOString());
});
