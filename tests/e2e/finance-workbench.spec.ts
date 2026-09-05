import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/workbenches/finance');
});

test('@core Money Timeline starts with one focused cash-flow model', async ({ page }) => {
  const workbench = page.getByTestId('money-timeline-workbench');
  await expect(workbench).toHaveAttribute('data-hydrated', 'true');
  await expect(workbench.getByRole('heading', { level: 2, name: 'Move one cash flow.' })).toBeVisible();

  const scenario = workbench.getByRole('combobox', { name: 'Choose a task' });
  await expect(scenario).toHaveValue('cashflows');
  await expect(scenario.locator('option')).toHaveText(['Move cash flows', 'Value an annuity', 'Price a bond']);
  await expect(workbench.locator('[data-money-timeline-object] svg')).toBeVisible();
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
  await expect(workbench.getByLabel('Face value')).toBeVisible();
  await expect(workbench.getByLabel('Yield per coupon period')).toBeVisible();
  await workbench.getByRole('button', { name: 'Show full calculation', exact: true }).click();
  await expect(workbench.locator('.money-timeline__result').getByText('Bond price', { exact: true })).toBeVisible();
  await expect(workbench.getByText('premium', { exact: true })).toBeVisible();
});

test('Money Timeline keeps its primary object and controls reachable on a 375px phone', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.reload();
  const updateDismiss = page.getByRole('button', { name: 'Later', exact: true });
  if (await updateDismiss.isVisible()) await updateDismiss.click();
  await page.locator('.workspace-scroll').evaluate((element) => { element.scrollTop = 0; });
  const workbench = page.getByTestId('money-timeline-workbench');
  const metrics = await workbench.evaluate((element) => {
    const object = element.querySelector<HTMLElement>('[data-money-timeline-object]');
    const scenario = element.querySelector<HTMLElement>('[data-scenario-control]');
    const result = element.querySelector<HTMLElement>('button[type="submit"]');
    const dock = document.querySelector<HTMLElement>('.mobile-nav');
    const objectBox = object?.getBoundingClientRect();
    const scenarioBox = scenario?.getBoundingClientRect();
    const resultBox = result?.getBoundingClientRect();
    const dockBox = dock?.getBoundingClientRect();
    return {
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      objectTop: objectBox?.top ?? Infinity,
      objectRight: objectBox?.right ?? Infinity,
      scenarioTop: scenarioBox?.top ?? Infinity,
      resultBottom: resultBox?.bottom ?? Infinity,
      dockTop: dockBox?.top ?? 667,
      viewportWidth: document.documentElement.clientWidth,
    };
  });

  expect(metrics.overflow).toBe(false);
  expect(metrics.objectTop).toBeLessThan(667);
  expect(metrics.scenarioTop).toBeLessThan(667);
  expect(metrics.objectRight).toBeLessThanOrEqual(metrics.viewportWidth + 1);
  expect(metrics.resultBottom).toBeLessThanOrEqual(metrics.dockTop);
});

test('Money Timeline is free of serious automated accessibility violations', async ({ page }) => {
  const results = await new AxeBuilder({ page }).include('[data-testid="money-timeline-workbench"]').analyze();
  expect(results.violations.filter((violation) => ['critical', 'serious'].includes(violation.impact ?? ''))).toEqual([]);
});
