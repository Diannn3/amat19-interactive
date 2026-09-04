import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/workbenches/applications');
});

test('@core Linear program leads with exact status, optimum, and feasible geometry', async ({ page }) => {
  const workbench = page.getByTestId('optimization-strategy-workbench');
  await expect(workbench).toHaveAttribute('data-hydrated', 'true');
  await expect(workbench.getByRole('heading', { name: 'See the feasible region before choosing a corner.' })).toBeVisible();
  await expect(workbench.locator('[data-optimization-result]')).not.toBeVisible();
  await workbench.getByLabel('Best corner x-coordinate').fill('3');
  await workbench.getByLabel('Best corner y-coordinate').fill('1');
  await workbench.getByRole('button', { name: 'Check corner' }).click();
  await expect(workbench.getByText('Correct. That corner gives the best feasible objective value.')).toBeVisible();
  await expect(workbench.getByText('Z = 11 at (3, 1)')).toBeVisible();
  await expect(workbench.getByRole('img', { name: /bounded feasible region with 5 corner points/i })).toBeVisible();

  const visiblePrimaryControls = workbench.locator('[data-primary-control]:visible');
  expect(await visiblePrimaryControls.count()).toBeLessThanOrEqual(8);
});

test('@core Linear program custom objective updates the exact optimum', async ({ page }) => {
  const workbench = page.getByTestId('optimization-strategy-workbench');
  await workbench.getByText('Edit objective and constraints').click();
  await workbench.getByLabel('Objective x coefficient').fill('1');
  await workbench.getByLabel('Objective y coefficient').fill('3');
  await workbench.getByLabel('Best corner x-coordinate').fill('2');
  await workbench.getByLabel('Best corner y-coordinate').fill('2');
  await workbench.getByRole('button', { name: 'Check corner' }).click();
  await expect(workbench.getByText('Z = 8 at (2, 2)')).toBeVisible();
});

test('@core Game theory exposes security levels and the mixed strategy', async ({ page }) => {
  const workbench = page.getByTestId('optimization-strategy-workbench');
  await workbench.getByRole('button', { name: 'Zero-sum game' }).click();

  await expect(workbench.getByText('Mixed equilibrium')).not.toBeVisible();
  await workbench.getByLabel('Dominance check').selectOption('none');
  await workbench.getByRole('button', { name: 'Check dominance' }).click();
  await expect(workbench.getByText('Correct. No strategy is strictly dominated.')).toBeVisible();
  await expect(workbench.getByText('Mixed equilibrium')).toBeVisible();
  await expect(workbench.getByText('Row mix (1/3, 2/3)')).toBeVisible();
  await expect(workbench.getByText('Column mix (1/2, 1/2)')).toBeVisible();
  await expect(workbench.getByText('Game value 2')).toBeVisible();
});

test('@core Advanced view keeps simplex and Markov subordinate to the model', async ({ page }) => {
  const workbench = page.getByTestId('optimization-strategy-workbench');
  await workbench.getByRole('button', { name: 'Advanced' }).click();

  await expect(workbench.getByText('Simplex optimum Z = 11')).toBeVisible();
  await workbench.getByText('Two-state Markov forecast').click();
  await expect(workbench.getByText('After 3 steps: (86/125, 39/125)')).toBeVisible();
  await expect(workbench.getByText('Stationary: (2/3, 1/3)')).toBeVisible();
});

test('Optimization & Strategy keeps the exact optimum above the mobile dock', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.reload();
  await page.locator('.workspace-scroll').evaluate((element) => { element.scrollTop = 0; });
  const workbench = page.getByTestId('optimization-strategy-workbench');
  await workbench.getByLabel('Best corner x-coordinate').fill('3');
  await workbench.getByLabel('Best corner y-coordinate').fill('1');
  await workbench.getByRole('button', { name: 'Check corner' }).click();
  const metrics = await page.getByTestId('optimization-strategy-workbench').evaluate((element) => {
    const optimum = element.querySelector<HTMLElement>('[data-optimization-result] strong');
    const dock = document.querySelector<HTMLElement>('.mobile-nav');
    const optimumBox = optimum?.getBoundingClientRect();
    const dockBox = dock?.getBoundingClientRect();
    return {
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      optimumBottom: optimumBox?.bottom ?? Infinity,
      dockTop: dockBox?.top ?? 667,
    };
  });

  expect(metrics.overflow).toBe(false);
  expect(metrics.optimumBottom).toBeLessThanOrEqual(metrics.dockTop);
});

test('Optimization & Strategy is free of serious automated accessibility violations', async ({ page }) => {
  await expect(page.getByTestId('optimization-strategy-workbench')).toHaveAttribute('data-hydrated', 'true', { timeout: 10_000 });
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter((violation) => ['critical', 'serious'].includes(violation.impact ?? ''))).toEqual([]);
});
