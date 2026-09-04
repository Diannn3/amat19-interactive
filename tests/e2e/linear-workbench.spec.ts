import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/workbenches/linear');
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
  const goal = coach.getByLabel('Goal');

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
  await coach.getByLabel('Goal').selectOption('arithmetic');
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

test('Row Operations Coach keeps the matrix and row check above the mobile dock', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.reload();
  const updateDismiss = page.getByRole('button', { name: 'Later', exact: true });
  if (await updateDismiss.isVisible()) await updateDismiss.click();
  await page.locator('.workspace-scroll').evaluate((element) => { element.scrollTop = 0; });
  const coach = page.getByTestId('row-operations-coach');
  await expect(coach).toHaveAttribute('data-hydrated', 'true');

  const metrics = await coach.evaluate((element) => {
    const matrix = element.querySelector<HTMLElement>('[data-coach-matrix]');
    const check = Array.from(element.querySelectorAll<HTMLElement>('button')).find((button) => button.textContent?.trim() === 'Check row');
    const dock = document.querySelector<HTMLElement>('.mobile-nav');
    const matrixBox = matrix?.getBoundingClientRect();
    const checkBox = check?.getBoundingClientRect();
    const dockBox = dock?.getBoundingClientRect();
    return {
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      matrixTop: matrixBox?.top ?? Infinity,
      matrixRight: matrixBox?.right ?? Infinity,
      checkTop: checkBox?.top ?? Infinity,
      checkBottom: checkBox?.bottom ?? Infinity,
      dockTop: dockBox?.top ?? 667,
      viewportWidth: document.documentElement.clientWidth,
    };
  });

  expect(metrics.overflow).toBe(false);
  expect(metrics.matrixTop).toBeLessThan(metrics.dockTop);
  expect(metrics.checkTop).toBeLessThan(metrics.dockTop);
  expect(metrics.checkBottom).toBeLessThanOrEqual(metrics.dockTop);
  expect(metrics.matrixRight).toBeLessThanOrEqual(metrics.viewportWidth + 1);
});

test('Row Operations Coach is free of serious automated accessibility violations', async ({ page }) => {
  const results = await new AxeBuilder({ page }).include('[data-testid="row-operations-coach"]').analyze();
  expect(results.violations.filter((violation) => ['critical', 'serious'].includes(violation.impact ?? ''))).toEqual([]);
});
