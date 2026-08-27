import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('@core course shell exposes Logic, Probability, and local progress routes', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Make the next step visible/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /Logic/ }).first()).toBeVisible();
  await expect(page.getByRole('link', { name: /Probability/ }).first()).toBeVisible();
  await page.goto('/progress');
  await expect(page.getByTestId('progress-dashboard')).toBeVisible();
  await expect(page.getByTestId('data-manager')).toBeVisible();
});

test('home and module journeys lead with visual study cues instead of long text blocks', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('home-study-snapshot')).toBeVisible();
  await expect(page.getByRole('heading', { name: /Study snapshot/i })).toBeVisible();
  await expect(page.locator('.home-loop')).toBeVisible();
  await expect(page.locator('.module-spotlight-link')).toHaveCount(5);

  await page.goto('/modules/logic');
  await expect(page.getByTestId('module-overview')).toBeVisible();
  await expect(page.locator('.module-journey__metrics')).toBeVisible();
  await expect(page.locator('.module-loop')).toBeVisible();
});

test('primary navigation marks the current route and mobile navigation is a modal sheet', async ({ page }) => {
  await page.goto('/progress');
  const primaryNavigation = page.getByRole('navigation', { name: 'Primary navigation' });
  if (await primaryNavigation.isVisible()) {
    await expect(primaryNavigation.getByRole('link', { name: 'Progress' })).toHaveAttribute('aria-current', 'page');
  } else {
    await expect(page.getByRole('button', { name: /Open navigation/i })).toBeVisible();
  }

  await page.setViewportSize({ width: 375, height: 667 });
  const trigger = page.getByRole('button', { name: /Open navigation/i });
  await expect(trigger).toBeVisible();
  await trigger.click();

  const sheet = page.getByRole('dialog', { name: /Navigate/i });
  await expect(sheet).toBeVisible();
  await expect(sheet.getByRole('link', { name: 'Progress' })).toHaveAttribute('aria-current', 'page');
  await expect(sheet.getByRole('button', { name: /Close navigation/i })).toBeFocused();

  await page.keyboard.press('Escape');
  await expect(sheet).toBeHidden();
  await expect(trigger).toBeFocused();
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

  if (await sidebar.isVisible()) {
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
  await expect(page.getByRole('button', { name: /Open navigation/i })).toBeVisible();
});

test('home presents an Elbi-style bento briefing around real AMAT course objects', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('.home-hero')).toBeVisible();
  await expect(page.locator('.home-bento')).toBeVisible();
  await expect(page.locator('.home-bento .bento-briefing')).toBeVisible();
  await expect(page.locator('.home-bento .bento-attention')).toBeVisible();
  await expect(page.locator('.home-bento .metric-card')).toHaveCount(3);
  await expect(page.getByTestId('home-study-snapshot')).toBeVisible();
  await expect(page.locator('.module-spotlight-grid')).toBeVisible();
  await expect(page.locator('.home-bento a[href="/study"]')).toBeVisible();
});

test('public surfaces obey the anti-vibecode hierarchy and status semantics', async ({ page }) => {
  test.setTimeout(120_000);
  const routes = [
    '/',
    '/study',
    '/course',
    '/practice',
    '/exam',
    '/progress',
    '/reference',
    '/saved',
    '/settings',
    '/modules/logic',
    '/labs/truth-table',
    '/lessons/logic/truth-tables',
    '/labs/annuity',
    '/labs/bayes',
    '/labs/bonds',
    '/labs/cashflow-timeline',
    '/labs/conditional-probability',
    '/labs/counting',
    '/labs/distribution',
    '/labs/equivalence',
    '/labs/formal-proof',
    '/labs/game-theory',
    '/labs/interest',
    '/labs/linear-programming',
    '/labs/logic-basics',
    '/labs/markov',
    '/labs/matrix-operations',
    '/labs/probability-simulation',
    '/labs/row-reduction',
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

test('shell honors media preferences and keeps mobile navigation keyboard-contained', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect.poll(() => page.evaluate(() => ({ reduced: matchMedia('(prefers-reduced-motion: reduce)').matches, transition: getComputedStyle(document.querySelector('.spotlight-card')!).transitionDuration }))).toEqual({ reduced: true, transition: '0s' });

  await page.emulateMedia({ reducedMotion: 'no-preference', forcedColors: 'active' });
  await page.reload();
  await expect.poll(() => page.evaluate(() => ({ forced: matchMedia('(forced-colors: active)').matches, icon: getComputedStyle(document.querySelector('.mobile-nav__icon')!).color }))).toEqual({ forced: true, icon: 'rgb(0, 0, 0)' });

  await page.goto('/progress');
  const trigger = page.getByRole('button', { name: /Open navigation/i });
  await trigger.click();
  const sheet = page.getByRole('dialog', { name: /Navigate/i });
  const close = sheet.getByRole('button', { name: /Close navigation/i });
  await close.focus();
  await page.keyboard.press('Tab');
  await expect.poll(() => page.evaluate(() => document.querySelector('#mobile-navigation')?.contains(document.activeElement))).toBe(true);
  await page.keyboard.press('Shift+Tab');
  await expect(close).toBeFocused();
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
  const input = palette.getByRole('textbox', { name: /Search skills/i });
  await expect(palette.getByRole('heading', { name: 'Study', exact: true })).toBeVisible();

  await input.fill('conditional');
  const result = palette.getByRole('link', { name: /Conditional Probability Lab/i }).first();
  await expect(result).toBeVisible();
  await page.keyboard.press('ArrowDown');
  await expect(result).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/labs\/conditional-probability/);
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
  for (const route of ['/', '/modules/logic', '/labs/annuity', '/labs/bayes', '/labs/bonds', '/labs/cashflow-timeline', '/labs/conditional-probability', '/labs/counting', '/labs/distribution', '/labs/equivalence', '/labs/formal-proof', '/labs/game-theory', '/labs/interest', '/labs/linear-programming', '/labs/logic-basics', '/labs/markov', '/labs/matrix-operations', '/labs/probability-simulation', '/labs/row-reduction', '/labs/truth-table', '/practice', '/exam', '/reference', '/progress']) {
    await page.goto(route);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(overflow, route).toBe(false);
  }
});

test('@core practice, mixed check, and reference surfaces render', async ({ page }) => {
  await page.goto('/practice');
  await expect(page.getByTestId('mixed-practice')).toBeVisible();
  await page.goto('/exam');
  await expect(page.getByTestId('mixed-exam')).toBeVisible();
  await page.goto('/reference');
  await expect(page.getByRole('heading', { name: /map of the symbols/i })).toBeVisible();
});

test('@core truth table mode switch is keyboard-accessible', async ({ page }) => {
  await page.goto('/labs/truth-table');
  const lab = page.getByTestId('truth-table-lab');
  await expect(lab).toHaveAttribute('data-hydrated', 'true');
  const modes = page.getByRole('group', { name: 'Truth table mode' });
  await expect(modes.getByRole('button', { name: 'Explore' })).toHaveAttribute('aria-pressed', 'true');
  await modes.getByRole('button', { name: 'Build' }).click();
  await expect(modes.getByRole('button', { name: 'Build' })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('region', { name: 'Guided truth table builder' })).toBeVisible();
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

test('practice focuses one question and advances after checking', async ({ page }) => {
  await page.goto('/practice');
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
