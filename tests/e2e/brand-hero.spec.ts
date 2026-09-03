import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';

const homeModules = [
  { title: 'Logic', href: '/modules/logic', notation: 'P → Q' },
  { title: 'Probability', href: '/modules/probability', notation: 'P(A | B)' },
  { title: 'Financial Mathematics', href: '/modules/finance', notation: 'F = P(1 + i)ⁿ' },
  { title: 'Matrices & Systems', href: '/modules/linear', notation: 'Ax = b' },
  { title: 'Applications', href: '/modules/applications', notation: 'max min' },
];

test.describe('AMAT 19 brand hero and identity', () => {
  test('@core homepage leads with the brand thesis and compact module index', async ({ page }) => {
    await page.goto('/');

    const hero = page.locator('[data-home-hero]');
    await expect(hero).toBeVisible();
    await expect(hero.getByRole('heading', { level: 1, name: 'Finite mathematics, made visible.' })).toBeVisible();
    await expect(hero.getByText('Study AMAT 19 through exact, interactive labs for logic, probability, financial mathematics, matrices, and applied models.', { exact: true })).toBeVisible();
    await expect(hero.getByRole('link', { name: 'Start studying' })).toHaveAttribute('href', '/study');
    await expect(hero.getByRole('link', { name: 'Explore the course' })).toHaveAttribute('href', '/course');

    const moduleLinks = hero.locator('[data-home-module]');
    await expect(moduleLinks).toHaveCount(homeModules.length);
    for (const [index, module] of homeModules.entries()) {
      const entry = moduleLinks.nth(index);
      await expect(entry).toHaveAttribute('href', module.href);
      await expect(entry.locator('[data-home-notation]')).toHaveText(module.notation);
    }

    await expect(page.getByTestId('home-study-snapshot')).toHaveCount(0);
    await expect(page.locator('.motion-headline')).toHaveCount(0);
    await expect(hero.locator('.eyebrow, [class*="eyebrow"], [data-hero-eyebrow]')).toHaveCount(0);
  });

  test('@core identity uses the current reusable matrix badge and valid PWA icon references', async ({ page, request }) => {
    await page.goto('/');

    const mark = page.locator('[data-brand-mark]');
    await expect(mark).toHaveCount(1);
    await expect(mark).toHaveClass(/math-brand-mark/);
    await expect(mark).toHaveAttribute('data-brand-variant', 'light');
    await expect(mark.locator('.math-brand-mark__bracket')).toHaveCount(2);
    await expect(mark.locator('.math-brand-mark__letter')).toHaveText('A');
    await expect(page.locator('.brand-route')).toHaveCount(0);
    await expect(page.locator('.sidebar-home')).toHaveCount(0);

    const icon = await request.get('/icon.svg');
    expect(icon.ok()).toBe(true);
    const iconSource = await icon.text();
    expect(iconSource).not.toMatch(/<text\b/i);
    expect(iconSource).not.toMatch(/gradient|atom|glow/i);

    const manifest = await request.get('/manifest.webmanifest');
    expect(manifest.ok()).toBe(true);
    const manifestSource = await manifest.text();
    for (const iconPath of ['/icons/icon-192.png', '/icons/icon-512.png', '/icons/icon-maskable-512.png']) {
      expect(manifestSource).toContain(iconPath);
    }
  });

  test('identity remains legible in the compact rail and the Developer dialog is axe-clean', async ({ page }) => {
    await page.goto('/');
    const mark = page.locator('[data-brand-mark]');
    await expect(mark).toHaveCSS('width', '44px');
    await expect(mark).toHaveCSS('height', '44px');
    await page.getByRole('button', { name: 'Collapse navigation' }).click();
    await expect(mark).toBeVisible();
    await expect(mark.locator('.math-brand-mark__letter')).toHaveText('A');

    await page.locator('[data-more-flyout-trigger]').click();
    const flyout = page.locator('[data-more-flyout]');
    await expect(flyout).toBeVisible();
    await flyout.getByRole('button', { name: 'Developer contact' }).click();
    const results = await new AxeBuilder({ page }).include('#developer-contact-dialog').analyze();
    expect(results.violations).toEqual([]);
  });

  test('shell metadata and visible chrome contain valid text rather than mojibake', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle('Home · AMAT 19 Study Lab');
    await expect(page.locator('body')).not.toContainText(/Â|Ã|â(?:€™|€¦|Œ)/);
  });

  test('hero keeps the primary action in view and avoids horizontal overflow at approved widths', async ({ page }) => {
    for (const viewport of [
      { width: 375, height: 667 },
      { width: 390, height: 844 },
      { width: 414, height: 896 },
      { width: 640, height: 480 },
      { width: 768, height: 1024 },
      { width: 1280, height: 720 },
      { width: 1440, height: 900 },
      { width: 1920, height: 1080 },
    ]) {
      await page.setViewportSize(viewport);
      await page.goto('/');
      const metrics = await page.evaluate(() => {
        const hero = document.querySelector<HTMLElement>('[data-home-hero]');
        const heading = hero?.querySelector<HTMLElement>('h1');
        const primary = hero?.querySelector<HTMLElement>('[data-home-primary-action]');
        const heroStyle = hero ? getComputedStyle(hero) : null;
        const rect = (element: HTMLElement | null) => {
          if (!element) return null;
          const box = element.getBoundingClientRect();
          return { top: box.top, bottom: box.bottom, height: box.height };
        };

        return {
          overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
          heroHeight: hero?.getBoundingClientRect().height ?? 0,
          heading: rect(heading),
          primary: rect(primary),
          columns: heroStyle?.gridTemplateColumns ?? '',
        };
      });

      expect(metrics.overflow, `${viewport.width}x${viewport.height} should not overflow horizontally`).toBe(false);
      expect(metrics.heading?.bottom, `${viewport.width}x${viewport.height} heading should render`).toBeLessThanOrEqual(viewport.height);
      expect(metrics.primary?.bottom, `${viewport.width}x${viewport.height} primary CTA should render`).toBeLessThanOrEqual(viewport.height);
      if (viewport.width >= 1280) {
        expect(metrics.heroHeight, `${viewport.width}px hero should stay restrained`).toBeLessThan(560);
        expect(metrics.columns.split(' ').filter(Boolean).length).toBe(1);
      }
    }
  });

  test('collapsed desktop rail reserves the expand control without navigation overlap', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 480 });
    await page.goto('/');

    const frame = page.locator('.app-frame');
    const sidebar = page.locator('.sidebar');
    const toggle = page.getByRole('button', { name: /Collapse navigation/i });
    await toggle.click();
    await expect(frame).toHaveClass(/nav-collapsed/);

    const geometry = await page.evaluate(() => {
      const sidebar = document.querySelector<HTMLElement>('.sidebar');
      const toggle = document.querySelector<HTMLElement>('[data-sidebar-toggle]');
      const nav = document.querySelector<HTMLElement>('#primary-navigation');
      if (!sidebar || !toggle || !nav) return null;
      const box = (element: HTMLElement) => {
        const rect = element.getBoundingClientRect();
        return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom };
      };
      const sidebarBox = box(sidebar);
      const toggleBox = box(toggle);
      const toggleOverlapsNavigation = Array.from(nav.querySelectorAll<HTMLElement>('a, summary')).some((item) => {
        const itemBox = box(item);
        return itemBox.left < toggleBox.right && itemBox.right > toggleBox.left && itemBox.top < toggleBox.bottom && itemBox.bottom > toggleBox.top;
      });
      return {
        insideSidebar: toggleBox.left >= sidebarBox.left && toggleBox.right <= sidebarBox.right && toggleBox.top >= sidebarBox.top && toggleBox.bottom <= sidebarBox.bottom,
        toggleOverlapsNavigation,
        navScrollable: nav.scrollHeight > nav.clientHeight,
      };
    });

    expect(geometry).not.toBeNull();
    expect(geometry?.insideSidebar).toBe(true);
    expect(geometry?.toggleOverlapsNavigation).toBe(false);
    expect(await sidebar.isVisible()).toBe(true);
  });
});

test.describe('Developer utility dialog', () => {
  const assertDialog = async (page: Page, trigger: Locator) => {
    await trigger.click();
    const dialog = page.getByRole('dialog', { name: 'Developer contact' });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('heading', { level: 2, name: 'Developer contact' })).toBeVisible();
    await expect(dialog.getByText('Connect with the person building and maintaining AMAT 19 Study Lab.', { exact: true })).toBeVisible();
    await expect(dialog.getByText('Aedrian Ponce', { exact: true })).toBeVisible();
    await expect(dialog.getByText('Founder & Lead Developer', { exact: true })).toBeVisible();
    await expect(dialog.locator('.dialog-eyebrow, [class*="eyebrow"]')).toHaveCount(0);
    await expect(dialog.getByRole('link', { name: /Facebook/i })).toHaveAttribute('href', 'https://www.facebook.com/aedrian.ponce');
    await expect(dialog.getByRole('link', { name: /LinkedIn/i })).toHaveAttribute('href', 'https://www.linkedin.com/in/aedrian-ponce-a602b0398/');
    await expect(dialog.getByRole('link', { name: /Email/i })).toHaveAttribute('href', 'mailto:aedrianponce1203@gmail.com');
    await expect(dialog.getByRole('link', { name: /Facebook/i })).toHaveAttribute('target', '_blank');
    await expect(dialog.getByRole('link', { name: /Facebook/i })).toHaveAttribute('rel', /noopener/);
    return dialog;
  };

  test('desktop More opens one native dialog and restores focus on close', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');
    const more = page.locator('.more-menu');
    await more.locator('summary').click();
    const trigger = more.getByRole('button', { name: 'Developer contact' });
    await expect(trigger).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Primary navigation' }).getByRole('link', { name: 'Developer contact' })).toHaveCount(0);

    const dialog = await assertDialog(page, trigger);
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();

    await trigger.click();
    await expect(dialog).toBeVisible();
    await page.mouse.click(2, 2);
    await expect(dialog).toBeHidden();
  });

  test('mobile More exposes Developer without changing the four-item dock', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    const mobile = page.locator('.mobile-nav');
    await expect(mobile.locator('.mobile-nav-link')).toHaveCount(4);
    await mobile.locator('.mobile-more-menu > summary').click();
    const trigger = mobile.getByRole('button', { name: 'Developer contact' });
    await expect(trigger).toBeVisible();
    const dialog = await assertDialog(page, trigger);
    await dialog.getByRole('button', { name: 'Close developer contact' }).click();
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
  });
});
