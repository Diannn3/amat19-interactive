import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { runInNewContext } from 'node:vm';

test('service worker precaches canonical workbenches and local-first workspace routes', async () => {
  const source = await readFile(new URL('../../apps/web/public/sw.js', import.meta.url), 'utf8');
  for (const route of ['/study','/saved','/settings','/modules/applications','/workbenches/logic','/workbenches/probability','/workbenches/finance','/workbenches/linear']) {
    assert.match(source, new RegExp(`['\\"]${route.replace('/', '\\/')}['\\"]`));
  }
  assert.doesNotMatch(source, /['"]\/workbenches\/applications['"]/);
});

test('navigation fallback ignores query strings and uses a bounded network wait', async () => {
  const source = await readFile(new URL('../../apps/web/public/sw.js', import.meta.url), 'utf8');
  assert.match(source, /ignoreSearch:\s*true/);
  assert.match(source, /AbortController/);
  assert.match(source, /NAVIGATION_TIMEOUT_MS\s*=\s*4000/);
});

test('explicit browser reloads bypass the normal four-second stale-page fallback', async () => {
  const source = await readFile(new URL('../../apps/web/public/sw.js', import.meta.url), 'utf8');
  assert.match(source, /request\.cache\s*===\s*['"]reload['"]/);
  assert.match(source, /request\.cache\s*===\s*['"]no-cache['"]/);
  assert.match(source, /async function freshReload/);
  assert.match(source, /fetch\(request,\s*\{\s*cache:\s*['"]no-store['"]\s*\}\)/);
});

test('v6 keeps a stable release family separate from the generated build revision', async () => {
  const [source, buildScript] = await Promise.all([
    readFile(new URL('../../apps/web/public/sw.js', import.meta.url), 'utf8'),
    readFile(new URL('../../scripts/build-offline-assets.mjs', import.meta.url), 'utf8'),
  ]);
  assert.match(source, /RELEASE\s*=\s*['"]amat19-blueprint-v6['"]/);
  assert.match(source, /BUILD_REVISION\s*=\s*['"]__AMAT19_BUILD_REVISION__['"]/);
  assert.match(source, /const VERSION\s*=\s*`\$\{RELEASE\}-\$\{BUILD_REVISION\}`/);
  assert.match(buildScript, /BUILD_REVISION/);
  assert.match(buildScript, /__AMAT19_BUILD_REVISION__/);
  assert.doesNotMatch(buildScript, /replace\([^\n]*const VERSION/);
});

test('fresh v6 install does not force-activate when no legacy cache exists', async () => {
  const source = await readFile(new URL('../../apps/web/public/sw.js', import.meta.url), 'utf8');
  const handlers = new Map();
  const cached = new Map<string, string[]>();
  let skipWaitingCalled = false;

  runInNewContext(source, {
    self: {
      registration: { active: null },
      addEventListener: (type: string, handler: unknown) => handlers.set(type, handler),
      skipWaiting: async () => { skipWaitingCalled = true; },
    },
    caches: {
      keys: async () => [],
      open: async (name: string) => ({
        addAll: async (urls: string[]) => cached.set(name, [...(cached.get(name) ?? []), ...urls]),
      }),
    },
    fetch: async () => ({
      ok: true,
      json: async () => ({ assets: ['/_astro/workbench.js', '/_astro/styles.css'] }),
    }),
  });

  let installation: Promise<unknown> | undefined;
  handlers.get('install')({ waitUntil: (promise: Promise<unknown>) => { installation = promise; } });
  await installation;

  assert.equal(skipWaitingCalled, false);
  assert.deepEqual(
    cached.get('amat19-blueprint-v6-__AMAT19_BUILD_REVISION__-static'),
    ['/_astro/workbench.js', '/_astro/styles.css'],
  );
});

test('v6 rescue force-activates legacy clients even when precache warmup fails', async () => {
  const source = await readFile(new URL('../../apps/web/public/sw.js', import.meta.url), 'utf8');
  const handlers = new Map();
  let skipWaitingCalled = false;

  runInNewContext(source, {
    console: { warn: () => {} },
    self: {
      addEventListener: (type: string, handler: unknown) => handlers.set(type, handler),
      skipWaiting: async () => { skipWaitingCalled = true; },
    },
    caches: {
      keys: async () => ['amat19-blueprint-v5-deadbeef-pages'],
      open: async () => ({ addAll: async () => { throw new Error('route unavailable'); } }),
    },
    fetch: async () => { throw new Error('manifest unavailable'); },
  });

  let installation: Promise<unknown> | undefined;
  handlers.get('install')({ waitUntil: (promise: Promise<unknown>) => { installation = promise; } });
  await assert.doesNotReject(installation);
  assert.equal(skipWaitingCalled, true);
});

test('v6 migration claims clients, clears legacy caches, and uses stable release markers', async () => {
  const source = await readFile(new URL('../../apps/web/public/sw.js', import.meta.url), 'utf8');
  const handlers = new Map();
  const navigated: string[] = [];
  const deleted: string[] = [];
  let claimed = false;

  runInNewContext(source, {
    URL,
    self: {
      location: { origin: 'https://amat.test' },
      skipWaiting: async () => {},
      addEventListener: (type: string, handler: unknown) => handlers.set(type, handler),
      clients: {
        claim: async () => { claimed = true; },
        matchAll: async () => [
          { url: 'https://amat.test/course?keep=1', navigate: async (url: string) => { navigated.push(url); } },
        ],
      },
    },
    caches: {
      keys: async () => [
        'amat19-workbenches-v2-old-pages',
        'amat19-blueprint-v4-old-static',
        'amat19-blueprint-v5-old-pages',
        'amat19-blueprint-v6-__AMAT19_BUILD_REVISION__-static',
        'amat19-blueprint-v6-__AMAT19_BUILD_REVISION__-pages',
        'amat19-blueprint-v6-__AMAT19_BUILD_REVISION__-rescue',
        'unrelated-cache',
      ],
      delete: async (key: string) => { deleted.push(key); return true; },
      open: async () => ({ addAll: async () => {}, put: async () => {} }),
      match: async () => undefined,
    },
    fetch: async () => ({ ok: true, clone: () => ({}) }),
    AbortController,
    Request,
    Promise,
    setTimeout,
    clearTimeout,
  });

  let activation: Promise<unknown> | undefined;
  handlers.get('activate')({ waitUntil: (promise: Promise<unknown>) => { activation = promise; } });
  await activation;

  assert.equal(claimed, true);
  assert.deepEqual(deleted.sort(), [
    'amat19-blueprint-v4-old-static',
    'amat19-blueprint-v5-old-pages',
    'amat19-blueprint-v6-__AMAT19_BUILD_REVISION__-rescue',
    'amat19-workbenches-v2-old-pages',
  ]);
  assert.equal(navigated.length, 1);
  const resetUrl = new URL(navigated[0]);
  assert.equal(resetUrl.pathname, '/course');
  assert.equal(resetUrl.searchParams.get('keep'), '1');
  assert.equal(resetUrl.searchParams.get('__amat19_release'), 'amat19-blueprint-v6');
  assert.equal(resetUrl.searchParams.get('__amat19_reload'), '__AMAT19_BUILD_REVISION__');
});

test('service-worker navigations bypass the browser HTTP cache', async () => {
  const source = await readFile(new URL('../../apps/web/public/sw.js', import.meta.url), 'utf8');
  assert.match(source, /fetch\(request,\s*\{\s*signal:\s*controller\.signal,\s*cache:\s*['"]no-store['"]\s*\}\)/);
});

test('application asks the browser to bypass HTTP cache when checking sw.js', async () => {
  const source = await readFile(new URL('../../apps/web/src/layouts/AppLayout.astro', import.meta.url), 'utf8');
  assert.match(source, /serviceWorker\.register\(['"]\/sw\.js['"],\s*\{\s*updateViaCache:\s*['"]none['"]\s*\}\)/);
});

test('application recognizes revisioned migration markers and removes them after fresh load', async () => {
  const source = await readFile(new URL('../../apps/web/src/layouts/AppLayout.astro', import.meta.url), 'utf8');
  assert.match(source, /amat19-blueprint-v6/);
  assert.match(source, /startsWith\(prefix\)/);
  assert.match(source, /history\.replaceState/);
});

test('offline immutable chunks match module requests despite preview Vary Origin headers', async () => {
  const source = await readFile(new URL('../../apps/web/public/sw.js', import.meta.url), 'utf8');
  const handlers = new Map();
  const response = { ok: true };

  runInNewContext(source, {
    URL,
    self: { location: { origin: 'https://amat.test' }, addEventListener: (type: string, handler: unknown) => handlers.set(type, handler) },
    caches: { match: async (_request: unknown, options?: { ignoreVary?: boolean }) => options?.ignoreVary ? response : undefined },
    fetch: async () => { throw new Error('Offline'); },
  });

  let resolved: Promise<unknown> | undefined;
  handlers.get('fetch')({
    request: { url: 'https://amat.test/_astro/workbench.hash.js', method: 'GET', mode: 'cors', destination: 'script' },
    respondWith: (promise: Promise<unknown>) => { resolved = promise; },
  });
  assert.equal(await resolved, response);
});

test('offline and manifest surfaces no longer expose the legacy maroon theme', async () => {
  const [offline, manifest] = await Promise.all([
    readFile(new URL('../../apps/web/public/offline.html', import.meta.url), 'utf8'),
    readFile(new URL('../../apps/web/public/manifest.webmanifest', import.meta.url), 'utf8'),
  ]);
  assert.match(offline, /amat19-theme/);
  assert.match(offline, /data-theme=["']light["']/);
  assert.match(offline, /#09090b/);
  assert.doesNotMatch(offline, /#7b1113|#fff9f1/i);
  assert.doesNotMatch(manifest, /#2e080d|#fff9f1/i);
});

test('Vercel serves worker metadata without cache clearing side effects', async () => {
  const config = JSON.parse(await readFile(new URL('../../vercel.json', import.meta.url), 'utf8'));
  const swRule = config.headers.find((rule: { source?: string }) => rule.source === '/sw.js');
  const manifestRule = config.headers.find((rule: { source?: string }) => rule.source === '/sw-assets.json');
  assert.ok(swRule);
  assert.ok(manifestRule);

  const swHeaders = Object.fromEntries(swRule.headers.map((header: { key: string; value: string }) => [header.key, header.value]));
  const manifestHeaders = Object.fromEntries(manifestRule.headers.map((header: { key: string; value: string }) => [header.key, header.value]));

  assert.match(swHeaders['Cache-Control'], /no-store/);
  assert.equal(swHeaders['CDN-Cache-Control'], 'no-store');
  assert.equal(swHeaders['Vercel-CDN-Cache-Control'], 'no-store');
  assert.equal(swHeaders['Service-Worker-Allowed'], '/');
  assert.equal(swHeaders['Clear-Site-Data'], undefined);
  assert.match(manifestHeaders['Cache-Control'], /no-store/);
  assert.equal(manifestHeaders['CDN-Cache-Control'], 'no-store');
  assert.equal(manifestHeaders['Vercel-CDN-Cache-Control'], 'no-store');
});

test('application proactively rechecks the worker without a redundant sw.js probe request', async () => {
  const source = await readFile(new URL('../../apps/web/src/layouts/AppLayout.astro', import.meta.url), 'utf8');
  assert.match(source, /WORKER_UPDATE_INTERVAL_MS\s*=\s*30\s*\*\s*60\s*\*\s*1000/);
  assert.doesNotMatch(source, /__amat19_probe/);
  assert.match(source, /workerRegistration\.update\(\)/);
  assert.match(source, /setInterval\(\(\)\s*=>\s*\{\s*void requestWorkerUpdate\(\);\s*\},\s*WORKER_UPDATE_INTERVAL_MS\)/);
  assert.match(source, /visibilitychange/);
  assert.match(source, /addEventListener\(['"]focus['"]/);
  assert.match(source, /addEventListener\(['"]online['"]/);
  assert.match(source, /addEventListener\(['"]pageshow['"]/);
  assert.match(source, /event\.persisted/);
});
