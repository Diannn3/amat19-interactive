import { expect, test } from '@playwright/test';

test('PWA update waits for slow persistence work before activating the worker', async ({ page }) => {
  await page.addInitScript(() => {
    const worker = {
      messages: [] as unknown[],
      postMessage(message: unknown) { this.messages.push(message); },
    };
    const registration = {
      waiting: worker,
      installing: null,
      addEventListener() {},
    };
    const serviceWorker = {
      controller: {},
      register: async () => registration,
      addEventListener() {},
    };

    Object.defineProperty(navigator, 'serviceWorker', { configurable: true, value: serviceWorker });
    Object.assign(window, { __amatTestWorker: worker });
    window.addEventListener('amat:before-update', (event) => {
      const detail = (event as CustomEvent<{ tasks: Array<() => unknown> }>).detail;
      detail.tasks.push(() => new Promise<void>((resolve) => {
        Object.assign(window, { __finishPersistence: resolve });
      }));
    });
  });

  await page.goto('/workbenches/logic?mode=compare');
  await expect(page.getByTestId('logic-proof-workbench')).toHaveAttribute('data-hydrated', 'true', { timeout: 10_000 });
  await expect(page.getByRole('button', { name: 'Save & update' })).toBeVisible();

  await page.getByRole('button', { name: 'Save & update' }).click();
  await expect(page.getByRole('button', { name: 'Saving…' })).toBeDisabled();
  expect(await page.evaluate(() => (window as typeof window & { __amatTestWorker: { messages: unknown[] } }).__amatTestWorker.messages.length)).toBe(0);
  await page.evaluate(() => (window as typeof window & { __finishPersistence: () => void }).__finishPersistence());

  await expect.poll(() => page.evaluate(() => (window as typeof window & { __amatTestWorker: { messages: unknown[] } }).__amatTestWorker.messages.length), { timeout: 2_000 }).toBe(1);
});

test('PWA update stays pending when a persistence task fails', async ({ page }) => {
  await page.addInitScript(() => {
    const worker = {
      messages: [] as unknown[],
      postMessage(message: unknown) { this.messages.push(message); },
    };
    const registration = {
      waiting: worker,
      installing: null,
      addEventListener() {},
    };
    const serviceWorker = {
      controller: {},
      register: async () => registration,
      addEventListener() {},
    };

    Object.defineProperty(navigator, 'serviceWorker', { configurable: true, value: serviceWorker });
    Object.assign(window, { __amatTestWorker: worker });
    window.addEventListener('amat:before-update', (event) => {
      const detail = (event as CustomEvent<{ tasks: Array<() => unknown> }>).detail;
      detail.tasks.push(() => false);
    });
  });

  await page.goto('/workbenches/logic?mode=compare');
  await expect(page.getByTestId('logic-proof-workbench')).toHaveAttribute('data-hydrated', 'true', { timeout: 10_000 });
  await expect(page.getByRole('button', { name: 'Save & update' })).toBeVisible();

  await page.getByRole('button', { name: 'Save & update' }).click();
  await expect(page.getByText(/Couldn’t save local work/i)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Save & update' })).toBeEnabled();
  await expect.poll(() => page.evaluate(() => (window as typeof window & { __amatTestWorker: { messages: unknown[] } }).__amatTestWorker.messages.length)).toBe(0);
});

test('production PWA serves query-based study routes from the service-worker cache while offline', async ({ page, context }) => {
  await page.goto('/modules/logic?view=practice&preset=logic-drill');
  await expect(page.getByTestId('mixed-practice')).toBeVisible();

  await expect.poll(() => page.evaluate(async () => {
    if (!('serviceWorker' in navigator)) return 'unsupported';
    const registration = await navigator.serviceWorker.ready;
    return registration.active?.state ?? 'missing';
  }), { timeout: 20_000 }).toBe('activated');

  if (!await page.evaluate(() => Boolean(navigator.serviceWorker.controller))) {
    await page.reload();
  }
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
  await page.reload({ waitUntil: 'networkidle' });
  await expect(page.getByTestId('mixed-practice')).toHaveAttribute('data-hydrated', 'true', { timeout: 20_000 });

  await context.setOffline(true);
  try {
    await page.goto('/modules/logic?view=practice&preset=logic-drill', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('mixed-practice')).toBeVisible();
    await expect(page.getByTestId('mixed-practice')).toHaveAttribute('data-hydrated', 'true');
    await page.getByRole('radio').first().check();
    await page.getByRole('button', { name: 'Check item' }).click();
    await expect(page.locator('.mixed-question__result')).toBeVisible();
    await page.goto('/workbenches/probability?mode=bayes&offline=1', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('probability-model-builder')).toBeVisible();
    await expect(page.getByTestId('probability-model-builder')).toHaveAttribute('data-hydrated', 'true');
    await expect(page.getByRole('combobox', { name: 'Choose a task' })).toHaveValue('bayes');
    for (const [route, selector] of [
      ['/workbenches/logic?mode=compare', 'logic-proof-workbench'],
      ['/workbenches/finance?scenario=bond', 'money-timeline-workbench'],
      ['/workbenches/linear?goal=inverse', 'row-operations-coach'],
      ['/workbenches/applications?mode=game', 'optimization-strategy-workbench'],
    ]) {
      await page.goto(route!, { waitUntil: 'domcontentloaded' });
      await expect(page.getByTestId(selector!)).toHaveAttribute('data-hydrated', 'true');
    }
  } finally {
    await context.setOffline(false);
  }
});

test('built legacy redirects preserve task selection with a no-script fallback', async ({ page, browser }) => {
  await page.goto('/labs/truth-table?mode=argument');
  await expect(page).toHaveURL(/\/workbenches\/logic\?mode=argument$/);
  await expect(page.getByRole('combobox', { name: 'Choose a task' })).toHaveValue('argument');
  const noScript = await browser.newContext({ javaScriptEnabled: false, baseURL: 'http://127.0.0.1:4321' });
  try {
    const fallback = await noScript.newPage();
    await fallback.goto('/labs/annuity');
    await expect(fallback).toHaveURL(/\/workbenches\/finance\?scenario=annuity$/);
    await expect(fallback.getByRole('heading', { name: 'Money Timeline', exact: true })).toBeVisible();
  } finally {
    await noScript.close();
  }
});
