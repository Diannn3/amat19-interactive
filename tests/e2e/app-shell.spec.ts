import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

async function waitForClientLoad(page: Page) {
  const islands = page.locator('astro-island[client="load"]');
  const count = await islands.count();
  if (count) await expect(page.locator('astro-island[client="load"][client-render-time]')).toHaveCount(count);
}

function neutralRgb(value: string) {
  const match = value.match(/rgba?\((\d+)[, ]+(\d+)[, ]+(\d+)/i);
  if (!match) return true;
  return match[1] === match[2] && match[2] === match[3];
}

test('@core instrument shell exposes four primary destinations and local progress', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'AMAT 19', level: 1 })).toBeVisible();
  const primary = page.getByRole('navigation', { name: 'Primary navigation' });
  for (const label of ['Home', 'Study', 'Course', 'Progress']) await expect(primary.getByRole('link', { name: label, exact: true })).toBeVisible();
  await page.goto('/progress');
  await expect(page.getByTestId('progress-dashboard')).toBeVisible();
});

test('@core home is an evidence workspace rather than a marketing hero', async ({ page }) => {
  await page.goto('/');
  await waitForClientLoad(page);
  const home = page.getByTestId('home-dashboard');
  await expect(home).toBeVisible();
  await expect(home.getByRole('heading', { name: 'Continue studying' })).toBeVisible();
  await expect(home.getByRole('heading', { name: 'Course overview' })).toBeVisible();
  await expect(home.getByRole('heading', { name: 'Review & repair' })).toBeVisible();
  await expect(page.locator('.home-hero, .home-bento, .module-spotlight-grid')).toHaveCount(0);
  await expect(home).not.toContainText(/around\s+\d+\s+min/i);
});

test('@core desktop rail is narrow and mobile uses the bottom dock', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/');
  const sidebar = page.locator('.sidebar');
  await expect(sidebar).toBeVisible();
  const width = await sidebar.evaluate((node) => node.getBoundingClientRect().width);
  expect(width).toBeGreaterThanOrEqual(72);
  expect(width).toBeLessThanOrEqual(96);
  await expect(page.locator('.sidebar-toggle, [data-more-flyout], [data-more-menu]')).toHaveCount(0);

  await page.setViewportSize({ width: 375, height: 667 });
  await page.reload();
  await expect(sidebar).toBeHidden();
  const mobile = page.getByRole('navigation', { name: 'Mobile navigation' });
  await expect(mobile).toBeVisible();
  await expect(mobile.locator('.mobile-nav-link')).toHaveCount(5);
});

test('@core shell touch targets keep a 44px safety floor', async ({ page }) => {
  const assertTargets = async (selector: string) => {
    const nodes = page.locator(selector);
    const count = await nodes.count();
    expect(count).toBeGreaterThan(0);
    for (let index = 0; index < count; index += 1) {
      const node = nodes.nth(index);
      if (!(await node.isVisible())) continue;
      const box = await node.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.width).toBeGreaterThanOrEqual(44);
      expect(box!.height).toBeGreaterThanOrEqual(44);
    }
  };

  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/');
  await assertTargets('.nav-link, .utility-nav-link, .utility-nav-action, .topbar-search');
  await page.setViewportSize({ width: 375, height: 667 });
  await page.reload();
  await assertTargets('.mobile-nav-link, .mobile-more-menu__link');
});

test('@core visible shell and home colors remain neutral at runtime', async ({ page }) => {
  await page.goto('/');
  await waitForClientLoad(page);
  const colors = await page.evaluate(() => {
    const selectors = ['body', '.sidebar', '.topbar', '.home-continue', '.home-review', '.home-next'];
    return selectors.flatMap((selector) => {
      const node = document.querySelector<HTMLElement>(selector);
      if (!node) return [];
      const style = getComputedStyle(node);
      return [style.color, style.backgroundColor, style.borderColor];
    });
  });
  for (const color of colors) expect(neutralRgb(color), color).toBe(true);
});

test('@core interface typography uses the native system stack while math remains technical', async ({ page }) => {
  await page.goto('/');
  await waitForClientLoad(page);
  const typography = await page.evaluate(() => ({
    body: getComputedStyle(document.body).fontFamily,
    title: getComputedStyle(document.querySelector('.instrument-home__title')!).fontFamily,
    math: getComputedStyle(document.querySelector('.home-continue__math pre')!).fontFamily,
  }));
  expect(typography.body).toMatch(/system-ui|-apple-system|Segoe UI/i);
  expect(typography.title).toMatch(/system-ui|-apple-system|Segoe UI/i);
  expect(typography.body).not.toMatch(/Plus Jakarta|Inter|Sora/i);
  expect(typography.math).toMatch(/JetBrains Mono|monospace/i);
});

test('@core reduced-motion preference removes decorative transitions from primary controls', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const duration = await page.locator('.topbar-search').evaluate((node) => getComputedStyle(node).transitionDuration);
  expect(Number.parseFloat(duration)).toBeLessThanOrEqual(0.001);
});

test('@core developer contact remains available from the quiet utility layer', async ({ page }) => {
  await page.goto('/');
  const trigger = page.locator('[data-developer-contact-trigger]:visible').first();
  await expect(trigger).toBeVisible();
  await trigger.click();
  const dialog = page.getByRole('dialog', { name: 'Developer contact' });
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: 'Close developer contact' }).click();
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
});

test('@core command palette preserves keyboard-first navigation', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.command-dialog[data-hydrated="true"]')).toBeAttached();
  await page.getByRole('button', { name: 'Search AMAT 19' }).first().click();
  const palette = page.getByRole('dialog', { name: /Search AMAT 19/i });
  const input = palette.getByRole('combobox', { name: /Search skills/i });
  await input.fill('conditional');
  const result = palette.getByRole('option', { name: /Conditional Probability Lab/i }).first();
  await expect(result).toBeVisible();
  await page.keyboard.press('ArrowDown');
  await expect(result).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/labs\/conditional-probability/);
});

test('@core key public surfaces remain within the viewport at 375px', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  for (const route of ['/', '/course', '/study', '/progress', '/settings', '/labs/truth-table', '/labs/row-reduction', '/labs/linear-programming']) {
    await page.goto(route);
    await waitForClientLoad(page);
    const contained = await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1);
    expect(contained, route).toBe(true);
  }
});

test('home, course, and settings pass an axe audit in the redesigned shell', async ({ page }) => {
  for (const route of ['/', '/course', '/settings']) {
    await page.goto(route);
    await waitForClientLoad(page);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations.filter((violation) => ['critical', 'serious'].includes(violation.impact ?? '')), route).toEqual([]);
  }
});
