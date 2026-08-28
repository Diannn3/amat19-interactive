import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('@core counting explorer selects a model before revealing the exact count', async ({ page }) => {
  await page.goto('/labs/counting');
  const lab = page.getByTestId('counting-lab');
  await expect(lab).toHaveAttribute('data-hydrated', 'true');
  await lab.getByRole('radio', { name: /Permutation nPr/i }).check();
  await lab.getByRole('button', { name: 'Check method' }).click();
  await expect(lab.getByText(/P\(8, 3\) = 336/)).toBeVisible();

  await lab.getByLabel('Available choices, n').fill('20');
  await lab.getByLabel('Selected/filled, r').fill('2');
  await lab.getByRole('radio', { name: /No — only the chosen group matters/i }).check();
  await lab.getByRole('radio', { name: /Combination nCr/i }).check();
  await lab.getByRole('button', { name: 'Check method' }).click();
  await expect(lab.getByText(/C\(20, 2\) = 190/)).toBeVisible();
});

test('@core conditional probability makes the active denominator visible and checks independence exactly', async ({ page }) => {
  await page.goto('/labs/conditional-probability');
  const lab = page.getByTestId('conditional-probability-lab');
  await expect(lab).toHaveAttribute('data-hydrated', 'true');
  await expect(lab.getByText(/B contains 36 of 100 observations/i)).toBeVisible();
  await lab.getByRole('radio', { name: /Compute P\(B \| A\)/i }).check();
  await expect(lab.getByText(/A contains 40 of 100 observations/i)).toBeVisible();
  await lab.getByRole('button', { name: 'Tree' }).click();
  await expect(lab.getByRole('img', { name: /Probability tree/i })).toBeVisible();
  await lab.getByRole('radio', { name: 'Dependent', exact: true }).check();
  await lab.getByRole('button', { name: 'Check independence' }).click();
  await expect(lab.getByText('Dependent.', { exact: true })).toBeVisible();
});

test('probability lab routes are free of serious automated accessibility violations', async ({ page }) => {
  for (const route of ['/labs/counting', '/labs/conditional-probability']) {
    await page.goto(route);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations.filter((violation) => ['critical', 'serious'].includes(violation.impact ?? '')), route).toEqual([]);
  }
});
