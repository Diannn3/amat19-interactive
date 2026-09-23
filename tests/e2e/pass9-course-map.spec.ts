import { expect, test } from '@playwright/test';

const homeModules = [
  { title: 'Logic & Proof', href: '/workbenches/logic', notation: 'P → Q' },
  { title: 'Probability Model Builder', href: '/workbenches/probability', notation: 'P(A | B)' },
  { title: 'Money Timeline', href: '/workbenches/finance', notation: 'F = P(1 + i)ⁿ' },
  { title: 'Row Operations Coach', href: '/workbenches/linear', notation: 'R₂ ← R₂ − 2R₁' },
  { title: 'Optimization & Strategy', href: '/workbenches/applications', notation: 'max z = cᵀx' },
];

test.describe('Pass 9 collapsed More and Compact Course Map', () => {
  test('homepage uses one ruled workbench ledger instead of duplicate hero surfaces', async ({ page }) => {
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


  test('course workbench filters are real controls rather than decorative pills', async ({ page }) => {
    await page.goto('/course');

    const search = page.getByRole('textbox', { name: 'Search workbenches' });
    const items = page.locator('[data-course-workbench]');
    const count = page.locator('[data-course-filter-count]');

    await expect(items).toHaveCount(5);
    await expect(count).toHaveText('5');

    await search.fill('cash');
    await expect(page.locator('[data-course-workbench]:visible')).toHaveCount(1);
    await expect(page.getByRole('link', { name: /Money Timeline/i })).toBeVisible();
    await expect(count).toHaveText('1');

    await search.fill('');
    const applications = page.getByRole('button', { name: 'Applications', exact: true });
    await applications.click();
    await expect(applications).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('[data-course-workbench]:visible')).toHaveCount(1);
    await expect(page.getByRole('link', { name: /Optimization & Strategy/i })).toBeVisible();
    await expect(count).toHaveText('1');
  });

  test('workbench ledger and solid headline respond without horizontal overflow', async ({ page }) => {
    for (const viewport of [
      { width: 1280, height: 720, heroColumns: 2 },
      { width: 768, height: 1024, heroColumns: 1 },
      { width: 375, height: 667, heroColumns: 1 },
    ]) {
      await page.setViewportSize(viewport);
      await page.goto('/');

      const metrics = await page.evaluate(() => {
        const heading = document.querySelector<HTMLElement>('.home-hero__title');
        const hero = document.querySelector<HTMLElement>('[data-home-hero]');
        const rail = document.querySelector<HTMLElement>('[data-home-course-rail]');
        const primary = document.querySelector<HTMLElement>('[data-home-primary-action]');
        const heroStyle = hero ? getComputedStyle(hero) : null;
        const rect = (element: HTMLElement | null) => {
          if (!element) return null;
          const box = element.getBoundingClientRect();
          return { top: box.top, bottom: box.bottom, height: box.height };
        };
        return {
          heroColumns: heroStyle?.gridTemplateColumns ?? '',
          ledgerVisible: Boolean(rail && rail.getBoundingClientRect().height > 0),
          heading: rect(heading),
          primary: rect(primary),
          backgroundImage: heading ? getComputedStyle(heading).backgroundImage : '',
          overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
        };
      });

      expect(metrics.heroColumns.split(' ').filter(Boolean).length, `${viewport.width}px hero columns`).toBe(viewport.heroColumns);
      expect(metrics.ledgerVisible).toBe(true);
      expect(metrics.backgroundImage, `${viewport.width}px H1 should use a solid foreground`).toBe('none');
      expect(metrics.overflow, `${viewport.width}x${viewport.height} should not overflow horizontally`).toBe(false);
      expect(metrics.heading?.bottom, `${viewport.width}px heading should render`).toBeLessThanOrEqual(viewport.height);
      expect(metrics.primary?.bottom, `${viewport.width}px CTA should render`).toBeLessThanOrEqual(viewport.height);
    }
  });

  test('mobile workbench routes can clear the opaque navigation dock', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await page.evaluate(() => {
      const scroller = document.querySelector<HTMLElement>('.workspace-scroll');
      if (scroller) scroller.scrollTo(0, scroller.scrollHeight);
    });

    const geometry = await page.evaluate(() => {
      const lastRoute = Array.from(document.querySelectorAll<HTMLElement>('[data-home-module]')).at(-1) ?? null;
      const dock = document.querySelector<HTMLElement>('.mobile-nav');
      if (!lastRoute || !dock) return null;
      const routeBox = lastRoute.getBoundingClientRect();
      const dockBox = dock.getBoundingClientRect();
      const dockStyles = getComputedStyle(dock);
      return {
        routeBottom: routeBox.bottom,
        dockTop: dockBox.top,
        dockBackground: dockStyles.backgroundColor,
        dockOpacity: dockStyles.opacity,
      };
    });

    expect(geometry).not.toBeNull();
    expect(geometry?.routeBottom).toBeLessThan(geometry?.dockTop ?? 0);
    expect(geometry?.dockBackground).not.toBe('rgba(0, 0, 0, 0)');
    expect(geometry?.dockOpacity).toBe('1');
  });

  test('solid headline remains legible in forced colors', async ({ page }) => {
    await page.goto('/');
    await expect.poll(() => page.locator('.home-hero__title').evaluate((heading) => getComputedStyle(heading).backgroundImage)).toBe('none');

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
    expect(forcedColors?.backgroundImage).toBe('none');
    expect(forcedColors?.color).not.toBe('rgba(0, 0, 0, 0)');
    expect(forcedColors?.textFill).not.toBe('rgba(0, 0, 0, 0)');
  });

  test('topbar More stays viewport-contained at short desktop heights', async ({ page }) => {
    for (const viewport of [
      { width: 1280, height: 720 },
      { width: 1280, height: 480 },
    ]) {
      await page.setViewportSize(viewport);
      await page.goto('/');
      const more = page.locator('[data-topbar-more]');
      await more.locator('summary').click();
      const panel = more.locator('.topbar-more-menu__panel');
      await expect(panel).toBeVisible();

      const geometry = await panel.evaluate((element) => {
        const rect = element.getBoundingClientRect();
        return {
          left: rect.left,
          right: rect.right,
          top: rect.top,
          bottom: rect.bottom,
          overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
        };
      });
      expect(geometry.left).toBeGreaterThanOrEqual(0);
      expect(geometry.right).toBeLessThanOrEqual(viewport.width);
      expect(geometry.top).toBeGreaterThanOrEqual(0);
      expect(geometry.bottom).toBeLessThanOrEqual(viewport.height);
      expect(geometry.overflow).toBe(false);
      await expect(panel.getByRole('link', { name: 'Reference', exact: true })).toBeVisible();
      await expect(panel.getByRole('button', { name: 'Developer contact', exact: true })).toBeVisible();

      await page.keyboard.press('Escape');
      await expect(panel).toBeHidden();
    }
  });

  test('Developer from topbar More restores focus to its trigger after the dialog closes', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');
    const more = page.locator('[data-topbar-more]');
    await more.locator('summary').click();
    const trigger = more.getByRole('button', { name: 'Developer contact', exact: true });
    await trigger.click();
    const dialog = page.getByRole('dialog', { name: 'Developer contact' });
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Close developer contact' }).click();
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test('desktop topbar More and mobile More expose the same utility destinations', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');
    const desktopMore = page.locator('[data-topbar-more]');
    await desktopMore.locator('summary').click();
    for (const label of ['Reference', 'Saved', 'Settings']) {
      await expect(desktopMore.getByRole('link', { name: label, exact: true })).toBeVisible();
    }
    await expect(desktopMore.getByRole('button', { name: 'Developer contact', exact: true })).toBeVisible();

    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await expect(page.locator('.mobile-nav .mobile-nav-link')).toHaveCount(4);
    const mobileMore = page.locator('.mobile-more-menu');
    await mobileMore.locator('summary').click();
    await expect(mobileMore.locator('.mobile-more-menu__panel')).toBeVisible();
    for (const label of ['Reference', 'Saved', 'Settings']) {
      await expect(mobileMore.getByRole('link', { name: label, exact: true })).toBeVisible();
    }
    await expect(mobileMore.getByRole('button', { name: 'Developer contact', exact: true })).toBeVisible();
  });
});
