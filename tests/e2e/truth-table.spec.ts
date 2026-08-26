import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('truth-table journey parses, explains, practices, and persists', async ({ page }) => {
  await page.goto('/labs/truth-table');
  const lab = page.getByTestId('truth-table-lab');
  await expect(lab).toBeVisible();

  const input = lab.locator('input').first();
  await input.fill('P -> Q');
  await expect(lab.getByText('4 rows = 2^2')).toBeVisible();

  await lab.getByRole('button', { name: /row 2, p → q: false/i }).click();
  await expect(lab.getByText(/antecedent is true and the consequent is false/i)).toBeVisible();

  await lab.getByRole('tab', { name: 'Practice' }).click();
  await lab.getByRole('button', { name: /practice row 2/i }).click();
  await lab.getByRole('button', { name: 'F · False' }).click();
  await expect(lab.getByText('Row 2 is correct.')).toBeVisible();

  await page.reload();
  await expect(input).toHaveValue('P -> Q');
});

test('argument mode validates the supplied exam-style argument and surfaces counterexamples', async ({ page }) => {
  await page.goto('/labs/truth-table');
  const lab = page.getByTestId('truth-table-lab');
  await lab.getByRole('tab', { name: 'Argument' }).click();

  await expect(lab.getByText('Valid argument', { exact: true })).toBeVisible();

  const premises = lab.getByLabel(/Premise \d+/);
  await premises.nth(0).fill('P -> Q');
  await premises.nth(1).fill('Q');
  await lab.getByLabel('Conclusion').fill('P');

  await expect(lab.getByText('Invalid argument', { exact: true })).toBeVisible();
  await expect(lab.getByText('Counterexample', { exact: true })).toBeVisible();
});

test('truth-table route has no serious automated accessibility violations', async ({ page }) => {
  await page.goto('/labs/truth-table');
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter((violation) => ['critical', 'serious'].includes(violation.impact ?? ''))).toEqual([]);
});

test('mobile page does not create page-level horizontal overflow', async ({ page }) => {
  await page.goto('/labs/truth-table');
  const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(hasOverflow).toBe(false);
});
