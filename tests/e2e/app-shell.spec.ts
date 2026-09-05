import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('@core course shell exposes Logic, Probability, and local progress routes', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Finite mathematics, made visible/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /Logic/ }).first()).toBeVisible();
  await expect(page.getByRole('link', { name: /Probability/ }).first()).toBeVisible();
  await page.goto('/progress');
  await expect(page.getByTestId('progress-dashboard')).toBeVisible();
  await expect(page.getByTestId('data-manager')).toBeVisible();
});

test('home and module journeys lead with a brand index instead of a snapshot panel', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('[data-home-hero]')).toBeVisible();
  await expect(page.locator('[data-home-course-rail]')).toBeVisible();
  await expect(page.getByTestId('home-study-snapshot')).toHaveCount(0);
  await expect(page.locator('.module-spotlight-link')).toHaveCount(0);

  await page.goto('/modules/logic');
  await expect(page.getByTestId('module-overview')).toBeVisible();
  await expect(page.locator('.module-journey__metrics')).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Module sections' })).toBeVisible();
  await expect(page.locator('[data-module-view="overview"]')).toBeVisible();
});

test('primary navigation marks the current route and mobile navigation stays docked', async ({ page }) => {
  await page.goto('/progress');
  await page.setViewportSize({ width: 1280, height: 800 });
  const primaryNavigation = page.getByRole('navigation', { name: 'Primary navigation' });
  await expect(primaryNavigation.getByRole('link', { name: 'Home' })).toBeVisible();
  await expect(primaryNavigation.getByRole('link', { name: 'Progress' })).toHaveAttribute('aria-current', 'page');
  await expect(primaryNavigation.locator('.nav-link').filter({ hasText: 'Practice' })).toHaveCount(0);

  await page.setViewportSize({ width: 375, height: 667 });
  const mobileNavigation = page.getByRole('navigation', { name: 'Mobile navigation' });
  await expect(mobileNavigation).toBeVisible();
  await expect(mobileNavigation.getByText('Progress', { exact: true })).toBeVisible();
  await expect(mobileNavigation.locator('.mobile-nav-link')).toHaveCount(4);
});

test('Elbi workspace shell exposes desktop navigation, collapse state, and mobile dock', async ({ page }) => {
  await page.goto('/');

  const frame = page.locator('.app-frame');
  const sidebar = page.locator('.sidebar');
  const primaryNavigation = page.getByRole('navigation', { name: 'Primary navigation' });
  const toggle = page.getByRole('button', { name: /Collapse navigation/i });

  await expect(frame).toBeVisible();
  await expect(page.locator('.workspace')).toBeVisible();
  await expect(page.locator('.topbar-search')).toBeVisible();
  await expect(page.locator('.sidebar-footer')).toHaveCount(0);

  if (await sidebar.isVisible()) {
    await expect(primaryNavigation.getByRole('link', { name: 'Home', exact: true })).toHaveAttribute('href', '/');
    await expect(primaryNavigation.getByRole('link', { name: 'Study' })).toBeVisible();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await toggle.click();
    await expect(frame).toHaveClass(/nav-collapsed/);
    await expect(page.getByRole('button', { name: /Expand navigation/i })).toHaveAttribute('aria-expanded', 'false');
    await page.setViewportSize({ width: 375, height: 667 });
  }

  await expect(sidebar).toBeHidden();
  await expect(page.locator('.mobile-nav')).toBeVisible();
  await expect(page.locator('.mobile-nav').getByRole('link', { name: 'Study' })).toBeVisible();
  await expect(page.locator('.mobile-nav').getByText('More', { exact: true })).toBeVisible();
});

test('Home stays reachable in the compact shell and utility navigation opens on request', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('/reference');

  const home = page.locator('.topbar-home');
  await expect(home).toHaveAttribute('href', '/');
  await expect(home).toBeVisible();

  const mobileMore = page.locator('.mobile-more-menu');
  await expect(mobileMore).not.toHaveAttribute('open', '');
  await mobileMore.locator('summary').click();
  await expect(mobileMore.locator('.mobile-more-menu__panel')).toBeVisible();

  await page.setViewportSize({ width: 1280, height: 800 });
  await page.reload();
  await expect(page.locator('.topbar-home')).toBeVisible();
  await expect(page.locator('.more-menu')).not.toHaveAttribute('open', '');
});

test('@core shell navigation controls meet the 44px touch target contract', async ({ page }) => {
  const assertTouchTargets = async (selectors: string[]) => {
    for (const selector of selectors) {
      const bounds = await page.locator(selector).boundingBox();
      expect(bounds, `${selector} should be rendered`).not.toBeNull();
      expect(bounds!.width, `${selector} width`).toBeGreaterThanOrEqual(44);
      expect(bounds!.height, `${selector} height`).toBeGreaterThanOrEqual(44);
    }
  };

  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/');
  await assertTouchTargets(['.sidebar-toggle', '.topbar-home', '.topbar-search']);

  await page.setViewportSize({ width: 375, height: 667 });
  await page.reload();
  await assertTouchTargets(['.topbar-home', '.topbar-search', '.mobile-more-menu > summary']);
});

test('@core workbench controls meet the 44px touch target contract', async ({ page }) => {
  const waitForClientLoad = async () => {
    const islands = page.locator('astro-island[client="load"]');
    const islandCount = await islands.count();
    if (islandCount > 0) {
      await expect(page.locator('astro-island[client="load"][client-render-time]')).toHaveCount(islandCount);
    }
  };

  const assertVisibleTouchTargets = async (selector: string, route: string) => {
    const controls = page.locator(selector);
    await expect(controls.first(), `${route} should render ${selector}`).toBeVisible();
    const count = await controls.count();

    for (let index = 0; index < count; index += 1) {
      const control = controls.nth(index);
      if (!(await control.isVisible())) continue;
      const bounds = await control.boundingBox();
      expect(bounds, `${route} ${selector} #${index + 1} should be rendered`).not.toBeNull();
      expect(bounds!.width, `${route} ${selector} #${index + 1} width`).toBeGreaterThanOrEqual(44);
      expect(bounds!.height, `${route} ${selector} #${index + 1} height`).toBeGreaterThanOrEqual(44);
    }
  };

  for (const route of ['/workbenches/logic', '/workbenches/probability', '/workbenches/finance', '/workbenches/linear', '/workbenches/applications']) {
    await page.goto(route);
    await waitForClientLoad();
    const selector = route.endsWith('/finance')
      ? '[data-primary-controls] input, [data-primary-controls] select, [data-primary-controls] button'
      : '[data-primary-control]';
    await assertVisibleTouchTargets(selector, route);
  }
});

test('home presents a brand-first route index around real AMAT course objects', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('[data-home-hero]')).toBeVisible();
  await expect(page.locator('[data-home-course-rail]')).toBeVisible();
  await expect(page.locator('[data-home-course-rail] [data-home-module]')).toHaveCount(5);
  await expect(page.getByTestId('home-study-snapshot')).toHaveCount(0);
  await expect(page.locator('.home-facts, .home-modules, .module-spotlight-grid')).toHaveCount(0);
  await expect(page.locator('[data-home-primary-action][href="/study"]')).toBeVisible();
  await expect(page.locator('.home-bento')).toHaveCount(0);
  await expect(page.locator('.home-loop')).toHaveCount(0);
});

test('public surfaces obey the anti-vibecode hierarchy and status semantics', async ({ page }) => {
  test.setTimeout(120_000);
  const routes = [
    '/',
    '/study',
    '/course',
    '/exam',
    '/progress',
    '/reference',
    '/saved',
    '/settings',
    '/modules/logic',
    '/workbenches/logic',
    '/lessons/logic/truth-tables',
    '/workbenches/probability',
    '/workbenches/finance',
    '/workbenches/linear',
    '/workbenches/applications',
  ];

  for (const route of routes) {
    await page.goto(route);
    const hierarchyViolations = await page.evaluate(() => {
      const forbiddenLabelClasses = [
        'eyebrow',
        'bento-kicker',
        'section-label',
        'lab-route__eyebrow',
      ];

      return Array.from(document.querySelectorAll('h1, h2')).flatMap((heading) => {
        const previous = heading.previousElementSibling;
        if (!previous || !forbiddenLabelClasses.some((className) => previous.classList.contains(className))) {
          return [];
        }

        return [{ heading: heading.textContent?.trim(), label: previous.textContent?.trim() }];
      });
    });

    expect(hierarchyViolations, `${route} has a label directly above a primary heading`).toEqual([]);
    await expect(page.locator('.status-dot, .mastery-dot, .bento-kicker__mark')).toHaveCount(0);

    const visibleCopy = await page.locator('body').innerText();
    expect(visibleCopy, `${route} exposes internal workflow language`).not.toMatch(/RESEARCH SNAPSHOT|FRESHIE MODE|AI GENERATED|AGENT MODE/i);
  }
});

test('legacy practice URLs redirect to the study workspace', async ({ page }) => {
  await page.goto('/practice?preset=quick-5');
  await expect(page).toHaveURL(/\/study/);
  await expect(page.getByTestId('study-dashboard')).toBeVisible();
  await expect(page.getByText('Practice Center', { exact: true })).toHaveCount(0);
});

test('approved typography uses Plus Jakarta Sans and JetBrains Mono', async ({ page }) => {
  await page.goto('/');
  const typography = await page.evaluate(() => ({
    body: getComputedStyle(document.body).fontFamily,
    display: getComputedStyle(document.querySelector('.home-hero__title')!).fontFamily,
    formula: getComputedStyle(document.querySelector('[data-home-notation]')!).fontFamily,
    plusJakartaLoaded: document.fonts.check('16px "Plus Jakarta Sans"'),
    jetBrainsLoaded: document.fonts.check('16px "JetBrains Mono"'),
  }));
  expect(typography.body).toContain('Plus Jakarta Sans');
  expect(typography.display).toContain('Plus Jakarta Sans');
  expect(typography.formula).toContain('JetBrains Mono');
  expect(typography.plusJakartaLoaded).toBe(true);
  expect(typography.jetBrainsLoaded).toBe(true);
});

test('shell honors media preferences and keeps mobile navigation keyboard-contained', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect.poll(() => page.evaluate(() => ({ reduced: matchMedia('(prefers-reduced-motion: reduce)').matches, transition: Number.parseFloat(getComputedStyle(document.querySelector('.home-hero__title')!).transitionDuration) }))).toMatchObject({ reduced: true });
  expect(await page.locator('.home-hero__title').evaluate((heading) => Number.parseFloat(getComputedStyle(heading).transitionDuration))).toBeLessThanOrEqual(0.001);

  await page.emulateMedia({ reducedMotion: 'no-preference', forcedColors: 'active' });
  await page.reload();
  await expect.poll(() => page.evaluate(() => ({ forced: matchMedia('(forced-colors: active)').matches, icon: getComputedStyle(document.querySelector('.mobile-nav .nav-icon')!).color }))).toEqual({ forced: true, icon: 'rgb(0, 0, 0)' });

  await page.goto('/progress');
  const mobile = page.getByRole('navigation', { name: 'Mobile navigation' });
  const more = mobile.locator('.mobile-more-menu');
  await more.locator('summary').focus();
  await page.keyboard.press('Enter');
  await expect(more.locator('.mobile-more-menu__panel')).toBeVisible();
  await more.getByRole('link', { name: 'Settings' }).focus();
  await expect.poll(() => page.evaluate(() => document.querySelector('.mobile-nav')?.contains(document.activeElement))).toBe(true);
});

test('command palette groups results and supports arrow-key selection', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.command-dialog[data-hydrated="true"]')).toBeAttached();
  const mobileTrigger = page.getByRole('button', { name: /Open navigation/i });
  if (await mobileTrigger.isVisible()) {
    await mobileTrigger.click();
    await page.getByRole('dialog', { name: /Navigate/i }).getByRole('button', { name: /Search the study lab/i }).click();
  } else {
    await page.getByRole('button', { name: 'Search AMAT 19' }).click();
  }

  const palette = page.getByRole('dialog', { name: /Search AMAT 19/i });
  const input = palette.getByRole('combobox', { name: /Search skills/i });
  await expect(palette.getByRole('group', { name: 'Workspace', exact: true })).toBeVisible();

  await input.fill('conditional');
  const result = palette.getByRole('option', { name: /Probability Model Builder/i }).first();
  await expect(result).toBeVisible();
  await page.keyboard.press('ArrowDown');
  await expect(result).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/workbenches\/probability/);
});

test('command palette exposes a screen-reader combobox and listbox contract', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.command-dialog[data-hydrated="true"]')).toBeAttached();
  await page.getByRole('button', { name: 'Search AMAT 19' }).click();

  const palette = page.getByRole('dialog', { name: /Search AMAT 19/i });
  const input = palette.getByRole('combobox', { name: /Search skills/i });
  await expect(input).toHaveAttribute('aria-expanded', 'true');
  await expect(input).toHaveAttribute('aria-haspopup', 'listbox');
  await expect(input).toHaveAttribute('aria-autocomplete', 'list');
  await expect(palette.locator('[role="listbox"]')).toBeVisible();

  await input.fill('conditional');
  await page.keyboard.press('ArrowDown');
  const activeId = await input.getAttribute('aria-activedescendant');
  expect(activeId).toBeTruthy();
  await expect(palette.locator(`#${activeId}`)).toHaveAttribute('role', 'option');
  await expect(palette.locator(`#${activeId}`)).toHaveAttribute('aria-selected', 'true');
});

test('command palette keeps a visible focus ring on its search input', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.command-dialog[data-hydrated="true"]')).toBeAttached();
  await page.getByRole('button', { name: 'Search AMAT 19' }).click();

  const input = page.getByRole('dialog', { name: /Search AMAT 19/i }).getByRole('combobox', { name: /Search skills/i });
  await input.focus();
  await expect.poll(() => input.evaluate((element) => {
    const style = getComputedStyle(element);
    return { outlineStyle: style.outlineStyle, outlineWidth: style.outlineWidth };
  })).toEqual({ outlineStyle: 'solid', outlineWidth: '2px' });
});

test('command palette returns focus to its trigger after dismissal', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.command-dialog[data-hydrated="true"]')).toBeAttached();
  const trigger = page.getByRole('button', { name: 'Search AMAT 19' });
  await trigger.click();

  const input = page.getByRole('dialog', { name: /Search AMAT 19/i }).getByRole('combobox', { name: /Search skills/i });
  await expect(input).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(trigger).toBeFocused();
});

test('command palette close control has no legacy decorative affordance', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.command-dialog[data-hydrated="true"]')).toBeAttached();
  await page.getByRole('button', { name: 'Search AMAT 19' }).click();

  const close = page.getByRole('button', { name: 'Close search' });
  await expect(close).toBeVisible();
  await expect.poll(() => close.evaluate((element) => getComputedStyle(element, '::after').content)).toBe('none');
});

test('open command palette has no serious accessibility violations', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.command-dialog[data-hydrated="true"]')).toBeAttached();
  await page.getByRole('button', { name: 'Search AMAT 19' }).click();

  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter((violation) => ['critical', 'serious'].includes(violation.impact ?? ''))).toEqual([]);
});

test('hydrated workbench registers a persistence flush before a PWA update', async ({ page }) => {
  await page.goto('/workbenches/logic?mode=compare');
  const islandCount = await page.locator('astro-island[client="load"]').count();
  await expect(page.locator('astro-island[client="load"][client-render-time]')).toHaveCount(islandCount);
  await expect(page.getByTestId('logic-proof-workbench')).toHaveAttribute('data-hydrated', 'true');

  const taskCount = await page.evaluate(() => {
    const detail = { tasks: [] as Array<() => Promise<unknown> | unknown> };
    window.dispatchEvent(new CustomEvent('amat:before-update', { detail }));
    return detail.tasks.length;
  });

  expect(taskCount).toBe(1);
});

test('development unregisters stale service workers without registering another one', async ({ page }) => {
  await page.addInitScript(() => {
    const state = { registrations: 0, unregistrations: 0 };
    const staleRegistration = {
      unregister: async () => {
        state.unregistrations += 1;
        return true;
      },
    };
    const serviceWorker = {
      controller: {},
      register: async () => {
        state.registrations += 1;
        return { waiting: null, installing: null, addEventListener() {} };
      },
      getRegistrations: async () => [staleRegistration],
      addEventListener() {},
    };

    Object.defineProperty(navigator, 'serviceWorker', { configurable: true, value: serviceWorker });
    Object.assign(window, { __amatServiceWorkerState: state });
  });

  await page.goto('/');
  await expect.poll(() => page.evaluate(() => (
    window as typeof window & { __amatServiceWorkerState: { registrations: number; unregistrations: number } }
  ).__amatServiceWorkerState)).toEqual({ registrations: 0, unregistrations: 1 });
});

test('lesson routes render original content collection entries', async ({ page }) => {
  await page.goto('/lessons/logic/truth-tables');
  await expect(page.getByRole('heading', { name: 'Truth Values and Truth Tables' })).toBeVisible();
  await expect(page.getByText(/2ⁿ rows/)).toBeVisible();
});

test('manifest and offline fallback are served', async ({ request }) => {
  const manifest = await request.get('/manifest.webmanifest');
  expect(manifest.ok()).toBeTruthy();
  const data = await manifest.json();
  expect(data.icons.some((icon: { sizes?: string }) => icon.sizes === '512x512')).toBeTruthy();
  const offline = await request.get('/offline.html');
  expect(offline.ok()).toBeTruthy();
});

test('home and progress have no serious automated accessibility violations', async ({ page }) => {
  for (const route of ['/', '/progress']) {
    await page.goto(route);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations.filter((violation) => ['critical', 'serious'].includes(violation.impact ?? '')), route).toEqual([]);
  }
});

test('progress leads with needs attention and can reveal full core evidence', async ({ page }) => {
  await page.goto('/progress');
  const dashboard = page.getByTestId('progress-dashboard');
  const attention = dashboard.getByTestId('progress-attention');
  const skills = attention.locator('.progress-focus-skill');

  await expect(attention).toBeVisible();
  await expect(attention.getByRole('heading', { name: 'Needs attention' })).toBeVisible();
  await expect(skills).toHaveCount(6);

  const showAll = attention.getByRole('button', { name: /Show all \d+ core skills/i });
  await expect(showAll).toBeVisible();
  await showAll.click();
  await expect(skills).toHaveCount(20);
  await expect(attention.getByRole('button', { name: /Show fewer skills/i })).toBeVisible();
});

test('mobile routes do not create page-level horizontal overflow', async ({ page }) => {
  test.setTimeout(90_000);
  await page.setViewportSize({ width: 375, height: 812 });
  for (const route of ['/', '/modules/logic', '/modules/logic?view=practice', '/workbenches/logic', '/workbenches/probability', '/workbenches/finance', '/workbenches/linear', '/workbenches/applications', '/exam', '/reference', '/progress']) {
    await page.goto(route);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(overflow, route).toBe(false);
  }
});

test('@core contextual retrieval, mixed check, and reference surfaces render', async ({ page }) => {
  await page.goto('/modules/logic?view=practice&preset=logic-drill');
  await expect(page.getByTestId('mixed-practice')).toBeVisible();
  await page.goto('/exam');
  await expect(page.getByTestId('mixed-exam')).toBeVisible();
  await page.goto('/reference');
  await expect(page.getByRole('heading', { name: /map of the symbols/i })).toBeVisible();
});

test('@core logic task switch is keyboard-accessible', async ({ page }) => {
  await page.goto('/workbenches/logic');
  const workbench = page.getByTestId('logic-proof-workbench');
  await expect(workbench).toHaveAttribute('data-hydrated', 'true');
  const picker = workbench.getByRole('combobox', { name: 'Choose a task' });
  await expect(picker).toHaveValue('translate');
  await picker.focus();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  await expect(picker).toHaveValue('compare');
  await expect(page.getByRole('heading', { name: 'Find the row that separates them.' })).toBeVisible();
});

test('reference browser searches, filters by module, and expands assumptions', async ({ page }) => {
  await page.goto('/reference');
  const reference = page.getByTestId('reference-browser');
  const search = reference.getByRole('searchbox', { name: 'Search reference' });
  const filter = reference.getByRole('combobox', { name: 'Filter by module' });

  await expect(search).toBeVisible();
  await expect(reference).toHaveAttribute('data-hydrated', 'true');
  await expect(filter).toBeVisible();
  await expect(reference.locator('.reference-entry')).toHaveCount(28);

  const firstEntry = reference.locator('.reference-entry').first();
  await firstEntry.getByText(/∼P/).click();
  await expect(firstEntry.locator('.reference-entry__body')).toBeVisible();

  await search.fill('conditional');
  await expect(reference.locator('.reference-entry')).toHaveCount(2);
  await expect(reference.getByText('P(A|B) = P(A∩B) / P(B)', { exact: true })).toBeVisible();

  await search.fill('');
  await filter.selectOption('Logic');
  await expect(reference.locator('.reference-entry')).toHaveCount(5);
  await expect(reference.locator('.reference-entry[data-module="Probability"]')).toHaveCount(0);
});

test('@core mixed course check withholds explanations until submission', async ({ page }) => {
  await page.goto('/exam');
  const exam = page.getByTestId('mixed-exam');
  await expect(exam).toHaveAttribute('data-hydrated', 'true');
  await expect(exam.getByText('Correct.', { exact: true })).toHaveCount(0);
  await exam.getByRole('radio').first().check();
  await exam.getByRole('button', { name: /Submit all answers/i }).click();
  await expect(exam.locator('.mixed-practice__score')).toBeVisible();
  await expect(exam.locator('.mixed-question__result').first()).toBeVisible();
});

test('contextual retrieval focuses one question and advances after checking', async ({ page }) => {
  await page.goto('/modules/logic?view=practice&preset=logic-drill');
  const practice = page.getByTestId('mixed-practice');
  await expect(practice).toHaveAttribute('data-hydrated', 'true');
  const stage = practice.locator('.mixed-question-stage');

  await expect(stage).toBeVisible();
  await expect(stage.locator('.mixed-question')).toHaveCount(1);
  await expect(practice.getByText(/^Question 1 of \d+$/, { exact: true })).toBeVisible();
  await expect(practice.getByRole('button', { name: 'Check item' })).toBeDisabled();

  await stage.getByRole('radio').first().check();
  await practice.getByRole('button', { name: 'Check item' }).click();
  await expect(stage.locator('.mixed-question__result')).toBeVisible();
  await expect(practice.getByRole('button', { name: /Next question/i })).toBeVisible();

  await practice.getByRole('button', { name: /Next question/i }).click();
  await expect(practice.getByText(/^Question 2 of \d+$/, { exact: true })).toBeVisible();
  await expect(stage.locator('.mixed-question')).toHaveCount(1);
});

test('exam keeps one question in view and exposes a jump navigator', async ({ page }) => {
  await page.goto('/exam');
  const exam = page.getByTestId('mixed-exam');
  const stage = exam.locator('.mixed-question-stage');

  const islandCount = await page.locator('astro-island[client="load"]').count();
  await expect(page.locator('astro-island[client="load"][client-render-time]')).toHaveCount(islandCount);
  await expect(exam).toHaveAttribute('data-hydrated', 'true');
  await expect(stage.locator('.mixed-question')).toHaveCount(1);
  await expect(exam.locator('.exam-question-nav')).toBeVisible();
  await expect(exam.locator('.exam-question-nav button')).toHaveCount(12);
  await expect(exam.locator('.exam-question-nav button').first()).toHaveAttribute('aria-current', 'step');

  await exam.locator('.exam-question-nav button').nth(1).click();
  await expect(exam.getByText('Question 2 of 12', { exact: true })).toBeVisible();
  await expect(stage.locator('.mixed-question')).toHaveCount(1);
  await expect(exam.locator('.mixed-question__result')).toHaveCount(0);
});
