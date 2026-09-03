import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/workbenches/probability');
});

test('@core Counting selects the model before showing the exact count', async ({ page }) => {
  const workbench = page.getByTestId('probability-model-builder');
  await expect(workbench).toHaveAttribute('data-hydrated', 'true');
  await expect(workbench.getByRole('heading', { name: 'Name what makes an outcome different.' })).toBeVisible();
  await expect(workbench.getByText('Permutation', { exact: true })).toBeVisible();
  await expect(workbench.getByText('P(8, 3) = 336')).toBeVisible();

  const visiblePrimaryControls = workbench.locator('[data-primary-control]:visible');
  expect(await visiblePrimaryControls.count()).toBeLessThanOrEqual(8);
});

test('@core Conditioning keeps the active denominator visible', async ({ page }) => {
  const workbench = page.getByTestId('probability-model-builder');
  await workbench.getByRole('button', { name: 'Conditioning' }).click();

  await expect(workbench.getByText('P(A | B) = 4/5')).toBeVisible();
  await expect(workbench.getByText('20 favorable inside 25 observations in B.')).toBeVisible();
  await expect(workbench.getByRole('table', { name: 'Two-way count table' })).toBeVisible();
});

test('@core Bayes follows joint paths to the posterior', async ({ page }) => {
  const workbench = page.getByTestId('probability-model-builder');
  await workbench.getByRole('button', { name: 'Bayes' }).click();

  await expect(workbench.getByText('P(A | +) = 2/3')).toBeVisible();
  await expect(workbench.getByText('4/25 + 2/25 = 6/25')).toBeVisible();
});

test('@core Verification is reproducible and labelled as evidence, not proof', async ({ page }) => {
  const workbench = page.getByTestId('probability-model-builder');
  await workbench.getByRole('button', { name: 'Verify' }).click();
  await workbench.getByRole('button', { name: 'Run verification' }).click();

  await expect(workbench.getByText(/Completed 10,000 seeded trials/)).toBeVisible();
  await expect(workbench.getByText('Theoretical probability 1/3')).toBeVisible();
  await expect(workbench.getByText(/Simulation is evidence, not proof/)).toBeVisible();
});

test('Probability Model Builder keeps the first exact result above the mobile dock', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.reload();
  await page.locator('.workspace-scroll').evaluate((element) => { element.scrollTop = 0; });
  const metrics = await page.getByTestId('probability-model-builder').evaluate((element) => {
    const result = element.querySelector<HTMLElement>('[data-probability-result] strong');
    const dock = document.querySelector<HTMLElement>('.mobile-nav');
    const resultBox = result?.getBoundingClientRect();
    const dockBox = dock?.getBoundingClientRect();
    return {
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      resultBottom: resultBox?.bottom ?? Infinity,
      dockTop: dockBox?.top ?? 667,
    };
  });

  expect(metrics.overflow).toBe(false);
  expect(metrics.resultBottom).toBeLessThanOrEqual(metrics.dockTop);
});

test('Probability Model Builder is free of serious automated accessibility violations', async ({ page }) => {
  await expect(page.getByTestId('probability-model-builder')).toHaveAttribute('data-hydrated', 'true', { timeout: 10_000 });
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter((violation) => ['critical', 'serious'].includes(violation.impact ?? ''))).toEqual([]);
});
