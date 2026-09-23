const VERSION = 'amat19-blueprint-v5';
// Emergency stale-shell migration. This exact release must be able to replace
// an older worker even if offline precaching fails in production.
const FORCE_ACTIVATE_RELEASE = VERSION === 'amat19-blueprint-v5';
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

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      // For this emergency migration, activation must not depend on precache
      // success. The previous v3 flow called skipWaiting() only after addAll(),
      // so one failed route could leave the stale worker active indefinitely.
      if (FORCE_ACTIVATE_RELEASE) await self.skipWaiting();

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
        if (!FORCE_ACTIVATE_RELEASE) throw error;
        // Best-effort offline warmup for v5. Network freshness and worker
        // replacement take priority over offline readiness during migration.
        console.warn('[AMAT 19] Blueprint v5 precache warmup failed; continuing stale-shell migration.', error);
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
    await Promise.all(
      keys
        .filter((key) => key.startsWith('amat19-') && ![STATIC_CACHE, PAGE_CACHE].includes(key))
        .map((key) => caches.delete(key))
    );

    await self.clients.claim();
    if (!FORCE_ACTIVATE_RELEASE) return;

    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    await Promise.all(windows.map(async (client) => {
      if (typeof client.navigate !== 'function') return;
      try {
        const url = new URL(client.url);
        url.searchParams.set('__amat19_release', VERSION);
        url.searchParams.set('__amat19_reload', String(Date.now()));
        await client.navigate(url.href);
      } catch {
        // A single client that cannot navigate must not block activation.
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
    if (response.ok) {
      const cache = await caches.open(PAGE_CACHE);
      await cache.put(navigationCacheKey(request), response.clone());
    }
    return response;
  } catch {
    return cachedNavigation(request);
  }
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
    event.respondWith(networkFirst(event.request));
    return;
  }

  const destination = event.request.destination;
  if (['script', 'style', 'font', 'image'].includes(destination) || url.pathname.startsWith('/_astro/')) {
    event.respondWith(cacheFirst(event.request));
  }
});
