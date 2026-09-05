import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/workbenches/probability');
});

test('@core Counting selects the model before showing the exact count', async ({ page }) => {
  const workbench = page.getByTestId('probability-model-builder');
  await expect(workbench).toHaveAttribute('data-hydrated', 'true');
  await expect(workbench.getByRole('heading', { name: 'Name what makes an outcome different.' })).toBeVisible();
  await expect(workbench.getByRole('option', { name: /Permutation · order, no repeats/ })).toBeAttached();
  await expect(workbench.locator('[data-probability-result]')).not.toBeVisible();

  await workbench.getByLabel('Counting model').selectOption('combination');
  await workbench.getByRole('button', { name: 'Check model' }).click();
  await expect(workbench.locator('[data-counting-feedback] [data-tone="error"]')).toContainText('Recheck');
  await expect(workbench.locator('[data-probability-result]')).not.toBeVisible();

  await workbench.getByLabel('Counting model').selectOption('permutation');
  await workbench.getByRole('button', { name: 'Check model' }).click();
  await expect(workbench.locator('[data-counting-feedback] [data-tone="success"]')).toContainText('Correct model');
  await expect(workbench.getByText('P(8, 3) = 336')).toBeVisible();

  const visibleCountingControls = workbench.locator('.probability-builder__counting-controls [data-primary-control]:visible, .probability-builder__counting-check [data-primary-control]:visible');
  expect(await visibleCountingControls.count()).toBeLessThanOrEqual(6);
});

test('@core Conditioning keeps the active denominator visible and checks the answer first', async ({ page }) => {
  const workbench = page.getByTestId('probability-model-builder');
  await workbench.getByRole('combobox', { name: 'Choose a task' }).selectOption('conditioning');

  await expect(workbench.getByRole('table', { name: 'Two-way count table' })).toBeVisible();
  await expect(workbench.getByLabel('Conditional probability answer')).toBeVisible();
  await expect(workbench.getByText('P(A | B) = 4/5')).not.toBeVisible();

  await workbench.getByLabel('Conditional probability answer').fill('3/5');
  await workbench.getByRole('button', { name: 'Check answer', exact: true }).click();
  await expect(workbench.getByRole('status')).toContainText('Recheck');
  await expect(workbench.getByText('P(A | B) = 4/5')).not.toBeVisible();

  await workbench.getByLabel('Conditional probability answer').fill('4/5');
  await workbench.getByRole('button', { name: 'Check answer', exact: true }).click();
  await expect(workbench.getByRole('status')).toContainText('Correct');
  await expect(workbench.getByText('P(A | B) = 4/5')).toBeVisible();
  await expect(workbench.getByText('20 favorable inside 25 observations in B.')).toBeVisible();
});

test('@core Bayes reuses the event table and checks the posterior first', async ({ page }) => {
  const workbench = page.getByTestId('probability-model-builder');
  await workbench.getByRole('combobox', { name: 'Choose a task' }).selectOption('bayes');

  await expect(workbench.getByRole('table', { name: 'Two-way count table' })).toBeVisible();
  await expect(workbench.getByLabel('Posterior probability answer')).toBeVisible();
  await expect(workbench.getByText('P(A | B) = 4/5')).not.toBeVisible();
  await expect(workbench.getByText('A → B', { exact: true })).not.toBeVisible();

  await workbench.getByLabel('Posterior probability answer').fill('4/5');
  await workbench.getByRole('button', { name: 'Check answer', exact: true }).click();
  await expect(workbench.getByRole('status')).toContainText('Correct');
  await expect(workbench.getByText('P(A | B) = 4/5')).toBeVisible();
  await expect(workbench.getByText('A → B', { exact: true })).toBeVisible();
});

test('@core Verification is reproducible and labelled as evidence, not proof', async ({ page }) => {
  const workbench = page.getByTestId('probability-model-builder');
  await workbench.getByRole('combobox', { name: 'Choose a task' }).selectOption('verify');
  await workbench.getByRole('button', { name: 'Run verification' }).click();

  await expect(workbench.getByText(/Completed 10,000 seeded trials/)).toBeVisible();
  await expect(workbench.getByText('Theoretical probability 1/2')).toBeVisible();
  await expect(workbench.getByText(/Simulation is evidence, not proof/)).toBeVisible();
});

test('@core event-table edits stay synchronized across Bayes and verification views', async ({ page }) => {
  const workbench = page.getByTestId('probability-model-builder');
  const picker = workbench.getByRole('combobox', { name: 'Choose a task' });
  await picker.selectOption('conditioning');
  await workbench.getByRole('spinbutton', { name: 'A and B', exact: true }).fill('10');
  await picker.selectOption('bayes');
  await expect(workbench.getByRole('spinbutton', { name: 'A and B', exact: true })).toHaveValue('10');
  await picker.selectOption('verify');
  await expect(workbench.getByText(/Exact P\(B\) from this table/)).toBeVisible();
});

test('Probability Model Builder keeps the first exact result above the mobile dock', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.reload();
  const updateDismiss = page.getByRole('button', { name: 'Later', exact: true });
  if (await updateDismiss.isVisible()) await updateDismiss.click();
  await page.locator('.workspace-scroll').evaluate((element) => { element.scrollTop = 0; });
  const workbench = page.getByTestId('probability-model-builder');
  await workbench.getByLabel('Counting model').selectOption('permutation');
  await workbench.getByRole('button', { name: 'Check model' }).click();
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
