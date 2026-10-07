import { expect, test, type Page } from '@playwright/test';

async function controlled(page: Page) {
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller)), { timeout: 25000 }).toBe(true);
  await expect(page.getByTestId('logic-proof-workbench')).toHaveAttribute('data-hydrated', 'true');
}
test.beforeEach(async ({ request, context }) => {
  await request.post('/__release/a');
  await request.post('/__manifest/ok');
  await context.addInitScript(() => {
    sessionStorage.setItem('boots', String(Number(sessionStorage.getItem('boots') ?? 0) + 1));
    window.addEventListener('amat:before-update', (event) => {
      const detail = (event as CustomEvent<{ tasks: Array<() => unknown> }>).detail;
      detail.tasks.push(async () => {
        const delay = Number(sessionStorage.getItem('save-delay') ?? 0);
        await new Promise(resolve => setTimeout(resolve, delay));
        if (sessionStorage.getItem('save-fail')) return false;
        sessionStorage.setItem('saved-before-update', 'yes'); return true;
      });
    });
  });
});

test('two real builds update all tabs once after saving, preserve draft and route, and permit rollback', async ({ page, context, request }) => {
  await page.goto('/workbenches/logic?mode=table#draft'); await controlled(page);
  await page.getByRole('textbox', { name: 'Logic expression', exact: true }).fill('P -> Q');
  const second = await context.newPage();
  await second.goto('/workbenches/logic?mode=table#second'); await controlled(second);
  await second.evaluate(() => sessionStorage.setItem('save-delay', '1200'));
  expect(await page.evaluate(() => sessionStorage.getItem('boots'))).toBe('1');
  const a = await page.locator('meta[name="amat-release"]').getAttribute('content');
  await request.post('/__release/b');
  await page.evaluate(async () => { await (await navigator.serviceWorker.getRegistration())?.update(); });
  await expect.poll(() => page.locator('meta[name="amat-release"]').getAttribute('content'), { timeout: 25000 }).not.toBe(a);
  await expect.poll(() => second.locator('meta[name="amat-release"]').getAttribute('content')).not.toBe(a);
  await controlled(page); await controlled(second);
  for (const tab of [page, second]) {
    expect(await tab.evaluate(() => sessionStorage.getItem('boots'))).toBe('2');
    expect(await tab.evaluate(() => sessionStorage.getItem('saved-before-update'))).toBe('yes');
  }
  await expect(page).toHaveURL(/mode=table#draft$/);
  await expect(second).toHaveURL(/mode=table#second$/);
  await expect(page.getByRole('textbox', { name: 'Logic expression', exact: true })).toHaveValue('P -> Q');
  await request.post('/__release/a');
  await page.evaluate(async () => { await (await navigator.serviceWorker.getRegistration())?.update(); });
  await expect.poll(() => page.locator('meta[name="amat-release"]').getAttribute('content'), { timeout: 25000 }).toBe(a);
  expect(await page.evaluate(() => sessionStorage.getItem('boots'))).toBe('3');
});

test('failed or timed-out saving keeps both tabs on the old release and allows retry', async ({ page, context, request }) => {
  await page.goto('/workbenches/logic'); await controlled(page);
  const second = await context.newPage(); await second.goto('/workbenches/logic'); await controlled(second);
  await second.evaluate(() => sessionStorage.setItem('save-fail', 'yes'));
  const a = await page.locator('meta[name="amat-release"]').getAttribute('content');
  await request.post('/__release/b');
  await page.evaluate(async () => { await (await navigator.serviceWorker.getRegistration())?.update(); });
  await expect(page.getByText('Update ready. Save your work and retry.', { exact: true })).toBeVisible({ timeout: 20000 });
  for (const tab of [page, second]) {
    expect(await tab.locator('meta[name="amat-release"]').getAttribute('content')).toBe(a);
    expect(await tab.evaluate(() => document.querySelector('main')?.inert)).toBe(false);
  }
  await second.evaluate(() => { sessionStorage.removeItem('save-fail'); sessionStorage.setItem('save-delay', '20000'); });
  await page.getByRole('button', { name: 'Save & update' }).click();
  await expect(page.getByText('Update ready. Save your work and retry.', { exact: true })).toBeVisible({ timeout: 20000 });
  expect(await page.locator('meta[name="amat-release"]').getAttribute('content')).toBe(a);
  await second.evaluate(() => sessionStorage.removeItem('save-delay'));
  await page.getByRole('button', { name: 'Save & update' }).click();
  await expect.poll(() => page.locator('meta[name="amat-release"]').getAttribute('content'), { timeout: 25000 }).not.toBe(a);
});

test('an unresponsive page blocks release until it closes; offline reconnection resumes detection', async ({ page, context, request }) => {
  await page.goto('/workbenches/logic'); await controlled(page);
  const silent = await context.newPage(); await silent.goto('/offline.html');
  const a = await page.locator('meta[name="amat-release"]').getAttribute('content');
  await context.setOffline(true); await request.post('/__release/b');
  expect(await page.locator('meta[name="amat-release"]').getAttribute('content')).toBe(a);
  await context.setOffline(false);
  await page.evaluate(async () => { await (await navigator.serviceWorker.getRegistration())?.update(); });
  await expect(page.getByText('Update ready. Save your work and retry.', { exact: true })).toBeVisible({ timeout: 25000 });
  expect(await page.locator('meta[name="amat-release"]').getAttribute('content')).toBe(a);
  await silent.close(); await page.getByRole('button', { name: 'Save & update' }).click();
  await expect.poll(() => page.locator('meta[name="amat-release"]').getAttribute('content'), { timeout: 25000 }).not.toBe(a);
});

test('failed precaching retains the usable active release and retries when the manifest recovers', async ({ page, request }) => {
  await page.goto('/workbenches/logic'); await controlled(page);
  const a = await page.locator('meta[name="amat-release"]').getAttribute('content');
  await request.post('/__release/b'); await request.post('/__manifest/fail');
  await page.evaluate(async () => { await (await navigator.serviceWorker.getRegistration())?.update(); });
  await expect.poll(() => page.evaluate(async () => (await navigator.serviceWorker.getRegistration())?.installing?.state ?? 'settled'), { timeout: 15000 }).toBe('settled');
  expect(await page.locator('meta[name="amat-release"]').getAttribute('content')).toBe(a);
  expect(await page.evaluate(() => sessionStorage.getItem('boots'))).toBe('1');
  await request.post('/__manifest/ok');
  await page.evaluate(async () => { await (await navigator.serviceWorker.getRegistration())?.update(); });
  await expect.poll(() => page.locator('meta[name="amat-release"]').getAttribute('content'), { timeout: 25000 }).not.toBe(a);
});

for (const route of ['/modules/logic?view=practice', '/exam']) {
  test(`release preserves selected answers and exact questions on ${route}`, async ({ page, request }) => {
    await page.goto(route);
    const runner = page.locator('[data-testid="mixed-practice"], [data-testid="mixed-exam"]');
    await expect(runner).toHaveAttribute('data-hydrated', 'true');
    await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
    const option = runner.getByRole('radio').first();
    await option.check();
    const selectedText = await option.locator('..').textContent();
    const release = await page.locator('meta[name="amat-release"]').getAttribute('content');
    await request.post('/__release/b');
    await page.evaluate(async () => { await (await navigator.serviceWorker.getRegistration())?.update(); });
    await expect.poll(() => page.locator('meta[name="amat-release"]').getAttribute('content'), { timeout: 25000 }).not.toBe(release);
    await expect(runner).toHaveAttribute('data-hydrated', 'true');
    await expect(runner.getByRole('radio').first()).toBeChecked();
    expect(await runner.getByRole('radio').first().locator('..').textContent()).toBe(selectedText);
    expect(await page.evaluate(() => sessionStorage.getItem('boots'))).toBe('2');
  });
}
