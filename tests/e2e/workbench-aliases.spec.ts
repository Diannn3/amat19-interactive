import { expect, test } from '@playwright/test';

const aliases = [
  ['/labs/logic-basics', '/workbenches/logic?mode=table'],
  ['/labs/truth-table', '/workbenches/logic?mode=table'],
  ['/labs/equivalence', '/workbenches/logic?mode=compare'],
  ['/labs/formal-proof', '/workbenches/logic?mode=proof'],
  ['/labs/counting', '/workbenches/probability?mode=counting'],
  ['/labs/conditional-probability', '/workbenches/probability?mode=conditioning'],
  ['/labs/distribution', '/workbenches/probability?mode=conditioning'],
  ['/labs/probability-simulation', '/workbenches/probability?mode=verify'],
  ['/labs/bayes', '/workbenches/probability?mode=bayes'],
  ['/labs/interest', '/workbenches/finance?scenario=cashflows'],
  ['/labs/cashflow-timeline', '/workbenches/finance?scenario=cashflows'],
  ['/labs/annuity', '/workbenches/finance?scenario=annuity'],
  ['/labs/bonds', '/workbenches/finance?scenario=bond'],
  ['/labs/matrix-operations', '/workbenches/linear?goal=rref'],
  ['/labs/row-reduction', '/workbenches/linear?goal=system'],
  ['/labs/linear-programming', '/workbenches/applications?mode=linear'],
  ['/labs/game-theory', '/workbenches/applications?mode=game'],
  ['/labs/markov', '/workbenches/applications?mode=advanced'],
] as const;

test('all retired lab URLs resolve to a focused workbench', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-1280');

  for (const [source, destination] of aliases) {
    await page.goto(source);
    await expect(page, source).toHaveURL(new RegExp(`${destination.replace(/[?]/g, '\\?')}$`));
    await expect(page.getByTestId('workbench-shell'), source).toBeVisible();
  }
});

test('route parameters select the intended workbench tool', async ({ page }, testInfo) => {
  test.skip(!['mobile-375', 'desktop-1280'].includes(testInfo.project.name));

  await page.goto('/workbenches/logic?mode=compare');
  await expect(page.getByRole('combobox', { name: 'Choose a task' })).toHaveValue('compare');

  await page.goto('/workbenches/probability?mode=bayes');
  await expect(page.getByRole('combobox', { name: 'Choose a task' })).toHaveValue('bayes');

  await page.goto('/workbenches/finance?scenario=annuity');
  await expect(page.getByRole('combobox', { name: 'Choose a task' })).toHaveValue('annuity');

  await page.goto('/workbenches/linear?goal=inverse');
  await expect(page.getByRole('combobox', { name: 'Choose a task' })).toHaveValue('inverse');

  await page.goto('/workbenches/applications?mode=game');
  await expect(page.getByRole('combobox', { name: 'Choose a task' })).toHaveValue('game');
});

test('legacy argument links retain their selected task', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-1280');
  await page.goto('/labs/truth-table?mode=argument');
  await expect(page).toHaveURL(/\/workbenches\/logic\?mode=argument$/);
  await expect(page.getByRole('combobox', { name: 'Choose a task' })).toHaveValue('argument');
});
