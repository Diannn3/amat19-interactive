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

test('all module pages use the compact Blueprint sheet without horizontal overflow', async ({ page }) => {
  const modules = ['logic', 'probability', 'finance', 'linear', 'applications'];
  for (const module of modules) {
    for (const suffix of ['', '?view=notes', '?view=practice']) {
      await page.goto(`/modules/${module}${suffix}`);
      await expect(page.locator('h1').first()).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);

      const overview = page.getByTestId('module-overview');
      expect(await overview.evaluate(el => getComputedStyle(el).backgroundImage)).toBe('none');
      expect(await overview.evaluate(el => getComputedStyle(el).backgroundColor)).not.toBe('rgb(19, 59, 92)');

      if (suffix.includes('practice')) {
        await expect(page.getByTestId('mixed-practice')).toHaveAttribute('data-hydrated', 'true');
      }
    }
  }
});

test('Applications is visibly notes-first and never revives the retired Optimization workbench CTA', async ({ page }) => {
  await page.goto('/modules/applications');
  const overview = page.getByTestId('module-overview');
  await expect(overview.getByRole('link', { name: 'Read Applications notes' })).toHaveAttribute('href', '/modules/applications?view=notes');
  await expect(overview).toContainText('Notes-first');
  await expect(page.getByRole('link', { name: /Open Optimization & Strategy/i })).toHaveCount(0);
  await expect(page.locator('a[href^="/workbenches/applications"]')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Start with the notes.' })).toBeVisible();
});
