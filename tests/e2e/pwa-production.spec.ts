import { expect, test } from '@playwright/test';

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
