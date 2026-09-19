import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/workbenches/finance');
  await expect(page.getByTestId('money-timeline-workbench')).toHaveAttribute('data-hydrated', 'true');
});

test('Money Timeline checks a learner step before revealing the full answer', async ({ page }) => {
  const coach = page.getByTestId('money-step-coach');
  await expect(coach).toBeVisible();
  await expect(page.locator('.money-timeline__result')).not.toBeVisible();
  await expect(page.locator('.step-trace')).not.toBeVisible();
  await coach.getByLabel('Exponent').fill('3');
  await coach.getByLabel('Value at focal date').fill('2894.06');
  await coach.getByRole('button', { name: 'Check step', exact: true }).click();
  await expect(coach.getByLabel('Exponent')).toHaveAttribute('aria-invalid', 'true');
  await expect(coach.getByLabel('Exponent')).toBeFocused();
  await expect(coach.getByRole('status')).toContainText('focal date minus');
  await coach.getByLabel('Exponent').fill('-3');
  await coach.getByLabel('Value at focal date').fill('2159.59');
  await coach.getByRole('button', { name: 'Check step', exact: true }).click();
  await expect(coach.getByRole('status')).toContainText('Correct');
  await expect(page.locator('.money-timeline__result')).not.toBeVisible();
  await page.getByRole('button', { name: 'Show full calculation', exact: true }).click();
  await expect(page.locator('.money-timeline__result')).toContainText('159.59');
  await expect(page.locator('.step-trace')).not.toContainText('Exact value:');
});

test('changing the model clears stale answers and each preset gets a cash-flow step', async ({ page }) => {
  await page.getByRole('button', { name: 'Show full calculation', exact: true }).click();
  await page.getByText('Edit cash flows and rates', { exact: true }).click();
  await page.getByLabel('Focal date', { exact: true }).fill('1');
  await expect(page.locator('.money-timeline__result')).not.toBeVisible();
  await expect(page.getByTestId('money-step-coach').getByLabel('Exponent')).toHaveValue('');
  await page.getByRole('combobox', { name: 'Scenario', exact: true }).selectOption('annuity');
  await expect(page.getByTestId('money-step-coach')).toContainText('Payment');
  await page.getByRole('combobox', { name: 'Scenario', exact: true }).selectOption('bond');
  await expect(page.getByTestId('money-step-coach')).toContainText('Redemption');
  await expect(page.locator('.money-timeline__result')).not.toBeVisible();
});

test('the phone keeps a complete first check action reachable above the dock', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.reload();
  await expect(page.getByTestId('money-timeline-workbench')).toHaveAttribute('data-hydrated', 'true');
  const button = page.getByRole('button', { name: 'Check step', exact: true });
  await button.scrollIntoViewIfNeeded();
  const box = await button.boundingBox();
  const dock = await page.locator('.mobile-nav').boundingBox();
  expect(box).not.toBeNull();
  expect(dock).not.toBeNull();
  expect(box!.height).toBeGreaterThanOrEqual(44);
  expect(box!.y + box!.height).toBeLessThanOrEqual(dock!.y);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)).toBe(false);
  const results = await new AxeBuilder({ page }).include('[data-testid="money-timeline-workbench"]').analyze();
  expect(results.violations).toEqual([]);
  await page.screenshot({ path: testInfo.outputPath('money-step-phone.png') });
});
