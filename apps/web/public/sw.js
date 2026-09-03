const VERSION = 'amat19-workbenches-v1';
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
  '/workbenches/applications',
  '/labs/logic-basics',
  '/labs/truth-table',
  '/labs/equivalence',
  '/labs/formal-proof',
  '/labs/counting',
  '/labs/conditional-probability',
  '/labs/distribution',
  '/labs/probability-simulation',
  '/labs/bayes',
  '/labs/interest',
  '/labs/cashflow-timeline',
  '/labs/annuity',
  '/labs/bonds',
  '/labs/matrix-operations',
  '/labs/row-reduction',
  '/labs/linear-programming',
  '/labs/game-theory',
  '/labs/markov',
  '/offline.html',
  '/manifest.webmanifest'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(PAGE_CACHE).then(async (cache) => {
      await Promise.allSettled(CORE_ROUTES.map((url) => cache.add(url)));
    })
  );
  // Deliberately do not skipWaiting(): an active study session chooses when updates apply.
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => ![STATIC_CACHE, PAGE_CACHE].includes(key)).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
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
    return await fetch(request, { signal: controller.signal });
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
  const cached = await caches.match(request);
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
