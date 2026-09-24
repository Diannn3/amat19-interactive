import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/workbenches/logic');
  await expect(page.getByTestId('logic-proof-workbench')).toHaveAttribute('data-hydrated', 'true');
});

test('@core Logic offers exactly two working learner tabs', async ({ page }) => {
  const workbench = page.getByTestId('logic-proof-workbench');
  const tabs = workbench.getByRole('tab');
  await expect(tabs).toHaveCount(2);
  await expect(tabs.nth(0)).toHaveText('Truth Table');
  await expect(tabs.nth(1)).toHaveText('Test an Argument');
  await expect(tabs.nth(0)).toHaveAttribute('aria-selected', 'true');
  await expect(workbench.getByRole('combobox', { name: 'Choose a task' })).toHaveCount(0);
  await tabs.nth(1).click();
  await expect(workbench.getByRole('button', { name: 'Test validity' })).toBeVisible();
  await expect(workbench.getByRole('table', { name: /Truth table for/ })).toHaveCount(0);
  await expect(workbench.getByTestId('formal-proof-lab')).toHaveCount(0);
});

test('@core Truth Table keeps aliases in the input and displays exact canonical notation', async ({ page }) => {
  const workbench = page.getByTestId('logic-proof-workbench');
  const expression = workbench.getByLabel('Logic expression');
  await expect(expression).toHaveValue('P -> Q');
  await expect(workbench.getByRole('table', { name: 'Truth table for P → Q' }).locator('tbody tr')).toHaveCount(4);
  await expression.fill('P <-> ~P');
  await expect(expression).toHaveValue('P <-> ~P');
  await expect(workbench.getByRole('status')).toContainText('contradiction');
  await expect(workbench.getByRole('table', { name: 'Truth table for P ↔ ∼P' }).locator('tbody tr')).toHaveCount(2);
  await expression.fill('P ->');
  await expect(workbench.getByRole('alert')).toBeVisible();
  await expect(workbench.getByRole('table')).toHaveCount(0);
});

test('@core Argument tester shows a falsifying assignment and clears stale feedback', async ({ page }) => {
  const workbench = page.getByTestId('logic-proof-workbench');
  await workbench.getByRole('tab', { name: 'Test an Argument' }).click();
  await workbench.getByRole('button', { name: 'Test validity' }).click();
  await expect(workbench.getByText('Invalid argument.')).toBeVisible();
  await expect(workbench.getByText(/P=F/)).toBeVisible();
  await expect(workbench.getByText(/Q=T/)).toBeVisible();
  await expect(workbench.getByText('P → Q; Q ∴ P')).toBeVisible();
  await workbench.getByLabel('Premises · one per line').fill('P -> Q\nP');
  await expect(workbench.getByText('Invalid argument.')).toHaveCount(0);
  await workbench.getByRole('button', { name: 'Test validity' }).click();
  await expect(workbench.getByText('Valid argument.')).toBeVisible();
  await workbench.getByRole('tab', { name: 'Truth Table' }).click();
  await workbench.getByRole('tab', { name: 'Test an Argument' }).click();
  await expect(workbench.getByText('Valid argument.')).toHaveCount(0);
  await expect(workbench.getByLabel('Premises · one per line')).toHaveValue('P -> Q\nP');
});

test('query mode wins over saved mode and Back/Forward restores the selected panel', async ({ page }) => {
  const workbench = page.getByTestId('logic-proof-workbench');
  await expect(page).toHaveURL(/\/workbenches\/logic\?mode=table$/);
  await workbench.getByRole('tab', { name: 'Test an Argument' }).click();
  await expect(page).toHaveURL(/\/workbenches\/logic\?mode=argument$/);
  await page.goBack();
  await expect(workbench.getByRole('tab', { name: 'Truth Table' })).toHaveAttribute('aria-selected', 'true');
  await page.goForward();
  await expect(workbench.getByRole('tab', { name: 'Test an Argument' })).toHaveAttribute('aria-selected', 'true');
  await page.waitForTimeout(350);

  const reopened = await page.context().newPage();
  await reopened.goto('/workbenches/logic');
  await expect(reopened.getByTestId('logic-proof-workbench')).toHaveAttribute('data-hydrated', 'true');
  await expect(reopened.getByRole('tab', { name: 'Test an Argument' })).toHaveAttribute('aria-selected', 'true');
  await reopened.goto('/workbenches/logic?mode=table');
  await expect(reopened.getByRole('tab', { name: 'Truth Table' })).toHaveAttribute('aria-selected', 'true');
  await reopened.close();
});

test('tabs preserve both inputs and accept keyboard selection', async ({ page }) => {
  const workbench = page.getByTestId('logic-proof-workbench');
  await workbench.getByLabel('Logic expression').fill('P <-> ~P');
  const tableTab = workbench.getByRole('tab', { name: 'Truth Table' });
  await tableTab.focus();
  await page.keyboard.press('ArrowRight');
  await expect(workbench.getByRole('tab', { name: 'Test an Argument' })).toHaveAttribute('aria-selected', 'true');
  await workbench.getByLabel('Conclusion').fill('Q');
  await workbench.getByRole('tab', { name: 'Test an Argument' }).focus();
  await page.keyboard.press('ArrowLeft');
  await expect(tableTab).toHaveAttribute('aria-selected', 'true');
  await expect(workbench.getByLabel('Logic expression')).toHaveValue('P <-> ~P');
  await tableTab.press('ArrowRight');
  await expect(workbench.getByLabel('Conclusion')).toHaveValue('Q');
});

test('retired query modes resolve to a canonical learner tab', async ({ page }) => {
  await page.goto('/workbenches/logic?mode=proof');
  await expect(page.getByTestId('logic-proof-workbench')).toHaveAttribute('data-hydrated', 'true');
  await expect(page).toHaveURL(/\/workbenches\/logic\?mode=table$/);
  await expect(page.getByRole('tab', { name: 'Truth Table' })).toHaveAttribute('aria-selected', 'true');
});

test('Truth Table remains usable at 375 × 667', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.reload();
  const workbench = page.getByTestId('logic-proof-workbench');
  await expect(workbench.getByRole('tab')).toHaveCount(2);
  await expect(workbench.getByLabel('Logic expression')).toBeVisible();
  await expect(workbench.getByRole('table', { name: 'Truth table for P → Q' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)).toBe(false);
  for (const tab of await workbench.getByRole('tab').all()) {
    expect(Math.round((await tab.boundingBox())?.height ?? 0)).toBeGreaterThanOrEqual(44);
  }
});

test('Logic workbench has no serious automated accessibility violations', async ({ page }) => {
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter((violation) => ['critical', 'serious'].includes(violation.impact ?? ''))).toEqual([]);
});
