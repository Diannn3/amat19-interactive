import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { runInNewContext } from 'node:vm';
const source = await readFile(new URL('../../apps/web/public/sw.js', import.meta.url), 'utf8');
const version = 'amat19-blueprint-v6-__AMAT19_BUILD_REVISION__';
function harness() {
  const handlers = new Map<string, (event: any) => void>();
  const messages: any[] = []; const deleted: string[] = [];
  let activated = 0; let clock = 0; const clients: any[] = [];
  const registration: any = { scope: 'https://amat.test/' };
  let reply: ((client: any, data: any) => void) | undefined;
  runInNewContext(source, {
    crypto: { randomUUID: () => 'request-1' }, Date: { now: () => clock },
    setTimeout: (fn: () => void) => { clock += 1000; queueMicrotask(fn); },
    self: { registration,
      addEventListener: (type: string, fn: any) => handlers.set(type, fn),
      skipWaiting: async () => { activated++; },
      clients: { matchAll: async () => clients, claim: async () => {} } },
    caches: { keys: async () => ['amat19-blueprint-v4-old-static', `${version}-static`, `${version}-pages`, 'other-app-cache'],
      delete: async (key: string) => { deleted.push(key); }, open: async () => ({ addAll: async () => {}, put: async () => {} }) },
    fetch: async () => ({ ok: true, json: async () => ({ version, assets: ['/_astro/main.js'] }), clone: () => ({ text: async () => `name="amat-release" content="${version}"` }) }),
  });
  const emit = (data: any, client: any) => {
    let work: Promise<any> = Promise.resolve();
    handlers.get('message')!({ data, source: client, ports: [], waitUntil: (p: Promise<any>) => { work = p; } }); return work;
  };
  const addClient = (id: string) => {
    const client: any = { id, url: 'https://amat.test/study', postMessage: (data: any) => { messages.push({ id, ...data }); reply?.(client, data); } };
    clients.push(client); return client;
  };
  return { emit, addClient, messages, deleted, handlers, registration, get activated() { return activated; }, onMessage(fn: (client: any, data: any) => void) { reply = fn; } };
}
test('all tabs save before activation, including a tab opened during preparation', async () => {
  const h = harness(); const a = h.addClient('a'); h.addClient('b');
  h.onMessage((client, data) => {
    if (data.type !== 'PREPARE_UPDATE') return;
    if (client.id === 'a') h.addClient('c');
    void h.emit({ type: 'UPDATE_SAVED', requestId: data.requestId, version, ok: true }, client);
  });
  await h.emit({ type: 'COORDINATE_UPDATE' }, a);
  assert.equal(h.activated, 1);
  assert.deepEqual(h.messages.filter(x => x.type === 'COMMIT_UPDATE').map(x => x.id).sort(), ['a', 'b', 'c']);
});
test('failed saves abort every prepared tab without activation', async () => {
  const h = harness(); const a = h.addClient('a'); h.addClient('b');
  h.onMessage((client, data) => { if (data.type === 'PREPARE_UPDATE') void h.emit({ type: 'UPDATE_SAVED', requestId: data.requestId, version, ok: client.id !== 'b' }, client); });
  await h.emit({ type: 'COORDINATE_UPDATE' }, a);
  assert.equal(h.activated, 0); assert.equal(h.messages.filter(x => x.type === 'ABORT_UPDATE').length, 2);
});
test('unresponsive legacy tabs and stale acknowledgements cannot bypass saving', async () => {
  const h = harness(); const a = h.addClient('a'); h.addClient('legacy');
  h.onMessage((client, data) => { if (data.type === 'PREPARE_UPDATE') void h.emit({ type: 'UPDATE_SAVED', requestId: 'stale', version: 'old', ok: true }, client); });
  await h.emit({ type: 'SKIP_WAITING' }, a);
  assert.equal(h.activated, 0); assert.equal(h.messages.filter(x => x.type === 'ABORT_UPDATE').length, 2);
});
test('old caches remain until every tab reports the new page revision', async () => {
  const h = harness(); const a = h.addClient('a'); const b = h.addClient('b');
  await h.emit({ type: 'CLIENT_READY', version }, a); assert.deepEqual(h.deleted, []);
  await h.emit({ type: 'CLIENT_READY', version }, b); assert.deepEqual(h.deleted, ['amat19-blueprint-v4-old-static']);
});
test('first install does not force activation or navigate any tab', async () => {
  const h = harness(); let work: Promise<any> = Promise.resolve();
  h.handlers.get('install')!({ waitUntil: (p: Promise<any>) => { work = p; } }); await work;
  h.handlers.get('activate')!({ waitUntil: (p: Promise<any>) => { work = p; } }); await work;
  assert.equal(h.activated, 0); assert.deepEqual(h.messages, []); assert.deepEqual(h.deleted, []);
});
test('cache cleanup never deletes a pending installation or waiting release', async () => {
  for (const field of ['installing', 'waiting']) {
    const h = harness(); const a = h.addClient('a'); h.registration[field] = {};
    await h.emit({ type: 'CLIENT_READY', version }, a); assert.deepEqual(h.deleted, []);
  }
});
test('offline navigation chooses the current page cache ahead of retained generations', async () => {
  const handlers = new Map<string, (event: any) => void>();
  const current = { marker: 'current' }; const legacy = { marker: 'legacy' };
  runInNewContext(source, {
    URL, Request, AbortController, setTimeout, clearTimeout,
    self: { location: { origin: 'https://amat.test' }, addEventListener: (type: string, fn: any) => handlers.set(type, fn) },
    caches: { open: async () => ({ match: async () => current }), match: async () => legacy },
    fetch: async () => { throw new Error('offline'); },
  });
  let work: Promise<any> = Promise.resolve();
  handlers.get('fetch')!({ request: { method: 'GET', url: 'https://amat.test/study?q=1', mode: 'navigate' }, respondWith: (p: Promise<any>) => { work = p; } });
  assert.equal(await work, current);
});
