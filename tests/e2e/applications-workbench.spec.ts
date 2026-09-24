import { expect, test } from '@playwright/test';

test('Applications module retains its lessons without a dedicated workbench', async ({ page }) => {
  await page.goto('/modules/applications?view=notes');

  const notes = page.locator('[data-module-view="notes"]');
  await expect(notes).toBeVisible();
  for (const title of [
    'Graphical linear programming',
    'Game theory foundations',
    'Simplex tableau trace',
    'Markov chains',
  ]) {
    await expect(notes.getByRole('link', { name: new RegExp(title) })).toBeVisible();
  }
  await expect(page.getByTestId('optimization-strategy-workbench')).toHaveCount(0);
  await expect(page.locator('a[href^="/workbenches/applications"]')).toHaveCount(0);
});

test('former Applications workbench URL redirects to the retained course notes', async ({ page }) => {
  await page.goto('/workbenches/applications?mode=game');

  await expect(page).toHaveURL(/\/modules\/applications\?view=notes$/);
  await expect(page.locator('[data-module-view="notes"]')).toBeVisible();
  await expect(page.getByTestId('optimization-strategy-workbench')).toHaveCount(0);
});