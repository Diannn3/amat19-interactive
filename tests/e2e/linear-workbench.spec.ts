import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/workbenches/linear');
});

test('@core canonical matrix tabs change the mathematical surface without mockup controls', async ({ page }) => {
  const coach = page.getByTestId('row-operations-coach');
  await expect(coach).toHaveAttribute('data-hydrated', 'true');
  const tabs = coach.getByRole('tablist', { name: 'Matrix goals' });
  await expect(tabs.getByRole('tab')).toHaveCount(4);
  await expect(tabs.getByRole('tab', { name: 'Solve Systems' })).toHaveAttribute('aria-selected', 'true');
  await expect(coach.getByText('Eigenvalues')).toHaveCount(0);
  await expect(coach.getByText('3D Geometric View')).toHaveCount(0);
  await expect(coach.getByRole('button', { name: 'Determinant' })).toHaveCount(0);

  await tabs.getByRole('tab', { name: 'Matrix Operations' }).click();
  await expect(coach).toHaveAttribute('data-goal', 'arithmetic');
  await expect(coach.getByLabel('Candidate result matrix')).toBeVisible();
  await expect(page).toHaveURL(/goal=arithmetic/);

  await tabs.getByRole('tab', { name: 'Row Reduction' }).click();
  await expect(coach).toHaveAttribute('data-goal', 'rref');
  await expect(coach.getByLabel('Candidate target row')).toBeVisible();

  await tabs.getByRole('tab', { name: 'Inverse' }).click();
  await expect(coach).toHaveAttribute('data-goal', 'inverse');
  await expect(coach.getByLabel('Current augmented matrix')).toHaveAttribute('aria-label', /2, 4, 1, 0/);
});

test('@core URL goal wins over a saved draft and browser history restores the active tab', async ({ page }) => {
  const coach = page.getByTestId('row-operations-coach');
  await expect(coach).toHaveAttribute('data-hydrated', 'true');
  const tabs = coach.getByRole('tablist', { name: 'Matrix goals' });
  await tabs.getByRole('tab', { name: 'Inverse' }).click();
  await expect(page).toHaveURL(/goal=inverse/);
  await page.waitForTimeout(300);
  await page.goto('/workbenches/linear?goal=arithmetic');
  await expect(coach).toHaveAttribute('data-goal', 'arithmetic');
  await tabs.getByRole('tab', { name: 'Row Reduction' }).click();
  await expect(coach).toHaveAttribute('data-goal', 'rref');
  await page.goBack();
  await expect(coach).toHaveAttribute('data-goal', 'arithmetic');
  await expect(tabs.getByRole('tab', { name: 'Matrix Operations' })).toHaveAttribute('aria-selected', 'true');
  await page.goForward();
  await expect(coach).toHaveAttribute('data-goal', 'rref');
});

test('feedback stays with the goal that produced it', async ({ page }) => {
  const coach = page.getByTestId('row-operations-coach');
  await expect(coach).toHaveAttribute('data-hydrated', 'true');
  const tabs = coach.getByRole('tablist', { name: 'Matrix goals' });
  await tabs.getByRole('tab', { name: 'Matrix Operations' }).click();
  await coach.getByLabel('Candidate result matrix').fill('0');
  await coach.getByRole('button', { name: 'Check result' }).click();
  await expect(coach.getByRole('status')).toBeVisible();
  await tabs.getByRole('tab', { name: 'Solve Systems' }).click();
  await expect(coach.getByRole('status')).toHaveCount(0);
  await tabs.getByRole('tab', { name: 'Matrix Operations' }).click();
  await expect(coach.getByRole('status')).toHaveCount(0);
});

test('@core multiplication exposes an exact row-by-column trace with the revealed result', async ({ page }) => {
  const coach = page.getByTestId('row-operations-coach');
  await expect(coach).toHaveAttribute('data-hydrated', 'true');
  await coach.getByRole('tab', { name: 'Matrix Operations' }).click();
  await coach.getByLabel('Arithmetic operation').selectOption('multiply');
  await expect(coach.getByText('Row-by-column trace')).toHaveCount(0);
  await coach.getByRole('button', { name: 'Show exact result' }).click();
  await expect(coach.getByLabel('Exact result matrix')).toHaveAttribute('aria-label', /4, 5; 10, 11/);
  await expect(coach.getByText('Row-by-column trace')).toBeVisible();
  await expect(coach.getByText(/1 · 2 \+ 2 · 1 = 4/)).toBeVisible();
});

test('incompatible multiplication explains dimensions while keeping both editors reachable', async ({ page }) => {
  const coach = page.getByTestId('row-operations-coach');
  await expect(coach).toHaveAttribute('data-hydrated', 'true');
  await coach.getByRole('tab', { name: 'Matrix Operations' }).click();
  await coach.getByText('Edit matrices').click();
  await coach.getByLabel('Matrix B').last().fill('1 2 3');
  await coach.getByRole('button', { name: 'Use this model' }).click();
  await coach.getByLabel('Arithmetic operation').selectOption('multiply');
  await expect(coach.getByRole('alert')).toContainText('A columns (2) = B rows (1)');
  await expect(coach.getByText('Edit matrices')).toBeVisible();
  await expect(coach.getByLabel('Matrix B').last()).toBeVisible();
});

test('@core edited systems classify infinite and inconsistent solutions exactly after reveal', async ({ page }) => {
  const coach = page.getByTestId('row-operations-coach');
  await expect(coach).toHaveAttribute('data-hydrated', 'true');
  await coach.getByText('Edit the starting matrix').click();
  const rows = coach.getByLabel('Matrix rows');
  await rows.fill('1 1 2\n2 2 4');
  await coach.getByRole('button', { name: 'Use this matrix' }).click();
  await coach.getByText('Show target context').click();
  await expect(coach.getByText('infinite system', { exact: true })).toBeVisible();
  await rows.fill('1 1 2\n2 2 5');
  await coach.getByRole('button', { name: 'Use this matrix' }).click();
  await coach.getByText('Show target context').click();
  await expect(coach.getByText('inconsistent system', { exact: true })).toBeVisible();
});

test('@core Row Operations Coach starts with one matrix and one legal move', async ({ page }) => {
  const coach = page.getByTestId('row-operations-coach');
  await expect(coach).toHaveAttribute('data-hydrated', 'true');
  await expect(coach.getByRole('heading', { level: 2, name: 'Change one row. See what stays equivalent.' })).toBeVisible();
  await expect(coach.getByLabel('Current augmented matrix')).toBeVisible();
  await expect(coach.getByText('unique solution', { exact: true })).not.toBeVisible();
  await expect(coach.getByLabel('Candidate target row')).toBeVisible();
  await expect(coach.getByRole('button', { name: 'Check row', exact: true })).toBeVisible();

  const primaryControls = coach.locator('[data-primary-control]');
  expect(await primaryControls.count()).toBeLessThanOrEqual(8);
  for (let index = 0; index < await primaryControls.count(); index += 1) {
    const box = await primaryControls.nth(index).boundingBox();
    expect(box).not.toBeNull();
    expect(box!.height).toBeGreaterThanOrEqual(44);
  }
});

test('@core coach applies and undoes an exact elementary row operation', async ({ page }) => {
  const coach = page.getByTestId('row-operations-coach');
  await expect(coach).toHaveAttribute('data-hydrated', 'true');
  await coach.getByLabel('Candidate target row').fill('0 -2 -2');
  await coach.getByRole('button', { name: 'Check row', exact: true }).click();
  await expect(coach.getByRole('status')).toContainText('Correct');
  await coach.getByRole('button', { name: 'Apply operation' }).click();

  await expect(coach.getByRole('status')).toContainText('R2 ← R2 + (-1)R1');
  await expect(coach.getByLabel('Current augmented matrix')).toHaveAttribute('aria-label', /0, -2, -2/);
  const undo = coach.getByRole('button', { name: 'Undo' });
  await expect(undo).toBeVisible();
  await undo.click();
  await expect(coach.getByLabel('Current augmented matrix')).toHaveAttribute('aria-label', /1, -1, 1/);
});

test('@core inverse and RREF goals stay in the same coach', async ({ page }) => {
  const coach = page.getByTestId('row-operations-coach');
  await expect(coach).toHaveAttribute('data-hydrated', 'true');
  const goal = coach.getByRole('combobox', { name: 'Choose a task' });

  await goal.selectOption('inverse');
  await expect(coach.getByLabel('Current augmented matrix')).toHaveAttribute('aria-label', /2, 4, 1, 0/);
  await expect(coach.getByText('inverse exists', { exact: true })).not.toBeVisible();
  await coach.getByText('Show target context', { exact: true }).click();
  await expect(coach.getByText('inverse exists', { exact: true })).toBeVisible();

  await goal.selectOption('rref');
  await expect(coach.getByText(/rank 2/i)).not.toBeVisible();
  await coach.getByText('Show target context', { exact: true }).click();
  await expect(coach.getByText(/rank 2/i)).toBeVisible();
  await expect(coach.getByRole('button', { name: 'Apply operation' })).toBeVisible();
});

test('@core matrix arithmetic checks a complete result before revealing the exact matrix', async ({ page }) => {
  const coach = page.getByTestId('row-operations-coach');
  await expect(coach).toHaveAttribute('data-hydrated', 'true');
  await coach.getByRole('combobox', { name: 'Choose a task' }).selectOption('arithmetic');
  await expect(coach.getByRole('img', { name: /Matrix A:/ })).toBeVisible();
  await expect(coach.getByRole('img', { name: /Matrix B:/ })).toBeVisible();
  await expect(coach.getByLabel('Candidate result matrix')).toBeVisible();
  await expect(coach.getByText('Exact result', { exact: true })).not.toBeVisible();

  await coach.getByLabel('Candidate result matrix').fill('3 3\n5 6');
  await coach.getByRole('button', { name: 'Check result', exact: true }).click();
  await expect(coach.getByRole('status')).toContainText('Row 2, column 1');
  await coach.getByLabel('Candidate result matrix').fill('3 3\n4 6');
  await coach.getByRole('button', { name: 'Check result', exact: true }).click();
  await expect(coach.getByRole('status')).toContainText('Correct');
  await coach.getByRole('button', { name: 'Show exact result', exact: true }).click();
  await expect(coach.getByText('Exact result', { exact: true })).toBeVisible();
  await expect(coach.getByLabel('Exact result matrix')).toHaveAttribute('aria-label', /3, 3; 4, 6/);
});

test('Row Operations Coach keeps the matrix and row check reachable above the mobile dock', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.reload();
  const coach = page.getByTestId('row-operations-coach');
  await expect(coach).toHaveAttribute('data-hydrated', 'true');

  const matrix = coach.locator('[data-coach-matrix]');
  await matrix.scrollIntoViewIfNeeded();
  const matrixBox = await matrix.boundingBox();
  expect(matrixBox).not.toBeNull();
  expect(matrixBox!.x).toBeGreaterThanOrEqual(0);
  expect(matrixBox!.x + matrixBox!.width).toBeLessThanOrEqual(376);

  const check = coach.getByRole('button', { name: 'Check row', exact: true });
  await check.evaluate((element) => element.scrollIntoView({ block: 'center', inline: 'nearest' }));
  const checkBox = await check.boundingBox();
  const dockBox = await page.locator('.mobile-nav').boundingBox();
  expect(checkBox).not.toBeNull();
  expect(dockBox).not.toBeNull();
  expect(checkBox!.height).toBeGreaterThanOrEqual(44);
  expect(checkBox!.y + checkBox!.height).toBeLessThanOrEqual(dockBox!.y);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)).toBe(false);
});

test('Row Operations Coach is free of serious automated accessibility violations', async ({ page }) => {
  const results = await new AxeBuilder({ page }).include('[data-testid="row-operations-coach"]').analyze();
  expect(results.violations.filter((violation) => ['critical', 'serious'].includes(violation.impact ?? ''))).toEqual([]);
});
