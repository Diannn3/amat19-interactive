import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const workbenches = [
  '/workbenches/logic',
  '/workbenches/probability',
  '/workbenches/finance',
  '/workbenches/linear',

];

test('@core all focused workbenches render without document overflow', async ({ page }) => {
  for (const route of workbenches) {
    await page.goto(route);
    await expect(page.getByTestId('workbench-shell'), route).toBeVisible();
    const geometry = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      content: document.documentElement.scrollWidth,
    }));
    expect(geometry.content, route).toBeLessThanOrEqual(geometry.viewport + 1);
  }
});

test('@core focused workbenches have no automated accessibility violations', async ({ page }) => {
  test.setTimeout(120_000);
  for (const route of workbenches) {
    await page.goto(route);
    await expect(page.getByTestId('workbench-shell').locator('[data-hydrated="true"]').first(), route).toBeVisible();
    const results = await new AxeBuilder({ page }).include('[data-testid="workbench-shell"]').analyze();
    expect(results.violations, route).toEqual([]);
  }
});

test('@core dark focused workbenches have no serious automated accessibility violations', async ({ page }) => {
  test.setTimeout(120_000);
  await page.addInitScript(() => {
    localStorage.setItem('amat19-theme', 'dark');
  });

  for (const route of workbenches) {
    await page.goto(route);
    await expect(page.locator('html'), route).toHaveAttribute('data-theme', 'dark');
    await expect(page.getByTestId('workbench-shell').locator('[data-hydrated="true"]').first(), route).toBeVisible();
    const results = await new AxeBuilder({ page }).include('[data-testid="workbench-shell"]').analyze();
    const serious = results.violations.filter((violation) => ['critical', 'serious'].includes(violation.impact ?? ''));
    expect(serious, route).toEqual([]);
  }
});

test('@core course modules expose one focused workbench and retain their notes', async ({ page }) => {
  for (const module of ['logic', 'probability', 'finance', 'linear', 'applications']) {
    await page.goto(`/modules/${module}`);
    if (module === 'applications') {
      await expect(page.getByTestId('module-overview').getByRole('link', { name: 'Read the notes' })).toHaveAttribute('href', '/modules/applications?view=notes');
    } else {
      const workbenchLink = page.getByRole('link', { name: /Open (Logic Workbench|Probability Workbench|Money Timeline|Matrices & Systems)/ });
      await expect(workbenchLink).toHaveAttribute('href', `/workbenches/${module}`);
    }
    await expect(page.getByRole('link', { name: /Notes/ })).toHaveAttribute('href', `/modules/${module}?view=notes`);
  }
});
