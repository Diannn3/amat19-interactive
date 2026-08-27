import { expect, test } from '@playwright/test';

test.describe('Pass 7 navigation and workspace clarity', () => {
  test('desktop shell exposes four primary destinations and a More utility menu', async ({ page }) => {
    test.skip((page.viewportSize()?.width ?? 0) < 901, 'Desktop navigation is replaced by the mobile dock below 901px.');
    await page.goto('/');

    const primary = page.getByRole('navigation', { name: 'Primary navigation' });
    await expect(primary.locator('.nav-link')).toHaveCount(4);
    for (const label of ['Study', 'Course', 'Practice', 'Progress']) {
      await expect(primary.getByRole('link', { name: label, exact: true })).toBeVisible();
    }

    const more = primary.locator('[data-more-menu]');
    await expect(more).toBeVisible();
    await more.locator('summary').click();
    for (const label of ['Reference', 'Saved', 'Settings']) {
      await expect(more.getByRole('link', { name: label, exact: true })).toBeVisible();
    }
  });

  test('home is a compact hub with abstract module cards', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('.home-hub')).toBeVisible();
    await expect(page.locator('.home-hub h1')).toHaveText('Make the next step visible.');
    await expect(page.locator('.module-spotlight-link')).toHaveCount(5);
    await expect(page.locator('.home-bento')).toHaveCount(0);
    await expect(page.locator('.home-loop')).toHaveCount(0);
    await expect(page.locator('.module-door')).toHaveCount(0);
  });

  test('module views are deep-linkable and expose labs and notes separately', async ({ page }) => {
    await page.goto('/modules/logic');
    const tabs = page.getByRole('navigation', { name: 'Module sections' });
    await expect(tabs.getByRole('link', { name: /^Overview/ })).toHaveAttribute('aria-current', 'page');

    await tabs.getByRole('link', { name: /^Labs/ }).click();
    await expect(page).toHaveURL(/\/modules\/logic\?view=labs$/);
    await expect(page.locator('[data-module-view="labs"]')).toBeVisible();
    await expect(page.locator('.module-lab-link')).not.toHaveCount(0);

    await page.getByRole('navigation', { name: 'Module sections' }).getByRole('link', { name: /^Notes/ }).click();
    await expect(page).toHaveURL(/\/modules\/logic\?view=notes$/);
    await expect(page.locator('[data-module-view="notes"]')).toBeVisible();
  });

  test('shared lab shell gives the math canvas a three-zone frame', async ({ page }) => {
    await page.goto('/labs/truth-table');

    await expect(page.locator('.lab-route__context-rail')).toBeVisible();
    await expect(page.locator('.lab-route__canvas')).toBeVisible();
    await expect(page.locator('.lab-route__support')).toBeVisible();
    await expect(page.locator('[data-lab-shell]')).toHaveCount(1);
  });

  test('reference filters restore from the URL and remain expandable', async ({ page }) => {
    await page.goto('/reference?q=conditional&module=Probability');
    const reference = page.getByTestId('reference-browser');
    await expect(reference.getByRole('searchbox', { name: 'Search reference' })).toHaveValue('conditional');
    await expect(reference.getByRole('combobox', { name: 'Filter by module' })).toHaveValue('Probability');
    await expect(reference.locator('.reference-entry')).toHaveCount(1);
    await expect(reference.locator('.reference-entry').first().locator('summary')).toBeVisible();
  });

  test('practice preset selection is represented in the URL and active state', async ({ page }) => {
    await page.goto('/practice?preset=weak-areas');
    const practice = page.getByTestId('mixed-practice');
    await expect(practice.locator('.practice-presets button[aria-pressed="true"]')).toHaveCount(1);
    await expect(practice.locator('.practice-presets button[aria-pressed="true"]')).toContainText('Weak Areas');

    await practice.locator('.practice-presets button').filter({ hasText: 'Quick 5' }).click();
    await expect(page).toHaveURL(/\/practice\?preset=quick-5$/);
  });
});

test('mobile navigation keeps the four core destinations and More visible', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('/');
  const mobile = page.getByRole('navigation', { name: 'Mobile navigation' });
  await expect(mobile.locator('.mobile-nav-link')).toHaveCount(5);
  for (const label of ['Study', 'Course', 'Practice', 'Progress', 'More']) {
    await expect(mobile.getByText(label, { exact: true })).toBeVisible();
  }
});
