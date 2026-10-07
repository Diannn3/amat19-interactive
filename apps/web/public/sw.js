const RELEASE = 'amat19-blueprint-v6';
const BUILD_REVISION = '__AMAT19_BUILD_REVISION__';
const VERSION = `${RELEASE}-${BUILD_REVISION}`;
const STATIC_CACHE = `${VERSION}-static`;
const PAGE_CACHE = `${VERSION}-pages`;
const NAVIGATION_TIMEOUT_MS = 4000;
const CORE_ROUTES = [
  '/',
  '/study',
  '/course',
  '/practice',
  '/exam',
  '/reference',
  '/progress',
  '/saved',
  '/settings',
  '/modules/logic',
  '/modules/probability',
  '/modules/finance',
  '/modules/linear',
  '/modules/applications',
  '/workbenches/logic',
  '/workbenches/probability',
  '/workbenches/finance',
  '/workbenches/linear',
  '/offline.html',
  '/manifest.webmanifest'
];

// New workers wait until every open tab has saved. Legacy tabs that do not
// understand this protocol block activation until closed or normally reloaded.
let transaction;
const pageVersions = new Map();
let cleanupRunning = false;
async function appClients() {
  return (await self.clients.matchAll({ type: 'window', includeUncontrolled: true }))
    .filter(client => client.url.startsWith(self.registration.scope));
}
async function abortUpdate(state) {
  for (const client of await appClients()) client.postMessage({ type: 'ABORT_UPDATE', version: VERSION, requestId: state.id });
}
async function coordinateUpdate(port) {
  if (transaction) { port?.postMessage({ status: 'busy' }); return; }
  const state = { id: crypto.randomUUID(), expected: new Map(), sent: new Map(), failed: false };
  transaction = state;
  const deadline = Date.now() + 12000;
  try {
    while (Date.now() < deadline) {
      const clients = await appClients();
      const live = new Set(clients.map(client => client.id));
      for (const id of state.expected.keys()) if (!live.has(id)) state.expected.delete(id);
      for (const client of clients) {
        if (!state.expected.has(client.id)) state.expected.set(client.id, false);
        if (!state.expected.get(client.id) && Date.now() - (state.sent.get(client.id) ?? -1000) >= 250) {
          state.sent.set(client.id, Date.now());
          client.postMessage({ type: 'PREPARE_UPDATE', requestId: state.id, version: VERSION });
        }
      }
      if (state.failed) throw new Error('A tab could not save');
      if ([...state.expected.values()].every(Boolean)) {
        // Recheck membership after acknowledgements, including newly opened tabs.
        const finalClients = await appClients();
        if (finalClients.every(client => state.expected.get(client.id))) {
          for (const client of finalClients) client.postMessage({ type: 'COMMIT_UPDATE', requestId: state.id, version: VERSION });
          port?.postMessage({ status: 'committing', version: VERSION });
          await self.skipWaiting();
          return;
        }
      }
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    throw new Error('A tab did not respond');
  } catch {
    await abortUpdate(state);
    port?.postMessage({ status: 'blocked', version: VERSION });
  } finally { transaction = undefined; }
}
async function cleanObsoleteCaches() {
  if (cleanupRunning || self.registration.installing || self.registration.waiting) return;
  cleanupRunning = true;
  try {
    const clients = await appClients();
    if (!clients.every(client => pageVersions.get(client.id) === VERSION)) return;
    const keys = await caches.keys();
    if (self.registration.installing || self.registration.waiting) return;
    await Promise.all(keys.filter(key => /^amat19-(?:blueprint-v\d+|workbenches-v2)-/.test(key) &&
      ![STATIC_CACHE, PAGE_CACHE].includes(key)).map(key => caches.delete(key)));
  } finally { cleanupRunning = false; }
}
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    try {
      const response = await fetch('/sw-assets.json', { cache: 'no-store' });
      if (!response.ok) throw new Error('Offline manifest unavailable');
      const manifest = await response.json();
      if (manifest.version !== VERSION || !Array.isArray(manifest.assets) || !manifest.assets.length ||
          !manifest.assets.every(asset => typeof asset === 'string' && /^\/_astro\/[\w./-]+\.(?:js|css|woff2?)$/.test(asset))) {
        throw new Error('Offline manifest does not match this release');
      }
      const [pages, assets] = await Promise.all([caches.open(PAGE_CACHE), caches.open(STATIC_CACHE)]);
      await Promise.all([Promise.all(CORE_ROUTES.map(async route => {
        const page = await fetch(route, { cache: 'no-store' });
        if (!page.ok) throw new Error('Offline route unavailable');
        if (!['/offline.html', '/manifest.webmanifest'].includes(route) &&
            !(await page.clone().text()).includes(`name="amat-release" content="${VERSION}"`)) {
          throw new Error('Offline page revision does not match this release');
        }
        await pages.put(route, page);
      })), assets.addAll(manifest.assets)]);
    } catch (error) {
      await Promise.all([caches.delete(PAGE_CACHE), caches.delete(STATIC_CACHE)]);
      throw error;
    }
  })());
});
self.addEventListener('message', event => {
  const data = event.data;
  if (!data || !event.source || !event.source.url?.startsWith(self.registration.scope)) return;
  if (data.type === 'COORDINATE_UPDATE' || data.type === 'SKIP_WAITING') {
    event.waitUntil(coordinateUpdate(event.ports?.[0]));
  } else if (data.type === 'UPDATE_SAVED' && transaction && data.requestId === transaction.id &&
      data.version === VERSION && transaction.expected.has(event.source.id)) {
    if (data.ok === true) transaction.expected.set(event.source.id, true);
    else transaction.failed = true;
  } else if (data.type === 'GET_RELEASE' && event.ports?.[0]) {
    event.ports[0].postMessage({ release: RELEASE, version: VERSION, protocol: 1 });
  } else if (data.type === 'CLIENT_READY' && data.version === VERSION) {
    pageVersions.set(event.source.id, data.version);
    event.waitUntil(cleanObsoleteCaches());
  }
});
self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

function navigationCacheKey(request) {
  const url = new URL(request.url);
  return new Request(`${url.origin}${url.pathname}`, { method: 'GET', headers: { Accept: 'text/html' } });
}

async function cachedNavigation(request) {
  const current = await caches.open(PAGE_CACHE);
  return (await current.match(navigationCacheKey(request), { ignoreSearch: true })) ||
    (await current.match('/offline.html')) ||
    (await caches.match(navigationCacheKey(request), { ignoreSearch: true })) ||
    (await caches.match(request, { ignoreSearch: true })) ||
    (await caches.match('/offline.html'));
}

async function cacheNavigationResponse(request, response) {
  if (!response.ok) return;
  const cache = await caches.open(PAGE_CACHE);
  await cache.put(navigationCacheKey(request), response.clone());
}

async function fetchWithTimeout(request, timeoutMs = NAVIGATION_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(request, { signal: controller.signal, cache: 'no-store' });
  } finally {
    clearTimeout(timeout);
  }
}

async function networkFirst(request) {
  try {
    const response = await fetchWithTimeout(request);
    await cacheNavigationResponse(request, response);
    return response;
  } catch {
    return cachedNavigation(request);
  }
}

async function freshReload(request) {
  try {
    // A deliberate browser reload means freshness wins over the normal
    // four-second offline fallback window.
    const response = await fetch(request, { cache: 'no-store' });
    await cacheNavigationResponse(request, response);
    return response;
  } catch {
    return cachedNavigation(request);
  }
}

async function navigationResponse(request) {
  return request.cache === 'reload' || request.cache === 'no-cache'
    ? freshReload(request)
    : networkFirst(request);
}

async function cacheFirst(request) {
  // These same-origin hashed files are identical for classic and CORS module
  // requests. A server's Vary: Origin must not invalidate their install cache.
  const immutableChunk = new URL(request.url).pathname.startsWith('/_astro/');
  const cached = await caches.match(request, { ignoreVary: immutableChunk });
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(STATIC_CACHE);
    await cache.put(request, response.clone());
  }
  return response;
}

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;

  if (event.request.mode === 'navigate') {
    event.respondWith(navigationResponse(event.request));
    return;
  }

  const destination = event.request.destination;
  if (['script', 'style', 'font', 'image'].includes(destination) || url.pathname.startsWith('/_astro/')) {
    event.respondWith(cacheFirst(event.request));
  }
});
