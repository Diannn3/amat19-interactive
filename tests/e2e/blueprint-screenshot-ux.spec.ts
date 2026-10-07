import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('reference disclosures flow independently and filters retain source order', async ({ page }) => {
  await page.goto('/reference');
  await expect(page.getByTestId('reference-browser')).toHaveAttribute('data-hydrated', 'true');
  const entries = page.locator('.reference-entry');
  const original = await entries.locator('summary strong').allTextContents();
  await expect(entries).toHaveCount(28);
  const neighbor = page.locator('.reference-entry-column').nth(1).locator('details').first();
  const before = await neighbor.boundingBox();
  await entries.first().locator('summary').click();
  await expect(entries.first()).toHaveAttribute('open', '');
  const after = await neighbor.boundingBox();
  if ((page.viewportSize()?.width ?? 0) > 700) expect(after?.height).toBe(before?.height);
  await page.getByRole('searchbox', { name: 'Search reference' }).fill('zzzz-no-match');
  await expect(page.getByText('No matching reference entries.')).toBeVisible();
  await page.getByRole('button', { name: 'Clear', exact: true }).click();
  expect(await entries.locator('summary strong').allTextContents()).toEqual(original);
});

test('logic practice exposes selection, feedback, and question focus', async ({ page }) => {
  await page.goto('/modules/logic?view=practice');
  const runner = page.getByTestId('mixed-practice');
  await expect(runner).toHaveAttribute('data-hydrated', 'true');
  await expect(runner.getByRole('button', { name: 'Check item' })).toBeDisabled();
  await expect(runner.getByText('Choose an answer to check.')).toBeVisible();
  await runner.getByRole('radio').first().check();
  await runner.getByRole('button', { name: 'Check item' }).click();
  await expect(runner.locator('.mixed-question__result')).toBeVisible();
  await runner.getByRole('button', { name: 'Next question' }).click();
  await expect(runner.locator('.mixed-question__head h3')).toBeFocused();
  await expect(runner.getByRole('button', { name: 'Check item' })).toBeDisabled();
  await runner.getByRole('button', { name: 'Previous', exact: true }).click();
  await expect(runner.locator('.mixed-question__result')).toBeVisible();
  await runner.getByRole('button', { name: 'New set' }).click();
  await expect(runner.locator('.mixed-question__head h3')).toBeFocused();
  await expect(runner.locator('.mixed-question__result')).toHaveCount(0);
});

test('audited learning surfaces have no serious accessibility violations', async ({ page }) => {
  // Four full-page Axe scans can exceed the default budget in Firefox.
  test.setTimeout(90_000);
  for (const route of ['/study', '/reference', '/modules/logic?view=notes', '/modules/logic?view=practice']) {
    await page.goto(route);
    if (route.includes('practice')) await expect(page.getByTestId('mixed-practice')).toHaveAttribute('data-hydrated', 'true');
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations.filter(item => item.impact === 'serious' || item.impact === 'critical')).toEqual([]);
  }
});

test('audited pages fit the viewport and Logic intro uses a solid surface', async ({ page }) => {
  for (const route of ['/study', '/reference', '/modules/logic', '/modules/logic?view=notes', '/modules/logic?view=practice', '/workbenches/logic']) {
    await page.goto(route);
    await expect(page.locator('h1').first()).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    if (route === '/modules/logic') {
      expect(await page.locator('.module-overview').evaluate(el => getComputedStyle(el).backgroundImage)).toBe('none');
    }
  }
});
