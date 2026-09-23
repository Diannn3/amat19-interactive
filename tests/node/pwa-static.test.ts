import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
import { runInNewContext } from 'node:vm';

test('service worker precaches canonical workbenches and local-first workspace routes',async()=>{
 const source=await readFile(new URL('../../apps/web/public/sw.js',import.meta.url),'utf8');
 for(const route of ['/study','/saved','/settings','/workbenches/logic','/workbenches/probability','/workbenches/finance','/workbenches/linear','/workbenches/applications'])assert.match(source,new RegExp(`['\"]${route.replace('/','\\/')}['\"]`));
});

test('navigation fallback ignores query strings and uses a bounded network wait',async()=>{
 const source=await readFile(new URL('../../apps/web/public/sw.js',import.meta.url),'utf8');
 assert.match(source,/ignoreSearch:\s*true/);
 assert.match(source,/AbortController/);
 assert.match(source,/NAVIGATION_TIMEOUT_MS\s*=\s*4000/);
});


test('service worker cache namespace is bumped for the Blueprint production migration',async()=>{
 const source=await readFile(new URL('../../apps/web/public/sw.js',import.meta.url),'utf8');
 assert.match(source,/VERSION\s*=\s*['"]amat19-blueprint-v4['"]/);
 assert.match(source,/FORCE_ACTIVATE_RELEASE\s*=\s*VERSION\s*===\s*['"]amat19-blueprint-v4['"]/);
 assert.doesNotMatch(source,/['"]\/labs\//);
 assert.doesNotMatch(source,/amat19-v13-audited-backend/);
});

test('installation caches the built workbench scripts before reporting offline readiness', async () => {
 const source = await readFile(new URL('../../apps/web/public/sw.js', import.meta.url), 'utf8');
 const handlers = new Map();
 const cached = new Map<string, string[]>();
 let manifestRequested = false;
 let skipWaitingCalled = false;
 runInNewContext(source, {
  self: {
   addEventListener: (type: string, handler: unknown) => handlers.set(type, handler),
   skipWaiting: async () => { skipWaitingCalled = true; },
  },
  caches: { open: async (name: string) => ({
   add: async (url: string) => cached.set(name, [...(cached.get(name) ?? []), url]),
   addAll: async (urls: string[]) => cached.set(name, [...(cached.get(name) ?? []), ...urls]),
  }) },
  fetch: async (url: string) => {
   manifestRequested = url === '/sw-assets.json';
   return { ok: true, json: async () => ({ assets: ['/_astro/workbench.js', '/_astro/styles.css'] }) };
  },
 });
 let installation: Promise<unknown> | undefined;
 handlers.get('install')({ waitUntil: (promise: Promise<unknown>) => { installation = promise; } });
 await installation;
 assert.equal(manifestRequested, true);
 assert.equal(skipWaitingCalled, true);
 assert.deepEqual(cached.get('amat19-blueprint-v4-static'), ['/_astro/workbench.js', '/_astro/styles.css']);
});


test('hard-reset worker still activates when production precache warmup fails', async () => {
 const source = await readFile(new URL('../../apps/web/public/sw.js', import.meta.url), 'utf8');
 const handlers = new Map();
 let skipWaitingCalled = false;
 runInNewContext(source, {
  console: { warn: () => {} },
  self: {
   addEventListener: (type: string, handler: unknown) => handlers.set(type, handler),
   skipWaiting: async () => { skipWaitingCalled = true; },
  },
  caches: { open: async () => ({ addAll: async () => { throw new Error('route unavailable'); } }) },
  fetch: async () => { throw new Error('manifest unavailable'); },
 });
 let installation: Promise<unknown> | undefined;
 handlers.get('install')({ waitUntil: (promise: Promise<unknown>) => { installation = promise; } });
 await assert.doesNotReject(installation);
 assert.equal(skipWaitingCalled, true);
});


test('Blueprint migration claims clients, clears legacy caches, and cache-busts the reload', async () => {
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
    'amat19-workbenches-v2-pages',
    'amat19-blueprint-v3-pages',
    'amat19-blueprint-v4-static',
    'amat19-blueprint-v4-pages',
    'unrelated-cache',
   ],
   delete: async (key: string) => { deleted.push(key); return true; },
   open: async () => ({ addAll: async () => {} }),
   match: async () => undefined,
  },
  fetch: async () => ({ ok: true }),
  AbortController,
  Request,
  Promise,
 });
 let activation: Promise<unknown> | undefined;
 handlers.get('activate')({ waitUntil: (promise: Promise<unknown>) => { activation = promise; } });
 await activation;
 assert.equal(claimed, true);
 assert.deepEqual(deleted.sort(), ['amat19-blueprint-v3-pages', 'amat19-workbenches-v2-pages']);
 assert.equal(navigated.length, 1);
 const resetUrl = new URL(navigated[0]);
 assert.equal(resetUrl.pathname, '/course');
 assert.equal(resetUrl.searchParams.get('keep'), '1');
 assert.equal(resetUrl.searchParams.get('__amat19_release'), 'amat19-blueprint-v4');
 assert.ok(resetUrl.searchParams.get('__amat19_reload'));
});

test('service-worker navigations bypass the browser HTTP cache', async () => {
 const source = await readFile(new URL('../../apps/web/public/sw.js', import.meta.url), 'utf8');
 assert.match(source, /fetch\(request,\s*\{\s*signal:\s*controller\.signal,\s*cache:\s*['"]no-store['"]\s*\}\)/);
});

test('application asks the browser to bypass HTTP cache when checking sw.js', async () => {
 const source = await readFile(new URL('../../apps/web/src/layouts/AppLayout.astro', import.meta.url), 'utf8');
 assert.match(source, /serviceWorker\.register\(['"]\/sw\.js['"],\s*\{\s*updateViaCache:\s*['"]none['"]\s*\}\)/);
});

test('application removes the v4 migration query marker after the fresh document loads', async () => {
 const source = await readFile(new URL('../../apps/web/src/layouts/AppLayout.astro', import.meta.url), 'utf8');
 assert.match(source, /__amat19_release/);
 assert.match(source, /amat19-blueprint-v4/);
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


test('Vercel serves the migration worker without browser or CDN caching', async () => {
 const config = JSON.parse(await readFile(new URL('../../vercel.json', import.meta.url), 'utf8'));
 const swRule = config.headers.find((rule: { source?: string }) => rule.source === '/sw.js');
 assert.ok(swRule);
 const headers = Object.fromEntries(swRule.headers.map((header: { key: string; value: string }) => [header.key, header.value]));
 assert.match(headers['Cache-Control'], /no-store/);
 assert.equal(headers['CDN-Cache-Control'], 'no-store');
 assert.equal(headers['Vercel-CDN-Cache-Control'], 'no-store');
 assert.equal(headers['Clear-Site-Data'], '"cache"');
 assert.equal(headers['Service-Worker-Allowed'], '/');
});
