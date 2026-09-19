import { expect, test } from '@playwright/test';

test.describe('Pass 7 navigation and workspace clarity', () => {
  test('desktop shell exposes the topbar destinations and a More utility menu', async ({ page }) => {
    test.skip((page.viewportSize()?.width ?? 0) < 901, 'Desktop navigation is replaced by the mobile dock below 901px.');
    await page.goto('/');

    const primary = page.getByRole('navigation', { name: 'Primary destinations' });
    for (const label of ['Home', 'Study', 'Course', 'Progress']) {
      await expect(primary.getByRole('link', { name: label, exact: true })).toBeVisible();
    }

    const more = page.locator('[data-topbar-more]');
    await expect(more.locator('summary')).toBeVisible();
    await more.locator('summary').click();
    for (const label of ['Reference', 'Saved', 'Settings']) {
      await expect(more.getByRole('link', { name: label, exact: true })).toBeVisible();
    }
    await expect(more.getByRole('button', { name: 'Developer contact', exact: true })).toBeVisible();
  });

  test('home is a brand-first route index with real module links', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('[data-home-hero]')).toBeVisible();
    await expect(page.locator('.home-hero__title')).toHaveAccessibleName('Finite mathematics, made visible.');
    await expect(page.locator('[data-home-course-rail] [data-home-module]')).toHaveCount(5);
    await expect(page.locator('.module-spotlight-link')).toHaveCount(0);
    await expect(page.locator('.home-bento')).toHaveCount(0);
    await expect(page.locator('.home-loop')).toHaveCount(0);
    await expect(page.locator('.module-door')).toHaveCount(0);
  });

  test('home headline is static and uses balanced readable typography', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.home-hero__title')).toBeVisible();
    await expect(page.locator('.motion-headline')).toHaveCount(0);
    await expect.poll(() => page.locator('.home-hero__title').evaluate((heading) => getComputedStyle(heading).textWrap)).toContain('balance');
  });

  test('module views are deep-linkable and keep one workbench beside notes', async ({ page }) => {
    await page.goto('/modules/logic');
    const tabs = page.getByRole('navigation', { name: 'Module sections' });
    await expect(tabs.getByRole('link', { name: /^Overview/ })).toHaveAttribute('aria-current', 'page');
    await expect(tabs.getByRole('link', { name: /^Labs/ })).toHaveCount(0);
    await expect(page.getByRole('link', { name: /Logic & Proof/ }).first()).toHaveAttribute('href', '/workbenches/logic');

    await page.getByRole('navigation', { name: 'Module sections' }).getByRole('link', { name: /^Notes/ }).click();
    await expect(page).toHaveURL(/\/modules\/logic\?view=notes$/);
    await expect(page.locator('[data-module-view="notes"]')).toBeVisible();
  });

  test('public indexes use learner labels instead of implementation taxonomy', async ({ page }) => {
    await page.goto('/modules/logic?view=labs');
    const moduleWorkbench = page.locator('.module-next-step--workbench');
    await expect(moduleWorkbench).toContainText('Logic & Proof');
    await expect(moduleWorkbench).not.toContainText(/\b(logic|probability|finance|linear|applications)\.[a-z-]+/i);

    await page.goto('/course');
    const directory = page.getByTestId('workbench-directory');
    await expect(directory).toContainText('Logic & Proof');
    await expect(directory).not.toContainText(/implemented|engine-ready|planned|live/i);

    await page.goto('/lessons/logic/truth-tables');
    await expect(page.locator('.lesson-header__context')).toHaveText('Core study note');
    await expect(page.locator('.lesson-header__context')).not.toContainText('implemented');
    await expect(page.locator('.lab-breadcrumbs a').nth(1)).toHaveText('Logic');

    await page.goto('/study');
    const studyDashboard = page.getByTestId('study-dashboard');
    await expect(studyDashboard).toBeVisible();
    await expect(studyDashboard).not.toContainText('live module');

    await page.goto('/lessons/finance/interest-measurement');
    const lessonIslands = await page.locator('astro-island[client="load"]').count();
    await expect(page.locator('astro-island[client="load"][client-render-time]')).toHaveCount(lessonIslands);
    const saveLesson = page.getByRole('button', { name: 'Save lesson', exact: true });
    await expect(saveLesson).toBeVisible();
    await saveLesson.click();
    await expect(page.getByRole('button', { name: 'Saved', exact: true })).toBeVisible();
    await page.goto('/saved');
    await expect(page.getByTestId('saved-library')).toBeVisible();
    await expect(page.locator('.saved-item').first()).toContainText('Lesson');
    await expect(page.locator('.saved-item').first()).toContainText('Financial Mathematics');
    await expect(page.locator('.saved-item').first()).not.toContainText('custom-problem');
    await expect(page.locator('.saved-item').first()).not.toContainText('finance');

    await page.goto('/');
    await expect(page.locator('.command-dialog[data-hydrated="true"]')).toBeAttached();
    await page.getByRole('button', { name: 'Search AMAT 19' }).click();
    await expect(page.locator('.command-dialog')).toBeVisible();
    await page.locator('.command-dialog__input').fill('logic');
    await expect(page.locator('.command-result').first()).toBeVisible();
    const commandCopy = (await page.locator('.command-result').allTextContents()).join(' ');
    expect(commandCopy).not.toMatch(/\b(logic|probability|finance|linear|applications)\.[a-z-]+/i);
    expect(commandCopy).not.toMatch(/\b(live|implemented|engine-ready)\b/i);
  });

  test('learner-facing workbench explanations avoid implementation mechanics', async ({ page }) => {
    for (const route of [
      '/workbenches/logic',
      '/workbenches/probability',
      '/workbenches/finance',
      '/workbenches/linear',
      '/workbenches/applications',
    ]) {
      await page.goto(route);
      await expect(page.locator('main')).not.toContainText(/\bworker\b|internal value|deterministic run|engine(?:'s)? (?:trace|step)|probability engine/i);
    }

    await expect(page.locator('.site-footer')).not.toContainText('deterministic learning tools');
  });

  test('settings exposes the functional motion preference and restores it on reload', async ({ page }) => {
    await page.goto('/settings');

    const settings = page.getByTestId('settings-panel');
    await expect(settings).toBeVisible();
    await expect(settings.getByText('Reduce interface motion', { exact: true })).toBeVisible();
    await expect(settings.locator('select')).toHaveCount(0);
    await expect(settings.getByText(/future shared formatters|internal precision|adaptive practice presets/i)).toHaveCount(0);

    const motion = settings.getByRole('checkbox');
    await expect(motion).toBeVisible();
    await motion.check();
    await expect.poll(() => page.evaluate(() => document.documentElement.dataset.motion)).toBe('reduced');

    await page.reload();
    await expect(settings).toBeVisible();
    await expect.poll(() => page.evaluate(() => document.documentElement.dataset.motion)).toBe('reduced');
    await expect(motion).toBeChecked();
  });

  test('local-data controls describe browser storage without exposing implementation labels', async ({ page }) => {
    await page.goto('/progress');
    const dataManager = page.getByTestId('data-manager');
    await expect(dataManager).toBeVisible();
    await expect(dataManager).not.toContainText(/schema v|IndexedDB/i);
    await expect(dataManager).toContainText('Your work stays in this browser.');
  });

  test('shared workbench shell keeps the tool first and resources secondary', async ({ page }) => {
    await page.goto('/workbenches/logic');

    await expect(page.getByTestId('workbench-shell')).toBeVisible();
    await expect(page.locator('[data-workbench-canvas]')).toBeVisible();
    await expect(page.locator('.lab-route__context-rail, .lab-route__support')).toHaveCount(0);
    const resources = page.getByRole('navigation', { name: 'Workbench resources' });
    await expect(resources.getByRole('link', { name: 'Logic' })).toHaveAttribute('href', '/modules/logic');
    await expect(resources.getByRole('link', { name: 'Notes' })).toHaveAttribute('href', '/modules/logic?view=notes');
    await expect(resources.getByRole('link', { name: 'Notation' })).toHaveAttribute('href', '/reference');
  });

  test('reference filters restore from the URL and remain expandable', async ({ page }) => {
    await page.goto('/reference?q=conditional&module=Probability');
    const reference = page.getByTestId('reference-browser');
    await expect(reference).toHaveAttribute('data-hydrated', 'true');
    await expect(reference.getByRole('searchbox', { name: 'Search reference' })).toHaveValue('conditional');
    await expect(reference.getByRole('combobox', { name: 'Filter by module' })).toHaveValue('Probability');
    await expect(reference.locator('.reference-entry')).toHaveCount(1);
    await expect(reference.locator('.reference-entry').first().locator('summary')).toBeVisible();
  });

  test('module routes expose contextual retrieval without a global Practice Center', async ({ page }) => {
    await page.goto('/modules/logic?view=practice&preset=logic-drill');
    await expect(page.locator('[data-module-view="practice"]')).toBeVisible();
    await expect(page.getByTestId('mixed-practice')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Practice this module.' })).toBeVisible();
    await expect(page.getByText('Practice Center', { exact: true })).toHaveCount(0);
  });
});

test('mobile navigation keeps the four core destinations and More visible', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('/study');
  const mobile = page.getByRole('navigation', { name: 'Mobile navigation' });
  await expect(mobile.locator('.mobile-nav-link')).toHaveCount(4);
  for (const label of ['Study', 'Course', 'Progress', 'More']) {
    await expect(mobile.getByText(label, { exact: true })).toBeVisible();
  }

  await expect(mobile.getByRole('link', { name: 'Study', exact: true })).toHaveAttribute('aria-current', 'page');

  const metrics = await mobile.evaluate((element) => {
    const style = getComputedStyle(element);
    const links = Array.from(element.querySelectorAll<HTMLElement>('.mobile-nav-link'));
    const boxes = links.map((link) => link.getBoundingClientRect());
    const viewportWidth = document.documentElement.clientWidth;
    const rect = element.getBoundingClientRect();

    return {
      backgroundColor: style.backgroundColor,
      backdropFilter: style.backdropFilter || style.webkitBackdropFilter,
      height: rect.height,
      left: rect.left,
      right: rect.right,
      viewportWidth,
      allTargetsAtLeast44: boxes.every((box) => box.width >= 44 && box.height >= 44),
      labelsFit: links.every((link) => link.scrollWidth <= link.clientWidth + 1),
    };
  });

  expect(metrics.backgroundColor).not.toBe('rgb(36, 5, 9)');
  expect(metrics.backgroundColor).not.toBe('rgba(36, 5, 9, 1)');
  expect(metrics.backdropFilter).not.toBe('none');
  expect(metrics.height).toBeLessThanOrEqual(72);
  expect(metrics.left).toBeGreaterThanOrEqual(0);
  expect(metrics.right).toBeLessThanOrEqual(metrics.viewportWidth);
  expect(metrics.allTargetsAtLeast44).toBe(true);
  expect(metrics.labelsFit).toBe(true);

  await mobile.locator('.mobile-more-menu > summary').click();
  const panel = mobile.locator('.mobile-more-menu__panel');
  await expect(panel).toBeVisible();
  const panelBackground = await panel.evaluate((element) => getComputedStyle(element).backgroundColor);
  expect(panelBackground).not.toBe('rgb(46, 8, 13)');
});


test('adaptive Study queue appears before the browse catalog', async ({ page }) => {
  await page.goto('/study');
  const dashboard = page.getByTestId('study-dashboard');
  await expect(dashboard).toBeVisible();
  await expect(page.getByRole('heading', { name: 'What should I study now?' })).toBeVisible();
  await expect(page.getByText('Your unfinished sessions, recent misses, saved items, and skill evidence shape the queue below.', { exact: true })).toBeVisible();

  const order = await page.evaluate(() => {
    const dashboard = document.querySelector('[data-testid="study-dashboard"]');
    const catalog = document.querySelector('.study-hub-grid');
    if (!dashboard || !catalog) return null;
    return Boolean(dashboard.compareDocumentPosition(catalog) & Node.DOCUMENT_POSITION_FOLLOWING);
  });
  expect(order).toBe(true);
});


test('Study page does not expose inactive resource controls', async ({ page }) => {
  await page.goto('/study');
  await expect(page.locator('.study-toolbar')).toHaveCount(0);
  await expect(page.getByRole('searchbox', { name: 'Search resources' })).toHaveCount(0);
  await expect(page.getByRole('tablist', { name: 'Resource filter' })).toHaveCount(0);
});


test('Study browse catalog is registry-backed and exposes truthful skill counts', async ({ page }) => {
  await page.goto('/study');
  const topics = page.locator('[data-study-topic]');
  await expect(topics).toHaveCount(5);

  for (const title of ['Logic & Proof', 'Probability Model Builder', 'Money Timeline', 'Row Operations Coach', 'Optimization & Strategy']) {
    await expect(topics.filter({ hasText: title })).toHaveCount(1);
  }

  await expect(topics.filter({ hasText: 'Optimization & Strategy' })).toHaveAttribute('href', '/workbenches/applications');

  const metadata = await topics.evaluateAll((cards) => cards.map((card) => ({
    count: Number(card.getAttribute('data-current-skill-count')),
    text: card.textContent ?? '',
  })));
  expect(metadata.every(({ count, text }) => Number.isInteger(count) && count > 0 && text.includes(`${count} current skill`))).toBe(true);

  const body = await page.locator('body').innerText();
  expect(body).not.toMatch(/120\+ problems|12 reviewers|8 sheets|24 saved|28 problems|36 problems|25 problems|31 problems/);
});


test('Course page does not fabricate learner progress', async ({ page }) => {
  await page.goto('/course');
  await expect(page.locator('.syllabus-progress-card')).toHaveCount(0);
  await expect(page.getByText('0 of 5 modules completed.', { exact: false })).toHaveCount(0);
  await expect(page.getByText('Not Started', { exact: true })).toHaveCount(0);
});


test('Course presents the roadmap as an app-organized suggested path', async ({ page }) => {
  await page.goto('/course');
  await expect(page.getByRole('heading', { name: 'Suggested Study Path.' })).toBeVisible();
  await expect(page.getByText('This is not an official weekly schedule.', { exact: false })).toBeVisible();
  await expect(page.getByText('Course Syllabus.', { exact: true })).toHaveCount(0);
  await expect(page.locator('main')).not.toContainText('10-week journey');
});


test('Course suggested path uses neutral sequence labels instead of week claims', async ({ page }) => {
  await page.goto('/course');
  const labels = page.locator('.syllabus-module-week');
  await expect(labels).toHaveCount(5);
  for (let index = 0; index < 5; index += 1) {
    await expect(labels.nth(index)).toHaveText(`Step ${index + 1}`);
  }
  await expect(page.locator('main')).not.toContainText(/Wk\s+\d/);
});
