import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/workbenches/probability');
  await expect(page.getByTestId('probability-model-builder')).toHaveAttribute('data-hydrated', 'true');
});

test('@core four Radix tabs control distinct panels and the canonical view query', async ({ page }) => {
  const lab = page.getByTestId('probability-model-builder');
  await expect(lab).toHaveAttribute('data-hydrated', 'true');
  await expect(lab.getByRole('tab')).toHaveCount(4);
  await expect(lab.getByRole('tab', { name: 'Conditional Probability' })).toHaveAttribute('aria-selected', 'true');
  await expect(lab.getByRole('table', { name: 'Two-way count table' })).toBeVisible();
  await lab.getByRole('tab', { name: 'Distributions' }).click();
  await expect(page).toHaveURL(/view=distribution/);
  await expect(lab.getByRole('table', { name: 'Discrete probability distribution' })).toBeVisible();
  await expect(lab.getByRole('table', { name: 'Two-way count table' })).not.toBeVisible();
  await lab.getByRole('tab', { name: 'Random Variables' }).click();
  await expect(lab.getByRole('table', { name: 'Two-coin random-variable mapping' })).toBeVisible();
  await lab.getByRole('tab', { name: /Inference/ }).click();
  await expect(lab.getByRole('heading', { name: 'Estimate one population proportion' })).toBeVisible();
  await expect(lab.getByRole('tab', { name: 'Inference Supplemental' })).toBeVisible();
});

test('@core query overrides persisted view; Back and Forward restore selected panels', async ({ page }) => {
  const lab = page.getByTestId('probability-model-builder');
  await lab.getByRole('tab', { name: 'Distributions' }).click();
  await lab.getByRole('tab', { name: 'Random Variables' }).click();
  await page.goBack();
  await expect(lab.getByRole('tab', { name: 'Distributions' })).toHaveAttribute('aria-selected', 'true');
  await page.goForward();
  await expect(lab.getByRole('tab', { name: 'Random Variables' })).toHaveAttribute('aria-selected', 'true');
  await page.goto('/workbenches/probability?view=inference');
  await expect(lab.getByRole('tab', { name: /Inference/ })).toHaveAttribute('aria-selected', 'true');
});

test('@core conditional Venn and exact probabilities derive from the same edited counts', async ({ page }) => {
  const lab = page.getByTestId('probability-model-builder');
  await lab.getByLabel('A and B', { exact: true }).fill('10');
  await expect(lab.getByRole('img', { name: /intersection 10/ })).toBeVisible();
  await expect(lab.getByText('P(A ∩ B)').locator('..')).toContainText('1/4');
  await lab.getByLabel('Conditional probability answer').fill('2/3');
  await lab.getByRole('button', { name: 'Check answer' }).click();
  await expect(lab.getByRole('status')).toContainText('Correct');
  await lab.getByRole('tab', { name: 'Distributions' }).click();
  await lab.getByRole('tab', { name: 'Conditional Probability' }).click();
  await expect(lab.getByText('Correct', { exact: true })).toHaveCount(0);
});

test('@core distribution validates total mass and computes exact moments', async ({ page }) => {
  const lab = page.getByTestId('probability-model-builder');
  await lab.getByRole('tab', { name: 'Distributions' }).click();
  await expect(lab.getByText('Var(X)').locator('..')).toContainText('1/2');
  await lab.getByLabel('Probability for row 1').fill('1/2');
  await expect(lab.getByRole('alert')).toContainText('sum to 1');
  await expect(lab.getByText('Var(X)')).not.toBeVisible();
});

test('@core random variable edits aggregate repeated outcomes through exact PMF', async ({ page }) => {
  const lab = page.getByTestId('probability-model-builder');
  await lab.getByRole('tab', { name: 'Random Variables' }).click();
  await expect(lab.getByRole('list')).toContainText('P(X=1) = 1/2');
  await lab.getByLabel('X for TT').fill('1');
  await expect(lab.getByRole('list')).toContainText('P(X=1) = 3/4');
});

test('@core supplemental inference validates input and identifies approximate method', async ({ page }) => {
  const lab = page.getByTestId('probability-model-builder');
  await lab.getByRole('tab', { name: /Inference/ }).click();
  await expect(lab.getByText(/95% Wilson score interval/)).toBeVisible();
  await expect(lab.getByText(/Sample proportion p̂/)).toContainText('2/5');
  await lab.getByLabel('Successes').fill('101');
  await expect(lab.getByRole('alert')).toContainText('Successes');
  await expect(lab.getByText(/95% Wilson score interval/)).not.toBeVisible();
});

test('probability panels fit a 375px viewport without horizontal page overflow', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  const lab = page.getByTestId('probability-model-builder');
  for (const name of ['Conditional Probability', 'Distributions', 'Random Variables', 'Inference']) {
    await lab.getByRole('tab', { name: new RegExp(name) }).click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
  }
});

test('probability panels have no serious automated accessibility violations', async ({ page }) => {
  await expect(page.getByTestId('probability-model-builder')).toHaveAttribute('data-hydrated', 'true');
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter((violation) => ['critical', 'serious'].includes(violation.impact ?? ''))).toEqual([]);
});
