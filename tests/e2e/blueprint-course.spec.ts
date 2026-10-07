import { expect, test } from '@playwright/test';

test('four active workbenches and five course modules remain discoverable', async ({ page }) => {
  await page.goto('/course');
  await expect(page.locator('[data-course-workbench]')).toHaveCount(4);
  await expect(page.getByRole('button', { name: 'Applications', exact: true })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Read Applied Models notes' })).toHaveAttribute('href', '/modules/applications?view=notes');
  await expect(page.getByText('Module 5: Applied Models & Optimization')).toBeVisible();
});

test('applications study notes are usable without an applications workbench', async ({ page }) => {
  await page.goto('/modules/applications');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByTestId('module-overview').getByRole('link', { name: 'Read the notes' })).toBeVisible();
  await expect(page.locator('a[href^="/workbenches/applications"]')).toHaveCount(0);
  await page.goto('/workbenches/applications');
  await expect(page).toHaveURL(/\/modules\/applications\?view=notes$/);
});

test('reference examples from applications lead to functional lessons', async ({ page }) => {
  await page.goto('/reference');
  await expect(page.locator('a[href^="/workbenches/applications"]')).toHaveCount(0);
});
