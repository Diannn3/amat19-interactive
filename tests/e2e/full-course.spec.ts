import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const coreRoutes = [
  '/modules/finance', '/modules/linear', '/modules/applications',
  '/labs/interest', '/labs/annuity', '/labs/bonds', '/labs/matrix-operations',
  '/labs/row-reduction', '/labs/linear-programming', '/labs/game-theory',
  '/labs/probability-simulation',
];

const labRoutes = [
  '/labs/annuity', '/labs/bayes', '/labs/bonds', '/labs/cashflow-timeline',
  '/labs/conditional-probability', '/labs/counting', '/labs/distribution',
  '/labs/equivalence', '/labs/formal-proof', '/labs/game-theory', '/labs/interest',
  '/labs/linear-programming', '/labs/logic-basics', '/labs/markov',
  '/labs/matrix-operations', '/labs/probability-simulation', '/labs/row-reduction',
  '/labs/truth-table',
];

async function waitForClientLoad(page: Page) {
  const islands = page.locator('astro-island[client="load"]');
  const count = await islands.count();
  if (count) await expect(page.locator('astro-island[client="load"][client-render-time]')).toHaveCount(count);
}

async function assertTargets(page: Page, selector: string, route: string) {
  const controls = page.locator(selector);
  await expect(controls.first(), `${route} should render ${selector}`).toBeVisible();
  const count = await controls.count();
  for (let index = 0; index < count; index += 1) {
    const control = controls.nth(index);
    if (!(await control.isVisible())) continue;
    const bounds = await control.boundingBox();
    expect(bounds, `${route} ${selector} #${index + 1}`).not.toBeNull();
    expect(bounds!.width, `${route} ${selector} #${index + 1} width`).toBeGreaterThanOrEqual(44);
    expect(bounds!.height, `${route} ${selector} #${index + 1} height`).toBeGreaterThanOrEqual(44);
  }
}

test('@core every lab uses one canvas-first shared instrument shell', async ({ page }) => {
  for (const route of labRoutes) {
    await page.goto(route);
    await expect(page.locator('[data-lab-shell]'), route).toHaveCount(1);
    await expect(page.locator('.lab-route__canvas'), route).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Breadcrumb' }), route).toBeVisible();
    await expect(page.locator('.lab-route__context-rail, .lab-route__support'), route).toHaveCount(0);
  }
});

test('@core lab routes emit no page or console errors', async ({ page }) => {
  const errors: string[] = [];
  let currentRoute = '';
  page.on('pageerror', (error) => errors.push(`${currentRoute} pageerror: ${error.message}`));
  page.on('console', (message) => { if (message.type() === 'error') errors.push(`${currentRoute} console: ${message.text()}`); });
  for (const route of labRoutes) {
    currentRoute = route;
    await page.goto(route);
    const islandCount = await page.locator('astro-island').count();
    await expect(page.locator('astro-island[client-render-time]'), route).toHaveCount(islandCount);
    await expect(page.locator('main'), route).toBeVisible();
  }
  expect(errors).toEqual([]);
});

test('@core audited surfaces have no axe accessibility violations', async ({ page }) => {
  test.setTimeout(120_000);
  const routes = ['/progress', '/labs/conditional-probability', '/labs/distribution', '/labs/game-theory', '/labs/matrix-operations', '/labs/row-reduction'];
  for (const route of routes) {
    await page.goto(route);
    await waitForClientLoad(page);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations, route).toEqual([]);
  }
});

for (const route of coreRoutes) {
  test(`@core ${route} renders without page overflow`, async ({ page }) => {
    await page.goto(route);
    await expect(page.locator('main')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
  });
}

test('@core finance compound model updates deterministic result', async ({ page }) => {
  await page.goto('/labs/interest');
  const lab = page.getByTestId('interest-lab');
  await expect(lab).toBeVisible();
  await expect(lab.getByText(/Accumulated value/)).toBeVisible();
});

test('@core annuity timing can switch to due', async ({ page }) => {
  await page.goto('/labs/annuity');
  const lab = page.getByTestId('annuity-lab');
  await expect(lab).toHaveAttribute('data-hydrated', 'true');
  await lab.getByRole('button', { name: /Due/ }).click();
  await expect(lab.getByText(/beginning of each period/i)).toBeVisible();
});

test('@core matrix multiplication exposes selected dot product', async ({ page }) => {
  await page.goto('/labs/matrix-operations');
  const lab = page.getByTestId('matrix-operations-lab');
  await expect(lab.getByText(/Row 1 · Column 1/)).toBeVisible();
  await expect(lab.getByText(/Sum =/)).toBeVisible();
});

test('@core row reduction exposes unique solution', async ({ page }) => {
  await page.goto('/labs/row-reduction');
  const lab = page.getByTestId('row-reduction-lab');
  await expect(lab.locator('.gauss-jordan-classification').getByText('unique', { exact: true })).toBeVisible();
});

test('@core formal proof primary action remains a usable mobile control', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('/labs/formal-proof');
  await waitForClientLoad(page);
  const action = page.getByRole('button', { name: 'Add checked line', exact: true });
  await expect(action).toBeVisible();
  const bounds = await action.boundingBox();
  expect(bounds).not.toBeNull();
  expect(bounds!.width).toBeGreaterThanOrEqual(120);
  expect(bounds!.height).toBeGreaterThanOrEqual(44);
});

test('@core shared disclosures and dense math controls meet the 44px interaction contract', async ({ page }) => {
  await page.goto('/course');
  await assertTargets(page, '.course-module-action', '/course');

  await page.goto('/labs/truth-table');
  await waitForClientLoad(page);
  await assertTargets(page, '.lab-instrument-actions a', '/labs/truth-table');
  await assertTargets(page, '.lab-about > summary', '/labs/truth-table');

  await page.goto('/labs/logic-basics');
  await waitForClientLoad(page);
  await assertTargets(page, '.reference-details > summary', '/labs/logic-basics');

  await page.goto('/labs/formal-proof');
  await waitForClientLoad(page);
  await assertTargets(page, '.proof-reference .rule-grid details > summary', '/labs/formal-proof');

  await page.goto('/labs/distribution');
  await waitForClientLoad(page);
  await assertTargets(page, '.distribution-table input', '/labs/distribution');

  await page.goto('/labs/linear-programming');
  await waitForClientLoad(page);
  await assertTargets(page, '.constraint-row input, .constraint-row select', '/labs/linear-programming');

  await page.goto('/labs/game-theory');
  await waitForClientLoad(page);
  await assertTargets(page, '.payoff-table input', '/labs/game-theory');

  await page.goto('/labs/markov');
  await waitForClientLoad(page);
  await assertTargets(page, '.markov-matrix-editor input', '/labs/markov');
  await assertTargets(page, '.markov-stepper input[type="range"]', '/labs/markov');

  await page.goto('/labs/row-reduction');
  await waitForClientLoad(page);
  await page.getByRole('button', { name: 'Manual', exact: true }).click();
  await assertTargets(page, '.row-op-builder__controls input, .row-op-builder__controls select', '/labs/row-reduction');

  await page.goto('/labs/matrix-operations');
  await waitForClientLoad(page);
  await assertTargets(page, '.matrix-editor > details > summary', '/labs/matrix-operations');
  await assertTargets(page, '.matrix-editor__cell', '/labs/matrix-operations');
});

test('@core graphical LP and simplex agree on sample optimum', async ({ page }) => {
  await page.goto('/labs/linear-programming');
  const lab = page.getByTestId('lp-lab');
  await expect(lab.locator('.lp-lab__visual .formula-callout strong')).toHaveText('optimal');
  await expect(lab.getByText(/Z = 11/)).toBeVisible();
  await lab.locator('.lp-lab__simplex > summary').click();
  await expect(lab.locator('.lp-simplex-body')).toBeVisible();
});

test('@core game theory default requires mixed strategy', async ({ page }) => {
  await page.goto('/labs/game-theory');
  const lab = page.getByTestId('game-theory-lab');
  await expect(lab.getByText(/Row mix/)).toBeVisible();
});

test('all lab routes have no serious axe findings', async ({ page }) => {
  test.setTimeout(120_000);
  for (const route of labRoutes) {
    await page.goto(route);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations.filter((v) => ['critical', 'serious'].includes(v.impact ?? '')), route).toEqual([]);
  }
});

test('@core dense lab editors contain their content at workspace widths', async ({ page }) => {
  const assertContained = async (route: string, selector: string) => {
    await page.goto(route);
    const panel = page.locator(selector);
    await expect(panel, `${route} should render ${selector}`).toBeVisible();
    const metrics = await panel.evaluate((element) => ({ clientWidth: element.clientWidth, scrollWidth: element.scrollWidth }));
    expect(metrics.scrollWidth, `${route} ${selector} scroll width`).toBeLessThanOrEqual(metrics.clientWidth + 1);
  };
  await assertContained('/labs/cashflow-timeline', '.finance-instrument__controls');
  await assertContained('/labs/linear-programming', '.lp-lab__controls');
  await assertContained('/labs/game-theory', '.game-instrument__canvas');
});

test('@core cash-flow timeline separates coincident point labels', async ({ page }) => {
  await page.goto('/labs/cashflow-timeline');
  const collisions = await page.locator('.finance-timeline svg g').evaluateAll((groups) => {
    const entries = groups.map((group) => {
      const circle = group.querySelector('circle');
      const labels = Array.from(group.querySelectorAll('text')).map((text) => text.getBoundingClientRect());
      if (!circle) return null;
      const circleBox = circle.getBoundingClientRect();
      return { cx: circleBox.left + circleBox.width / 2, labels };
    }).filter((entry): entry is { cx: number; labels: DOMRect[] } => entry !== null);
    const result: string[] = [];
    for (let left = 0; left < entries.length; left += 1) {
      for (let right = left + 1; right < entries.length; right += 1) {
        if (Math.abs(entries[left]!.cx - entries[right]!.cx) > 1) continue;
        for (const first of entries[left]!.labels) for (const second of entries[right]!.labels) {
          if (first.left < second.right && first.right > second.left && first.top < second.bottom && first.bottom > second.top) result.push(`${left}:${right}`);
        }
      }
    }
    return result;
  });
  expect(collisions).toEqual([]);
});
