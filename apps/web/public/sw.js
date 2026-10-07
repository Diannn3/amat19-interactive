const RELEASE = 'amat19-blueprint-v6';
const BUILD_REVISION = '__AMAT19_BUILD_REVISION__';
const VERSION = `${RELEASE}-${BUILD_REVISION}`;
const STATIC_CACHE = `${VERSION}-static`;
const PAGE_CACHE = `${VERSION}-pages`;
const NAVIGATION_TIMEOUT_MS = 4000;
const LEGACY_CACHE_PREFIXES = [
  'amat19-workbenches-v2-',
  'amat19-blueprint-v3-',
  'amat19-blueprint-v4-',
  'amat19-blueprint-v5-',
];
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

function isLegacyCacheKey(key) {
  return LEGACY_CACHE_PREFIXES.some((prefix) => key.startsWith(prefix));
}

async function hasLegacyCaches() {
  const keys = await caches.keys();
  return keys.some(isLegacyCacheKey);
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      // v6 is a one-time rescue for clients still carrying v2-v5 cache
      // generations. Future v6 revisions remain learner-controlled.
      const legacyMigration = await hasLegacyCaches();
      if (legacyMigration) await self.skipWaiting();

      try {
        const response = await fetch('/sw-assets.json', { cache: 'no-store' });
        if (!response.ok) throw new Error('The offline asset manifest is unavailable.');
        const manifest = await response.json();
        if (!Array.isArray(manifest.assets) || manifest.assets.length === 0 ||
            !manifest.assets.every(asset => typeof asset === 'string' && /^\/_astro\/[\w./-]+\.(?:js|css|woff2?)$/.test(asset))) {
          throw new Error('The offline asset manifest is invalid.');
        }
        const [pages, assets] = await Promise.all([caches.open(PAGE_CACHE), caches.open(STATIC_CACHE)]);
        await Promise.all([pages.addAll(CORE_ROUTES), assets.addAll(manifest.assets)]);
      } catch (error) {
        if (!legacyMigration) throw error;
        // Replacing a known-stale legacy worker is more important than keeping
        // its offline cache warm. Normal v6 updates still fail closed.
        console.warn('[AMAT 19] v6 rescue precache warmup failed; continuing legacy migration.', error);
      }
    })()
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    const legacyMigration = keys.some(isLegacyCacheKey);

    await Promise.all(
      keys
        .filter((key) => key.startsWith('amat19-') && ![STATIC_CACHE, PAGE_CACHE].includes(key))
        .map((key) => caches.delete(key))
    );

    await self.clients.claim();
    if (!legacyMigration) return;

    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    await Promise.all(windows.map(async (client) => {
      if (typeof client.navigate !== 'function') return;
      try {
        const url = new URL(client.url);
        url.searchParams.set('__amat19_release', RELEASE);
        url.searchParams.set('__amat19_reload', BUILD_REVISION);
        await client.navigate(url.href);
      } catch {
        // One client that cannot navigate must not block the migration.
      }
    }));
  })());
});

function navigationCacheKey(request) {
  const url = new URL(request.url);
  return new Request(`${url.origin}${url.pathname}`, { method: 'GET', headers: { Accept: 'text/html' } });
}

async function cachedNavigation(request) {
  return (await caches.match(navigationCacheKey(request), { ignoreSearch: true })) ||
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
