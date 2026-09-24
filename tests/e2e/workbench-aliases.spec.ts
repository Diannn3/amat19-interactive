import { expect, test } from '@playwright/test';

const aliases = [
  ['/labs/logic-basics', '/workbenches/logic?mode=table'],
  ['/labs/truth-table', '/workbenches/logic?mode=table'],
  ['/labs/equivalence', '/lessons/logic/equivalence'],
  ['/labs/formal-proof', '/lessons/logic/formal-proof'],
  ['/labs/counting', '/lessons/probability/counting-models'],
  ['/labs/conditional-probability', '/workbenches/probability?view=conditional'],
  ['/labs/distribution', '/workbenches/probability?view=distribution'],
  ['/labs/probability-simulation', '/lessons/probability/simulation'],
  ['/labs/bayes', '/workbenches/probability?view=conditional'],
  ['/labs/interest', '/workbenches/finance?scenario=cashflows'],
  ['/labs/cashflow-timeline', '/workbenches/finance?scenario=cashflows'],
  ['/labs/annuity', '/workbenches/finance?scenario=annuity'],
  ['/labs/bonds', '/workbenches/finance?scenario=bond'],
  ['/labs/matrix-operations', '/workbenches/linear?goal=arithmetic'],
  ['/labs/row-reduction', '/workbenches/linear?goal=rref'],
  ['/labs/linear-programming', '/lessons/applications/graphical-lp'],
  ['/labs/game-theory', '/lessons/applications/game-theory'],
  ['/labs/markov', '/lessons/applications/markov'],
] as const;

function destinationPattern(destination: string) {
  return new RegExp(`${destination.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`);
}

test('retired lab URLs resolve to a canonical workbench or relevant lesson', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-1280');

  for (const [source, destination] of aliases) {
    await page.goto(source, { waitUntil: 'commit' }).catch((error: unknown) => {
      if (!(error instanceof Error) || !error.message.includes('net::ERR_ABORTED')) throw error;
    });
    await expect(page, source).toHaveURL(destinationPattern(destination));
    if (destination.startsWith('/workbenches/')) {
      await expect(page.getByTestId('workbench-shell'), source).toBeVisible();
      await expect(page.locator('[data-hydrated="true"]').first(), source).toBeVisible();
    } else {
      await expect(page.getByRole('heading', { level: 1 }), source).toBeVisible();
    }
  }
});

test('canonical view and task query parameters select their intended workbench surfaces', async ({ page }, testInfo) => {
  test.skip(!['mobile-375', 'desktop-1280'].includes(testInfo.project.name));

  await page.goto('/workbenches/probability?view=distribution');
  const probability = page.getByTestId('probability-model-builder');
  await expect(probability.getByRole('tab', { name: 'Distributions' })).toHaveAttribute('aria-selected', 'true');
  await expect(probability.getByRole('table', { name: 'Discrete probability distribution' })).toBeVisible();

  await page.goto('/workbenches/finance?scenario=annuity');
  await expect(page.getByRole('combobox', { name: 'Choose a task' })).toHaveValue('annuity');

  await page.goto('/workbenches/linear?goal=inverse');
  await expect(page.getByTestId('row-operations-coach')).toHaveAttribute('data-goal', 'inverse');
});

test('legacy argument links retain the selected Logic tab', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-1280');
  await page.goto('/labs/truth-table?mode=argument');
  await expect(page).toHaveURL(/\/workbenches\/logic\?mode=argument$/);
  await expect(page.getByRole('tab', { name: 'Test an Argument' })).toHaveAttribute('aria-selected', 'true');
});