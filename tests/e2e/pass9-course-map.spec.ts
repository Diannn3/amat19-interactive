import { expect, test } from '@playwright/test';

const homeModules = [
  { title: 'Logic', href: '/modules/logic', notation: 'P → Q' },
  { title: 'Probability', href: '/modules/probability', notation: 'P(A | B)' },
  { title: 'Financial Mathematics', href: '/modules/finance', notation: 'F = P(1 + i)ⁿ' },
  { title: 'Matrices & Systems', href: '/modules/linear', notation: 'Ax = b' },
  { title: 'Applications', href: '/modules/applications', notation: 'max min' },
];

test.describe('Pass 9 collapsed More and Compact Course Map', () => {
  test('homepage uses one full-width course rail instead of duplicate hero surfaces', async ({ page }) => {
    await page.goto('/');

    const hero = page.locator('[data-home-hero]');
    const rail = hero.locator('[data-home-course-rail]');
    await expect(rail).toBeVisible();
    await expect(rail.locator('[data-home-module]')).toHaveCount(homeModules.length);
    await expect(hero.locator('[data-brand-mark]')).toHaveCount(0);
    await expect(page.locator('.home-facts, .home-modules, .module-spotlight-grid, .module-spotlight-link')).toHaveCount(0);
    await expect(page.locator('.home-shortcuts a[href="/study"] strong')).toHaveText('Study queue');

    for (const [index, module] of homeModules.entries()) {
      const entry = rail.locator('[data-home-module]').nth(index);
      await expect(entry).toHaveAttribute('href', module.href);
      await expect(entry).toContainText(module.title);
      await expect(entry.locator('[data-home-notation]')).toHaveText(module.notation);
      await expect(entry).toHaveAttribute('aria-label', new RegExp(`Open ${module.title}`, 'i'));
    }
  });

  test('course rail and gradient headline respond without horizontal overflow', async ({ page }) => {
    for (const viewport of [
      { width: 1280, height: 720, columns: 5 },
      { width: 768, height: 1024, columns: 3 },
      { width: 375, height: 667, columns: 1 },
    ]) {
      await page.setViewportSize(viewport);
      await page.goto('/');

      const metrics = await page.evaluate(() => {
        const heading = document.querySelector<HTMLElement>('.home-hero__title');
        const rail = document.querySelector<HTMLElement>('[data-home-course-rail]');
        const primary = document.querySelector<HTMLElement>('[data-home-primary-action]');
        const railStyle = rail ? getComputedStyle(rail.querySelector('ol') ?? rail) : null;
        const rect = (element: HTMLElement | null) => {
          if (!element) return null;
          const box = element.getBoundingClientRect();
          return { top: box.top, bottom: box.bottom, height: box.height };
        };
        return {
          columns: railStyle?.gridTemplateColumns ?? '',
          heading: rect(heading),
          primary: rect(primary),
          backgroundImage: heading ? getComputedStyle(heading).backgroundImage : '',
          overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
        };
      });

      expect(metrics.columns.split(' ').filter(Boolean).length, `${viewport.width}px rail columns`).toBe(viewport.columns);
      expect(metrics.backgroundImage, `${viewport.width}px H1 should use the ember gradient`).toContain('linear-gradient');
      expect(metrics.overflow, `${viewport.width}x${viewport.height} should not overflow horizontally`).toBe(false);
      expect(metrics.heading?.bottom, `${viewport.width}px heading should render`).toBeLessThanOrEqual(viewport.height);
      expect(metrics.primary?.bottom, `${viewport.width}px CTA should render`).toBeLessThanOrEqual(viewport.height);
    }
  });

  test('gradient headline falls back to solid text in forced colors', async ({ page }) => {
    await page.goto('/');
    await expect.poll(() => page.locator('.home-hero__title').evaluate((heading) => getComputedStyle(heading).backgroundImage)).toContain('linear-gradient');

    await page.emulateMedia({ forcedColors: 'active' });
    await page.reload();
    const forcedColors = await page.evaluate(() => {
      const heading = document.querySelector<HTMLElement>('.home-hero__title');
      if (!heading) return null;
      const styles = getComputedStyle(heading);
      return {
        forced: matchMedia('(forced-colors: active)').matches,
        backgroundImage: styles.backgroundImage,
        color: styles.color,
        textFill: styles.webkitTextFillColor,
      };
    });

    expect(forcedColors?.forced).toBe(true);
    expect(forcedColors?.backgroundImage).not.toContain('linear-gradient');
    expect(forcedColors?.color).not.toBe('rgba(0, 0, 0, 0)');
    expect(forcedColors?.textFill).not.toBe('rgba(0, 0, 0, 0)');
  });

  test('collapsed More opens a viewport-contained top-layer flyout at short heights', async ({ page }) => {
    for (const viewport of [
      { width: 1280, height: 720 },
      { width: 1280, height: 480 },
    ]) {
      await page.setViewportSize(viewport);
      await page.goto('/');
      await page.evaluate(() => localStorage.removeItem('amat19.sidebar.collapsed'));
      await page.reload();
      await page.getByRole('button', { name: /Collapse navigation/i }).click();

      const trigger = page.locator('[data-more-flyout-trigger]');
      const flyout = page.locator('[data-more-flyout]');
      await expect(trigger).toBeVisible();
      await trigger.click();
      await expect(flyout).toBeVisible();

      const geometry = await page.evaluate(() => {
        const panel = document.querySelector<HTMLElement>('[data-more-flyout]');
        const trigger = document.querySelector<HTMLElement>('[data-more-flyout-trigger]');
        const sidebar = document.querySelector<HTMLElement>('.sidebar');
        const nav = document.querySelector<HTMLElement>('#primary-navigation');
        if (!panel || !trigger || !sidebar || !nav) return null;
        const box = (element: HTMLElement) => {
          const rect = element.getBoundingClientRect();
          return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom, width: rect.width, height: rect.height };
        };
        const panelBox = box(panel);
        const triggerBox = box(trigger);
        const sidebarBox = box(sidebar);
        const navOverlap = Array.from(nav.querySelectorAll<HTMLElement>('a, summary, button')).some((item) => {
          const itemBox = box(item);
          return itemBox.left < panelBox.right && itemBox.right > panelBox.left && itemBox.top < panelBox.bottom && itemBox.bottom > panelBox.top;
        });
        return {
          panel: panelBox,
          trigger: triggerBox,
          sidebar: sidebarBox,
          outsideSidebar: !panel.closest('.sidebar'),
          navOverlap,
          documentOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
          ariaExpanded: trigger.getAttribute('aria-expanded'),
        };
      });
      expect(geometry).not.toBeNull();
      expect(geometry?.outsideSidebar).toBe(true);
      expect(geometry?.panel.left).toBeGreaterThanOrEqual(0);
      expect(geometry?.panel.right).toBeLessThanOrEqual(viewport.width);
      expect(geometry?.panel.top).toBeGreaterThanOrEqual(0);
      expect(geometry?.panel.bottom).toBeLessThanOrEqual(viewport.height);
      expect(geometry?.panel.left).toBeGreaterThanOrEqual(geometry?.sidebar.right ?? 0);
      expect(geometry?.navOverlap).toBe(false);
      expect(geometry?.documentOverflow).toBe(false);
      expect(geometry?.ariaExpanded).toBe('true');
      await expect(flyout.locator('a[href="/reference"]')).toBeVisible();
      await expect(flyout.locator('[data-developer-contact-trigger]')).toBeVisible();

      await page.keyboard.press('Escape');
      await expect(flyout).toBeHidden();
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
      await expect(trigger).toBeFocused();

      await trigger.click();
      await expect(flyout).toBeVisible();
      await page.mouse.click(viewport.width - 20, 24);
      await expect(flyout).toBeHidden();
      await expect(trigger).toBeFocused();
    }
  });

  test('Developer from collapsed More hands focus back after the dialog closes', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');
    await page.getByRole('button', { name: /Collapse navigation/i }).click();

    const trigger = page.locator('[data-more-flyout-trigger]');
    const flyout = page.locator('[data-more-flyout]');
    await trigger.click();
    await flyout.getByRole('button', { name: 'Developer contact', exact: true }).click();
    await expect(flyout).toBeHidden();
    const dialog = page.getByRole('dialog', { name: 'Developer contact' });
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Close developer contact' }).click();
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test('expanded and mobile More retain their existing navigation surfaces', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');
    await expect(page.locator('[data-more-flyout-trigger]')).toBeHidden();
    const desktopMore = page.locator('.sidebar [data-more-menu]');
    await desktopMore.locator('summary').click();
    await expect(desktopMore.getByRole('link', { name: 'Reference', exact: true })).toBeVisible();

    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await expect(page.locator('[data-more-flyout-trigger]')).toBeHidden();
    await expect(page.locator('.mobile-nav .mobile-nav-link')).toHaveCount(4);
    const mobileMore = page.locator('.mobile-more-menu');
    await mobileMore.locator('summary').click();
    await expect(mobileMore.locator('.mobile-more-menu__panel')).toBeVisible();
    await expect(mobileMore.getByRole('button', { name: 'Developer contact', exact: true })).toBeVisible();
  });
});
