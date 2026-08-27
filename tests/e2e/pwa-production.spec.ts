import { expect, test } from '@playwright/test';

test('production PWA serves query-based study routes from the service-worker cache while offline', async ({ page, context }) => {
  await page.goto('/practice?preset=weak-areas');
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

  await context.setOffline(true);
  try {
    await page.goto('/practice?preset=quick-5', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('mixed-practice')).toBeVisible();
    await page.goto('/labs/bayes?offline=1', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('bayes-lab')).toBeVisible();
  } finally {
    await context.setOffline(false);
  }
});
