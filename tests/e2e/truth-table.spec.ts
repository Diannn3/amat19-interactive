import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('@core truth-table journey parses, explains, practices, classifies, and persists', async ({ page }) => {
  await page.goto('/labs/truth-table');
  const lab = page.getByTestId('truth-table-lab');
  await expect(lab).toBeVisible();

  const input = lab.getByLabel('Logic proposition');
  await input.fill('P -> Q');
  await expect(lab.getByText(/4 rows = 2\^2/i)).toBeVisible();
  await expect(lab.getByText(/P repeats T for 2 rows/i)).toBeVisible();

  await lab.getByRole('button', { name: /row 2, p → q: false/i }).click();
  await expect(lab.getByText(/antecedent is true and the consequent is false/i)).toBeVisible();

  await lab.getByRole('tab', { name: 'Practice' }).click();
  await lab.getByRole('button', { name: /practice row 2/i }).click();
  await lab.getByRole('button', { name: 'F · False' }).click();
  await expect(lab.getByText('Row 2 is correct.')).toBeVisible();

  await lab.getByRole('radio', { name: 'contingent' }).click();
  await lab.getByRole('button', { name: 'Check classification' }).click();
  await expect(lab.getByText(/final column has 3 true rows and 1 false row/i)).toBeVisible();

  await page.waitForTimeout(450);
  await page.reload();
  await expect(page.getByTestId('truth-table-lab').getByLabel('Logic proposition')).toHaveValue('P -> Q');
});

test('@core argument mode predicts validity and surfaces a concrete counterexample', async ({ page }) => {
  await page.goto('/labs/truth-table');
  const lab = page.getByTestId('truth-table-lab');
  await lab.getByRole('tab', { name: 'Argument' }).click();

  await lab.getByRole('radio', { name: 'Valid', exact: true }).click();
  await lab.getByRole('button', { name: 'Check prediction' }).click();
  await expect(lab.getByText('Valid argument', { exact: true })).toBeVisible();

  const premises = lab.getByLabel(/Premise \d+/);
  await premises.nth(0).fill('P -> Q');
  await premises.nth(1).fill('Q');
  await lab.getByLabel('Conclusion').fill('P');
  await lab.getByRole('radio', { name: 'Invalid', exact: true }).click();
  await lab.getByRole('button', { name: 'Check prediction' }).click();

  await expect(lab.getByText('Invalid argument', { exact: true })).toBeVisible();
  await expect(lab.getByText('Counterexample', { exact: true })).toBeVisible();
});

test('parser errors point to the failing source span and recover without losing the input', async ({ page }) => {
  await page.goto('/labs/truth-table');
  const input = page.getByLabel('Logic proposition');
  await input.fill('P -> )');
  await expect(page.getByRole('alert')).toBeVisible();
  await expect(page.locator('.parse-error-preview mark')).toBeVisible();
  await input.fill('P -> Q');
  await expect(page.getByText(/4 rows = 2\^2/i)).toBeVisible();
});

test('truth-table route has no serious automated accessibility violations', async ({ page }) => {
  await page.goto('/labs/truth-table');
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter((violation) => ['critical', 'serious'].includes(violation.impact ?? ''))).toEqual([]);
});

test('lab keeps wide tables locally scrollable without page-level overflow', async ({ page }) => {
  await page.goto('/labs/truth-table');
  await page.getByLabel('Logic proposition').fill('A & B & C & D');
  await expect(page.getByText(/16 rows = 2\^4/i)).toBeVisible();
  const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(hasOverflow).toBe(false);
});
