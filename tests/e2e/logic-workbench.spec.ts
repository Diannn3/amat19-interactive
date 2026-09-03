import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/workbenches/logic');
});

test('@core Logic & Proof opens on a complete exact truth table', async ({ page }) => {
  const workbench = page.getByTestId('logic-proof-workbench');
  await expect(workbench).toHaveAttribute('data-hydrated', 'true');
  await expect(workbench.getByRole('heading', { name: 'See every truth value.' })).toBeVisible();
  await expect(workbench.getByLabel('Logic expression')).toHaveValue('P -> Q');
  await expect(workbench.getByRole('status')).toContainText('contingent');
  await expect(workbench.getByRole('table', { name: 'Truth table for P → Q' }).locator('tbody tr')).toHaveCount(4);

  const visiblePrimaryControls = workbench.locator('[data-primary-control]:visible');
  expect(await visiblePrimaryControls.count()).toBeLessThanOrEqual(8);
  for (const control of await visiblePrimaryControls.all()) {
    const box = await control.boundingBox();
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
  }
});

test('@core Compare exposes a counterexample instead of only a verdict', async ({ page }) => {
  const workbench = page.getByTestId('logic-proof-workbench');
  await workbench.getByRole('button', { name: 'Compare' }).click();
  await expect(workbench.getByText('Equivalent everywhere.')).toBeVisible();

  await workbench.getByLabel('Expression B').fill('Q -> P');
  await expect(workbench.getByText('Not equivalent.')).toBeVisible();
  await expect(workbench.getByText(/P=T/)).toBeVisible();
  await expect(workbench.getByText(/Q=F/)).toBeVisible();
});

test('@core Argument validity names a falsifying assignment', async ({ page }) => {
  const workbench = page.getByTestId('logic-proof-workbench');
  await workbench.getByRole('button', { name: 'Argument' }).click();
  await workbench.getByRole('button', { name: 'Check validity' }).click();

  await expect(workbench.getByText('Invalid argument.')).toBeVisible();
  await expect(workbench.getByText(/P=F/)).toBeVisible();
  await expect(workbench.getByText(/Q=T/)).toBeVisible();
});

test('Guided proof stays inside the same workbench', async ({ page }) => {
  const workbench = page.getByTestId('logic-proof-workbench');
  await workbench.getByRole('button', { name: 'Guided proof' }).click();
  await expect(workbench.getByTestId('formal-proof-lab')).toHaveAttribute('data-hydrated', 'true');
  await expect(workbench.getByRole('heading', { name: 'Derive the goal one justified line at a time.' })).toBeVisible();
});

test('Logic & Proof keeps the expression and truth table above the mobile dock', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.reload();
  await page.locator('.workspace-scroll').evaluate((element) => { element.scrollTop = 0; });
  const metrics = await page.getByTestId('logic-proof-workbench').evaluate((element) => {
    const input = element.querySelector<HTMLElement>('[aria-label="Logic expression"]');
    const table = element.querySelector<HTMLElement>('table');
    const dock = document.querySelector<HTMLElement>('.mobile-nav');
    const inputBox = input?.getBoundingClientRect();
    const tableBox = table?.getBoundingClientRect();
    const dockBox = dock?.getBoundingClientRect();
    return {
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      inputBottom: inputBox?.bottom ?? Infinity,
      tableTop: tableBox?.top ?? Infinity,
      dockTop: dockBox?.top ?? 667,
    };
  });

  expect(metrics.overflow).toBe(false);
  expect(metrics.inputBottom).toBeLessThan(metrics.dockTop);
  expect(metrics.tableTop).toBeLessThan(metrics.dockTop);
});

test('Logic & Proof is free of serious automated accessibility violations', async ({ page }) => {
  await expect(page.getByTestId('logic-proof-workbench')).toHaveAttribute('data-hydrated', 'true', { timeout: 10_000 });
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter((violation) => ['critical', 'serious'].includes(violation.impact ?? ''))).toEqual([]);
});
