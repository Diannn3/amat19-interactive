// The waiting worker owns membership and activation; tabs only save and acknowledge.
export function startReleaseUpdates() {
  if (!('serviceWorker' in navigator)) return;
  const frame = document.querySelector('[data-pwa-enabled]');
  if (frame?.getAttribute('data-pwa-enabled') !== 'true') return;
  const banner = document.getElementById('pwa-update');
  const message = document.getElementById('pwa-update-message');
  const button = document.getElementById('pwa-update-button') as HTMLButtonElement | null;
  const dismiss = document.getElementById('pwa-update-dismiss');
  const pageVersion = document.querySelector<HTMLMetaElement>('meta[name="amat-release"]')?.content;
  const WORKER_UPDATE_INTERVAL_MS = 5 * 60 * 1000;
  const PERSISTENCE_FLUSH_TIMEOUT_MS = 8000;
  let registration: ServiceWorkerRegistration | undefined;
  let checking = false;
  let activating = false;
  let attempted: ServiceWorker | undefined;
  let targetVersion: string | undefined;
  let prepared: { requestId: string; version: string; worker: ServiceWorker } | undefined;
  let barrierTimer: number | undefined;
  let reloadStarted = false;
  const main = document.querySelector('main');
  let previousInert = false;

  const show = (text: string, busy = false) => {
    if (banner) banner.hidden = false;
    if (message) message.textContent = text;
    if (button) { button.disabled = busy; button.textContent = busy ? 'Saving…' : 'Save & update'; }
  };
  const blockEdits = (event: Event) => {
    if (!prepared || (event.target instanceof Node && banner?.contains(event.target))) return;
    event.preventDefault(); event.stopImmediatePropagation();
  };
  for (const type of ['beforeinput', 'keydown', 'click', 'pointerdown', 'submit']) {
    window.addEventListener(type, blockEdits, true);
  }
  const releaseBarrier = () => {
    window.dispatchEvent(new Event('amat:update-cancelled'));
    if (prepared && main) main.inert = previousInert;
    prepared = undefined;
    targetVersion = undefined;
    window.clearTimeout(barrierTimer);
  };
  const waitForHydration = async () => {
    if (document.readyState !== 'complete') {
      await new Promise<void>((resolve) => window.addEventListener('load', () => resolve(), { once: true }));
    }
    const persistedWorkbenches = ['logic-proof-workbench', 'money-timeline-workbench',
      'mixed-practice', 'mixed-exam', 'probability-model-builder', 'optimization-strategy-workbench', 'row-operations-coach'];
    const notReady = () => persistedWorkbenches.some((id) => {
      const element = document.querySelector(`[data-testid="${id}"]`);
      return element && element.getAttribute('data-hydrated') !== 'true';
    });
    const deadline = performance.now() + PERSISTENCE_FLUSH_TIMEOUT_MS;
    while (document.querySelector('astro-island[ssr]') || notReady()) {
      if (performance.now() > deadline) throw new Error('Local work is not ready');
      await new Promise((resolve) => window.setTimeout(resolve, 50));
    }
  };
  const flushLocalWork = async () => {
    await waitForHydration();
    const tasks: Array<() => unknown> = [];
    window.dispatchEvent(new CustomEvent('amat:before-update', { detail: { tasks } }));
    const results = await Promise.allSettled(tasks.map((task) => Promise.resolve().then(task)));
    return results.every((result) => result.status === 'fulfilled' && result.value !== false);
  };
  const withTimeout = <T>(work: Promise<T>, fallback: T) => new Promise<T>((resolve) => {
    const timeout = window.setTimeout(() => resolve(fallback), PERSISTENCE_FLUSH_TIMEOUT_MS);
    work.then((value) => { window.clearTimeout(timeout); resolve(value); },
      () => { window.clearTimeout(timeout); resolve(fallback); });
  });

  navigator.serviceWorker.addEventListener('message', (event) => {
    const data = event.data;
    const worker = event.source;
    if (!(worker instanceof ServiceWorker) || !data || typeof data.version !== 'string') return;
    if (data.type === 'PREPARE_UPDATE' && typeof data.requestId === 'string') {
      if (worker !== registration?.waiting) return;
      if (prepared) return;
      previousInert = main?.inert ?? false;
      prepared = { requestId: data.requestId, version: data.version, worker };
      if (main) main.inert = true;
      show('Update ready. Saving your work before refreshing.', true);
      barrierTimer = window.setTimeout(() => {
        releaseBarrier(); show('Update ready. Save your work and retry.');
      }, 18000);
      void withTimeout(flushLocalWork(), false).then((ok) => {
        if (prepared?.requestId !== data.requestId) return;
        if (ok) targetVersion = data.version;
        worker.postMessage({ type: 'UPDATE_SAVED', requestId: data.requestId, version: data.version, ok });
      });
    } else if (data.type === 'ABORT_UPDATE' && prepared && prepared.requestId === data.requestId && prepared.worker === worker) {
      releaseBarrier(); activating = false;
      show('Update ready. Save your work and retry.');
    } else if (data.type === 'COMMIT_UPDATE' && prepared && prepared.requestId === data.requestId && prepared.worker === worker) {
      targetVersion = data.version;
      show('Your work is saved. Refreshing…', true);
    }
  });

  const activate = async () => {
    const worker = registration?.waiting;
    if (!worker || activating) return;
    activating = true;
    show('Update ready. Saving your work before refreshing.', true);
    const channel = new MessageChannel();
    const timeout = window.setTimeout(() => {
      channel.port1.close(); activating = false; releaseBarrier();
      show('Update ready. Save your work and retry.');
    }, 16000);
    channel.port1.onmessage = (event) => {
      window.clearTimeout(timeout); channel.port1.close();
      if (event.data?.status === 'committing') return;
      activating = false;
      if (event.data?.status !== 'busy') { releaseBarrier(); show('Update ready. Save your work and retry.'); }
    };
    worker.postMessage({ type: 'COORDINATE_UPDATE' }, [channel.port2]);
  };
  const foundUpdate = () => {
    const worker = registration?.waiting;
    if (!worker || worker === attempted) return;
    attempted = worker;
    void activate();
  };
  const announcePage = () => {
    if (pageVersion && !pageVersion.includes('__AMAT19_')) {
      navigator.serviceWorker.controller?.postMessage({ type: 'CLIENT_READY', version: pageVersion });
    }
  };
  navigator.serviceWorker.addEventListener('controllerchange', async () => {
    if (!targetVersion || reloadStarted) { announcePage(); return; }
    const target = targetVersion;
    const channel = new MessageChannel();
    const activeVersion = await new Promise<string | undefined>((resolve) => {
      const timeout = window.setTimeout(() => { channel.port1.close(); resolve(undefined); }, 3000);
      channel.port1.onmessage = (event) => {
        window.clearTimeout(timeout); channel.port1.close(); resolve(event.data?.version);
      };
      navigator.serviceWorker.controller?.postMessage({ type: 'GET_RELEASE' }, [channel.port2]);
    });
    if (activeVersion !== target) { releaseBarrier(); show('Update ready. Save your work and retry.'); return; }
    if (pageVersion === targetVersion) { releaseBarrier(); if (banner) banner.hidden = true; announcePage(); return; }
    reloadStarted = true;
    window.location.reload();
  });
  const check = async () => {
    if (!registration || checking || !navigator.onLine) return;
    checking = true;
    try {
      const response = await fetch('/release.json', { cache: 'no-store' });
      if (!response.ok) throw new Error('Release manifest unavailable');
      const release = await response.json();
      if (typeof release.version !== 'string' || !/^[a-z0-9-]+$/.test(release.version)) return;
      await registration.update();
      foundUpdate();
    } catch { /* Current offline release stays usable; lifecycle checks retry. */ }
    finally { checking = false; }
  };
  navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' }).then((value) => {
    registration = value;
    registration.addEventListener('updatefound', () => {
      const installing = registration?.installing;
      installing?.addEventListener('statechange', () => {
        if (installing.state === 'installed' && navigator.serviceWorker.controller) foundUpdate();
      });
    });
    announcePage(); foundUpdate(); void check();
    window.setInterval(() => { if (!document.hidden) void check(); }, WORKER_UPDATE_INTERVAL_MS);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) void check(); });
    window.addEventListener('focus', () => { void check(); });
    window.addEventListener('online', () => { void check(); });
    window.addEventListener('pageshow', (event) => { if (event.persisted) void check(); });
  }).catch(() => {});
  button?.addEventListener('click', () => { void activate(); });
  dismiss?.addEventListener('click', () => { if (banner && !prepared) banner.hidden = true; });
}
