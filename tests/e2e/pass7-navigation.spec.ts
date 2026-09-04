import { expect, test } from '@playwright/test';

test.describe('Pass 7 navigation and workspace clarity', () => {
  test('desktop shell exposes four primary destinations and a More utility menu', async ({ page }) => {
    test.skip((page.viewportSize()?.width ?? 0) < 901, 'Desktop navigation is replaced by the mobile dock below 901px.');
    await page.goto('/');

    const primary = page.getByRole('navigation', { name: 'Primary navigation' });
    await expect(primary.locator('.nav-link')).toHaveCount(4);
    for (const label of ['Home', 'Study', 'Course', 'Progress']) {
      await expect(primary.getByRole('link', { name: label, exact: true })).toBeVisible();
    }

    const more = primary.locator('[data-more-menu]');
    await expect(more).toBeVisible();
    await more.locator('summary').click();
    for (const label of ['Reference', 'Saved', 'Settings']) {
      await expect(more.getByRole('link', { name: label, exact: true })).toBeVisible();
    }
    await expect(more.getByRole('button', { name: 'Developer contact', exact: true })).toBeVisible();
  });

  test('home is a brand-first route index with real module links', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('[data-home-hero]')).toBeVisible();
    await expect(page.locator('.home-hero__title')).toHaveText('Finite mathematics, made visible.');
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
  await page.goto('/');
  const mobile = page.getByRole('navigation', { name: 'Mobile navigation' });
  await expect(mobile.locator('.mobile-nav-link')).toHaveCount(4);
  for (const label of ['Study', 'Course', 'Progress', 'More']) {
    await expect(mobile.getByText(label, { exact: true })).toBeVisible();
  }
});
