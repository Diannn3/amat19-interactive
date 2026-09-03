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
      detail.tasks.push(() => new Promise<void>((resolve) => window.setTimeout(resolve, 150)));
    });
  });

  await page.goto('/labs/equivalence');
  await expect(page.getByTestId('equivalence-lab')).toHaveAttribute('data-hydrated', 'true', { timeout: 10_000 });
  await expect(page.getByRole('button', { name: 'Save & update' })).toBeVisible();

  await page.getByRole('button', { name: 'Save & update' }).click();
  await expect(page.getByRole('button', { name: 'Saving…' })).toBeDisabled();
  await page.waitForTimeout(50);
  await expect.poll(() => page.evaluate(() => (window as typeof window & { __amatTestWorker: { messages: unknown[] } }).__amatTestWorker.messages.length)).toBe(0);

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

  await page.goto('/labs/equivalence');
  await expect(page.getByTestId('equivalence-lab')).toHaveAttribute('data-hydrated', 'true', { timeout: 10_000 });
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
    await page.goto('/labs/bayes?offline=1', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('bayes-lab')).toBeVisible();
  } finally {
    await context.setOffline(false);
  }
});
