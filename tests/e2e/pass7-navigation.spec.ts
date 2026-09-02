import { expect, test } from '@playwright/test';

test.describe('Instrument navigation and workspace clarity', () => {
  test('desktop exposes four primary destinations plus quiet utilities', async ({ page }) => {
    test.skip((page.viewportSize()?.width ?? 0) < 901, 'Desktop rail contract.');
    await page.goto('/');
    const primary = page.getByRole('navigation', { name: 'Primary navigation' });
    await expect(primary.locator('.nav-link')).toHaveCount(4);
    for (const label of ['Home', 'Study', 'Course', 'Progress']) await expect(primary.getByRole('link', { name: label, exact: true })).toBeVisible();
    const utilities = page.getByRole('navigation', { name: 'Utilities' });
    for (const label of ['Reference', 'Saved', 'Settings']) await expect(utilities.getByRole('link', { name: label, exact: true })).toBeVisible();
    await expect(utilities.getByRole('button', { name: 'Developer contact', exact: true })).toBeVisible();
    await expect(page.locator('.sidebar-toggle, [data-more-menu], [data-more-flyout]')).toHaveCount(0);
  });

  test('home answers what to continue, review, and study next from local evidence', async ({ page }) => {
    await page.goto('/');
    const home = page.getByTestId('home-dashboard');
    await expect(home).toBeVisible();
    await expect(home.getByRole('heading', { name: 'Continue studying' })).toBeVisible();
    await expect(home.getByRole('heading', { name: 'Review & repair' })).toBeVisible();
    await expect(home.getByRole('heading', { name: 'Next' })).toBeVisible();
    await expect(home.locator('.home-continue__math')).toBeVisible();
    await expect(home).not.toContainText(/around\s+\d+\s+min/i);
  });

  test('module views stay deep-linkable and separate labs, notes, and practice', async ({ page }) => {
    await page.goto('/modules/logic');
    const tabs = page.getByRole('navigation', { name: 'Module sections' });
    await expect(tabs.getByRole('link', { name: /^Overview/ })).toHaveAttribute('aria-current', 'page');
    await tabs.getByRole('link', { name: /^Labs/ }).click();
    await expect(page).toHaveURL(/\/modules\/logic\?view=labs$/);
    await expect(page.locator('[data-module-view="labs"]')).toBeVisible();
    await tabs.getByRole('link', { name: /^Notes/ }).click();
    await expect(page).toHaveURL(/\/modules\/logic\?view=notes$/);
    await expect(page.locator('[data-module-view="notes"]')).toBeVisible();
    await page.goto('/modules/logic?view=practice&preset=logic-drill');
    await expect(page.locator('[data-module-view="practice"]')).toBeVisible();
    await expect(page.getByTestId('mixed-practice')).toBeVisible();
  });

  test('learner-facing indexes keep implementation taxonomy out of visible copy', async ({ page }) => {
    await page.goto('/modules/logic?view=labs');
    const copy = await page.locator('main').innerText();
    expect(copy).not.toMatch(/\b(engine-ready|implemented|live module)\b/i);
    expect(copy).not.toMatch(/\b(logic|probability|finance|linear|applications)\.[a-z-]+/i);
    await page.goto('/course');
    const courseCopy = await page.locator('main').innerText();
    expect(courseCopy).not.toMatch(/engine-ready/i);
  });

  test('every lab route uses the same canvas-first shell without permanent side rails', async ({ page }) => {
    await page.goto('/labs/truth-table');
    await expect(page.locator('[data-lab-shell]')).toHaveCount(1);
    await expect(page.locator('.lab-route__canvas')).toBeVisible();
    await expect(page.locator('.lab-route__context-rail, .lab-route__support')).toHaveCount(0);
    await expect(page.locator('.lab-about > summary')).toHaveText('About this workspace');
  });

  test('settings keeps the functional local motion preference', async ({ page }) => {
    await page.goto('/settings');
    const settings = page.getByTestId('settings-panel');
    await expect(settings).toBeVisible();
    const motion = settings.getByRole('checkbox');
    await motion.check();
    await expect.poll(() => page.evaluate(() => document.documentElement.dataset.motion)).toBe('reduced');
    await page.reload();
    await expect.poll(() => page.evaluate(() => document.documentElement.dataset.motion)).toBe('reduced');
    await expect(motion).toBeChecked();
  });

  test('local-data surfaces explain browser-local persistence without implementation labels', async ({ page }) => {
    await page.goto('/progress');
    const dataManager = page.getByTestId('data-manager');
    await expect(dataManager).toBeVisible();
    await expect(dataManager).toContainText('Your work stays in this browser.');
    await expect(dataManager).not.toContainText(/schema v|IndexedDB/i);
  });

  test('reference filters restore from the URL and remain expandable', async ({ page }) => {
    await page.goto('/reference?q=conditional&module=Probability');
    const reference = page.getByTestId('reference-browser');
    await expect(reference).toHaveAttribute('data-hydrated', 'true');
    await expect(reference.getByRole('searchbox', { name: 'Search reference' })).toHaveValue('conditional');
    await expect(reference.getByRole('combobox', { name: 'Filter by module' })).toHaveValue('Probability');
    await expect(reference.locator('.reference-entry')).toHaveCount(1);
  });
});

test('mobile navigation keeps the four core destinations and More visible', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('/');
  const mobile = page.getByRole('navigation', { name: 'Mobile navigation' });
  for (const label of ['Home', 'Study', 'Course', 'Progress', 'More']) await expect(mobile.getByText(label, { exact: true })).toBeVisible();
  const more = mobile.locator('.mobile-more-menu');
  await more.locator('summary').click();
  await expect(more.getByRole('button', { name: 'Developer contact' })).toBeVisible();
});
