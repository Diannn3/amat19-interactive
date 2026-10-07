import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/workbenches/finance');
});

test('@core Money Timeline starts with one focused cash-flow model', async ({ page }) => {
  const workbench = page.getByTestId('money-timeline-workbench');
  await expect(workbench).toHaveAttribute('data-hydrated', 'true');
  await expect(workbench.locator('.fin-hero, .fin-instrument-grid, .fin-chart-card')).toHaveCount(0);
  await expect(workbench.getByRole('heading', { level: 2, name: 'Move one cash flow.' })).toBeVisible();

  const scenario = workbench.getByRole('combobox', { name: 'Choose a task' });
  await expect(scenario).toHaveValue('cashflows');
  await expect(scenario.locator('option')).toHaveText(['Move cash flows', 'Value an annuity', 'Price a bond']);
  await expect(workbench.locator('[data-money-timeline-object] svg')).toBeVisible();
  await expect(workbench.locator('[data-money-timeline-object] [data-timeline-event]')).toHaveCount(3);
  await expect(workbench.getByText('Equivalent value', { exact: true })).not.toBeVisible();

  const primaryControls = workbench.locator('[data-primary-controls] input, [data-primary-controls] select, [data-primary-controls] button');
  expect(await primaryControls.count()).toBeLessThanOrEqual(8);
  for (let index = 0; index < await primaryControls.count(); index += 1) {
    const box = await primaryControls.nth(index).boundingBox();
    expect(box).not.toBeNull();
    expect(box!.height).toBeGreaterThanOrEqual(44);
  }
  const calculation = workbench.locator('.money-timeline__calculation');
  await expect(calculation).toHaveAttribute('hidden', '');
  await expect(calculation.locator('.step-trace__item').first()).not.toBeVisible();
});

test('@core annuity and bond presets reuse the timeline instead of opening separate tools', async ({ page }) => {
  const workbench = page.getByTestId('money-timeline-workbench');
  const scenario = workbench.getByRole('combobox', { name: 'Choose a task' });

  await scenario.selectOption('annuity');
  await workbench.getByText('Edit cash flows and rates', { exact: true }).click();
  await expect(workbench.getByLabel('Payment amount')).toBeVisible();
  await expect(workbench.getByLabel('Payment timing')).toBeVisible();
  await expect(workbench.getByText('Present value', { exact: true })).not.toBeVisible();
  await expect(workbench.locator('[data-money-timeline-object] svg')).toBeVisible();

  await scenario.selectOption('bond');
  await workbench.getByText('Edit cash flows and rates', { exact: true }).click();
  await expect(workbench.getByRole('textbox', { name: 'Face value' })).toBeVisible();
  await expect(workbench.getByLabel('Yield per coupon period')).toBeVisible();
  await workbench.getByRole('button', { name: 'Show full calculation', exact: true }).click();
  await expect(workbench.locator('.money-timeline__result').getByText('Bond price', { exact: true })).toBeVisible();
  await expect(workbench.getByText('premium', { exact: true })).toBeVisible();
});

test('calculation traces typeset annuity and bond notation without internal tokens', async ({ page }) => {
  const workbench = page.getByTestId('money-timeline-workbench');
  const scenario = workbench.getByRole('combobox', { name: 'Choose a task' });
  await scenario.selectOption('annuity');
  await workbench.getByRole('button', { name: 'Show full calculation', exact: true }).click();
  const annuityTrace = workbench.locator('.step-trace');
  await expect(annuityTrace.locator('math')).not.toHaveCount(0);
  await expect(annuityTrace).not.toContainText(/a-angle-n|s-angle-n|\^\(-n\)/);

  await scenario.selectOption('bond');
  await workbench.getByRole('button', { name: 'Show full calculation', exact: true }).click();
  const bondTrace = workbench.locator('.step-trace');
  await expect(bondTrace.locator('math')).not.toHaveCount(0);
  await expect(bondTrace).not.toContainText(/a_n\|j|\^\(-\d+\)/);
});

test('zero-rate annuity and bond traces use finite formulas', async ({ page }) => {
  const workbench = page.getByTestId('money-timeline-workbench');
  const scenario = workbench.getByRole('combobox', { name: 'Choose a task' });
  await scenario.selectOption('annuity');
  await workbench.getByText('Edit cash flows and rates', { exact: true }).click();
  await workbench.locator('input[name="annuity-rate"]').fill('0');
  await workbench.getByRole('button', { name: 'Show full calculation', exact: true }).click();
  await expect(workbench.locator('.step-trace math[aria-label="present annuity factor equals n"]')).toBeVisible();

  await scenario.selectOption('bond');
  await workbench.getByText('Edit cash flows and rates', { exact: true }).click();
  await workbench.locator('input[name="bond-yield"]').fill('0');
  await workbench.getByRole('button', { name: 'Show full calculation', exact: true }).click();
  const trace = workbench.locator('.step-trace');
  await expect(trace.locator('math[aria-label^="Coupon value equals n times face value F times coupon rate r"]')).toBeVisible();
  await expect(trace.locator('math[aria-label="Redemption value equals C at zero yield"]')).toBeVisible();
});

test('sampled finance timelines disclose full payment counts', async ({ page }) => {
  const workbench = page.getByTestId('money-timeline-workbench');
  const scenario = workbench.getByRole('combobox', { name: 'Choose a task' });
  await scenario.selectOption('annuity');
  await expect(workbench.locator('[data-money-timeline-object] [data-timeline-summary]'))
    .toContainText('Showing 5 sample points for 12 scheduled payments; all 12 are included in valuation.');
  await scenario.selectOption('bond');
  await expect(workbench.locator('[data-money-timeline-object] [data-timeline-summary]'))
    .toContainText('Showing 5 sample points for 10 scheduled coupon payments, plus redemption; all coupons and redemption are included in price.');
});

test('Money Timeline keeps its primary object and controls reachable on a 375px phone', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.reload();
  const workbench = page.getByTestId('money-timeline-workbench');
  await expect(workbench).toHaveAttribute('data-hydrated', 'true');

  const object = workbench.locator('[data-money-timeline-object]');
  await object.scrollIntoViewIfNeeded();
  const objectBox = await object.boundingBox();
  expect(objectBox).not.toBeNull();
  expect(objectBox!.x).toBeGreaterThanOrEqual(0);
  expect(objectBox!.x + objectBox!.width).toBeLessThanOrEqual(376);

  for (const control of [
    workbench.getByRole('combobox', { name: 'Choose a task' }),
    workbench.getByRole('button', { name: 'Check step', exact: true }),
  ]) {
    await control.evaluate((element) => element.scrollIntoView({ block: 'center', inline: 'nearest' }));
    const box = await control.boundingBox();
    const dock = await page.locator('.mobile-nav').boundingBox();
    expect(box).not.toBeNull();
    expect(dock).not.toBeNull();
    expect(box!.height).toBeGreaterThanOrEqual(44);
    expect(box!.y + box!.height).toBeLessThanOrEqual(dock!.y);
  }

  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)).toBe(false);
});

test('Money Timeline is free of serious automated accessibility violations', async ({ page }) => {
  const results = await new AxeBuilder({ page }).include('[data-testid="money-timeline-workbench"]').analyze();
  expect(results.violations.filter((violation) => ['critical', 'serious'].includes(violation.impact ?? ''))).toEqual([]);
});
