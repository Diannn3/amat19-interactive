import { expect, test } from '@playwright/test';

test('canonical workbench URLs select the matching model view', async ({ page }) => {
  await page.goto('/workbenches/logic?mode=argument');
  const logic = page.getByTestId('logic-proof-workbench');
  await expect(logic.getByRole('tab', { name: 'Test an Argument' })).toHaveAttribute('aria-selected', 'true');

  await page.goto('/workbenches/probability?view=distribution');
  const probability = page.getByTestId('probability-model-builder');
  await expect(probability.getByRole('tab', { name: 'Distributions' })).toHaveAttribute('aria-selected', 'true');

  await page.goto('/workbenches/finance?scenario=bond');
  const finance = page.getByTestId('money-timeline-workbench');
  await expect(finance.getByRole('combobox', { name: 'Choose a task' })).toHaveValue('bond');

  await page.goto('/workbenches/linear?goal=inverse');
  await expect(page.getByTestId('row-operations-coach')).toHaveAttribute('data-goal', 'inverse');
});

test('Money Timeline keeps one accessible picker for its three focused models', async ({ page }) => {
  await page.goto('/workbenches/finance');
  const finance = page.getByTestId('money-timeline-workbench');
  const picker = finance.getByRole('combobox', { name: 'Choose a task' });

  await expect(finance).toHaveAttribute('data-hydrated', 'true');
  await expect(picker).toHaveValue('cashflows');
  await expect(picker.locator('option')).toHaveText(['Move cash flows', 'Value an annuity', 'Price a bond']);

  await picker.selectOption('annuity');
  await expect(picker).toHaveValue('annuity');
  await page.reload();
  await expect(finance.getByRole('combobox', { name: 'Choose a task' })).toHaveValue('annuity');
});

test('Money Timeline rejects an invalid persisted model and honors a valid URL override', async ({ page }) => {
  await page.goto('/workbenches/finance');
  await expect(page.getByTestId('money-timeline-workbench')).toHaveAttribute('data-hydrated', 'true');
  await page.evaluate(async () => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('amat19-local');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error('Could not open local storage.'));
    });
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction('labDrafts', 'readwrite');
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error('Could not update the local draft.'));
      transaction.objectStore('labDrafts').put({
        labId: 'finance.money-timeline',
        contentVersion: '1',
        updatedAt: new Date().toISOString(),
        state: {
          scenario: '__invalid_task__',
          flows: [{ id: 1, time: '0', amount: '-2000' }, { id: 2, time: '3', amount: '2500' }],
          cashflowRate: '0.05', focalDate: '0', annuityPayment: '1500', annuityRate: '0.01', annuityPeriods: '12',
          annuityTiming: 'immediate', annuityDirection: 'present', bondFace: '1000', bondCouponRate: '0.05',
          bondRedemption: '1000', bondYield: '0.04', bondPeriods: '10',
        },
      });
    });
    database.close();
  });

  await page.reload();
  const picker = page.getByTestId('money-timeline-workbench').getByRole('combobox', { name: 'Choose a task' });
  await expect(picker).toHaveValue('cashflows');
  await page.goto('/workbenches/finance?scenario=bond');
  await expect(picker).toHaveValue('bond');
});

for (const viewport of [{ width: 375, height: 667 }, { width: 640, height: 480 }]) {
  test(`first mathematical control stays reachable above the mobile dock at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    const workbenches = [
      { route: '/workbenches/logic', testId: 'logic-proof-workbench', selector: '[data-primary-control]' },
      { route: '/workbenches/probability', testId: 'probability-model-builder', selector: '[role="tab"]' },
      { route: '/workbenches/finance', testId: 'money-timeline-workbench', selector: '[data-primary-controls] input, [data-primary-controls] select, [data-primary-controls] button' },
      { route: '/workbenches/linear', testId: 'row-operations-coach', selector: '[data-primary-control]' },
    ];

    for (const workbench of workbenches) {
      await page.goto(workbench.route);
      const root = page.getByTestId(workbench.testId);
      const action = root.locator(workbench.selector).first();
      await expect(root).toHaveAttribute('data-hydrated', 'true');
      await expect(action, workbench.route).toBeVisible();
      await action.scrollIntoViewIfNeeded();

      const actionBox = await action.boundingBox();
      const dockBox = await page.locator('.mobile-nav').boundingBox();
      expect(actionBox, workbench.route).not.toBeNull();
      expect(dockBox, workbench.route).not.toBeNull();
      expect(actionBox!.height, workbench.route).toBeGreaterThanOrEqual(44);
      expect(actionBox!.y + actionBox!.height, workbench.route).toBeLessThanOrEqual(dockBox!.y);

      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
      expect(overflow, workbench.route).toBe(false);
    }
  });
}