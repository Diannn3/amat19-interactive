import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('@core logic basics gives conceptual feedback', async ({ page }) => {
  await page.goto('/labs/logic-basics');
  const lab = page.getByTestId('logic-basics-lab');
  await lab.getByRole('radio', { name: 'Proposition', exact: true }).click();
  await lab.getByRole('button', { name: 'Check answer' }).click();
  await expect(lab.getByText(/declarative claim/i)).toBeVisible();
});

test('@core equivalence predicts then reveals truth-vector evidence', async ({ page }) => {
  await page.goto('/labs/equivalence');
  const lab = page.getByTestId('equivalence-lab');
  await lab.getByRole('radio', { name: 'Equivalent', exact: true }).check();
  await lab.getByRole('button', { name: 'Check prediction' }).click();
  await expect(lab.getByText('Equivalent.', { exact: true })).toBeVisible();

  await lab.getByLabel('Expression B').fill('Q -> P');
  await lab.getByRole('radio', { name: 'Not equivalent' }).check();
  await lab.getByRole('button', { name: 'Check prediction' }).click();
  await expect(lab.getByText('First counterexample')).toBeVisible();
});

test('@core direct formal proof checks exact named rules and reaches QED', async ({ page }) => {
  await page.goto('/labs/formal-proof');
  const lab = page.getByTestId('formal-proof-lab');
  await lab.getByLabel('Next proof statement').fill('~A');
  await lab.getByLabel('Proof rule').selectOption('MT');
  await lab.getByLabel('Cited line numbers').fill('1, 2');
  await lab.getByRole('button', { name: /Add checked line/i }).click();
  await expect(lab.getByRole('row').nth(4)).toContainText('Valid');

  await lab.getByLabel('Next proof statement').fill('~A & C');
  await lab.getByLabel('Proof rule').selectOption('CJ');
  await lab.getByLabel('Cited line numbers').fill('4, 3');
  await lab.getByRole('button', { name: /Add checked line/i }).click();
  await expect(lab.getByText(/QED/)).toBeVisible();
});

test('logic lab routes are free of serious automated accessibility violations', async ({ page }) => {
  for (const route of ['/labs/logic-basics', '/labs/equivalence', '/labs/formal-proof']) {
    await page.goto(route);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations.filter((violation) => ['critical', 'serious'].includes(violation.impact ?? '')), route).toEqual([]);
  }
});
