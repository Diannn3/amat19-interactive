import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.describe('Blueprint Orange dark appearance', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('amat19-theme', 'dark');
    });
  });

  test('dark mode resolves to the Blueprint Orange semantic surfaces', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

    const palette = await page.evaluate(() => {
      const root = getComputedStyle(document.documentElement);
      const workspace = getComputedStyle(document.querySelector<HTMLElement>('.workspace-scroll')!);
      const hero = getComputedStyle(document.querySelector<HTMLElement>('[data-home-hero]')!);
      return {
        field: root.getPropertyValue('--editorial-field').trim(),
        paper: root.getPropertyValue('--editorial-paper').trim(),
        ink: root.getPropertyValue('--editorial-ink').trim(),
        signal: root.getPropertyValue('--editorial-signal').trim(),
        secondary: root.getPropertyValue('--editorial-secondary').trim(),
        workspaceBackground: workspace.backgroundColor,
        heroBackground: hero.backgroundColor,
      };
    });

    expect(palette.field).toBe('#0c2f48');
    expect(palette.paper).toBe('#0e171d');
    expect(palette.ink).toBe('#f8f3e8');
    expect(palette.signal).toBe('#f26430');
    expect(palette.secondary).toBe('#2e6c66');
    expect(palette.workspaceBackground).not.toBe('rgb(9, 9, 11)');
    expect(palette.heroBackground).not.toBe('rgb(9, 9, 11)');
  });

  test('representative dark redesign routes stay overflow-free and axe-clean', async ({ page }) => {
    test.setTimeout(90_000);
    await page.setViewportSize({ width: 375, height: 812 });

    for (const route of ['/', '/course', '/settings', '/workbenches/logic']) {
      await page.goto(route);
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

      const overflow = await page.evaluate(() => (
        document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
      ));
      expect(overflow, route).toBe(false);

      const results = await new AxeBuilder({ page }).analyze();
      expect(
        results.violations.filter((violation) => ['critical', 'serious'].includes(violation.impact ?? '')),
        route,
      ).toEqual([]);
    }
  });

  test('dark-mode controls remain exposed through desktop and mobile shell affordances', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');
    await expect(page.getByRole('button', { name: 'Turn dark mode off' })).toBeVisible();

    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();

    const more = page.locator('.mobile-more-menu');
    await more.locator('summary').click();
    const toggle = more.getByRole('button', { name: 'Turn dark mode off' });
    await expect(toggle).toBeVisible();
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    await expect(toggle.getByText('On', { exact: true })).toBeVisible();
  });
});
