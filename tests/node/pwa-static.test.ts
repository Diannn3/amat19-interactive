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


test('service worker cache namespace is bumped for the focused workbench release',async()=>{
 const source=await readFile(new URL('../../apps/web/public/sw.js',import.meta.url),'utf8');
 assert.match(source,/VERSION\s*=\s*['"]amat19-workbenches-v2['"]/);
 assert.doesNotMatch(source,/['"]\/labs\//);
 assert.doesNotMatch(source,/amat19-v13-audited-backend/);
});

test('installation caches the built workbench scripts before reporting offline readiness', async () => {
 const source = await readFile(new URL('../../apps/web/public/sw.js', import.meta.url), 'utf8');
 const handlers = new Map();
 const cached = new Map<string, string[]>();
 let manifestRequested = false;
 runInNewContext(source, {
  self: { addEventListener: (type: string, handler: unknown) => handlers.set(type, handler) },
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
 assert.deepEqual(cached.get('amat19-workbenches-v2-static'), ['/_astro/workbench.js', '/_astro/styles.css']);
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
