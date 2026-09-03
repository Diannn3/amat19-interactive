import { expect, test } from '@playwright/test';

const workbenches = [
  { href: '/workbenches/logic', title: 'Logic & Proof' },
  { href: '/workbenches/probability', title: 'Probability Model Builder' },
  { href: '/workbenches/finance', title: 'Money Timeline' },
  { href: '/workbenches/linear', title: 'Row Operations Coach' },
  { href: '/workbenches/applications', title: 'Optimization & Strategy' },
];

test('course map presents five workbenches instead of a lab catalog', async ({ page }) => {
  await page.goto('/course');

  const directory = page.getByTestId('workbench-directory');
  await expect(directory.getByRole('link')).toHaveCount(5);
  for (const workbench of workbenches) {
    await expect(directory.getByRole('link', { name: new RegExp(workbench.title) })).toHaveAttribute('href', workbench.href);
  }
  await expect(directory.locator('a[href^="/labs/"]')).toHaveCount(0);
});

test('desktop course map keeps all five workbenches in the first viewport', async ({ page }) => {
  test.skip(page.viewportSize()!.width < 1000, 'desktop density contract');
  await page.goto('/course');
  const links = page.getByTestId('workbench-directory').getByRole('link');
  const viewportHeight = page.viewportSize()!.height;

  for (let index = 0; index < 5; index += 1) {
    const box = await links.nth(index).boundingBox();
    expect(box, `workbench ${index + 1} should have layout`).not.toBeNull();
    expect(box!.y + box!.height, `workbench ${index + 1} should be visible without scrolling`).toBeLessThanOrEqual(viewportHeight);
  }
});

test('module pages lead with one canonical workbench', async ({ page }) => {
  await page.goto('/modules/finance');

  await expect(page.getByRole('link', { name: 'Open Money Timeline' })).toHaveAttribute('href', '/workbenches/finance');
  await expect(page.getByRole('link', { name: /Labs/ })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Interactive labs.' })).toHaveCount(0);
});

test('every canonical workbench route uses the tool-first shell', async ({ page }) => {
  for (const workbench of workbenches) {
    await page.goto(workbench.href);
    const shell = page.getByTestId('workbench-shell');
    await expect(shell, workbench.href).toBeVisible();
    await expect(shell.getByRole('heading', { level: 1, name: workbench.title }), workbench.href).toBeVisible();
    await expect(shell.locator('[data-workbench-canvas]'), workbench.href).toBeVisible();
    await expect(shell.locator('.lab-route__context-rail'), workbench.href).toHaveCount(0);
    await expect(shell.locator('.lab-route__support'), workbench.href).toHaveCount(0);
  }
});

test('search resolves absorbed lab names to their canonical workbench', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.command-dialog[data-hydrated="true"]')).toBeAttached();
  await page.keyboard.press('Control+k');
  const search = page.getByRole('combobox', { name: /Search skills, workbenches, or pages/i });
  await search.fill('annuity');

  await expect(page.getByRole('option', { name: /Money Timeline/ })).toHaveAttribute('href', '/workbenches/finance');
  await expect(page.getByRole('option', { name: /Annuity Timeline Lab/ })).toHaveCount(0);
});
