import { expect, test } from '@playwright/test';

const workbenches = [
  {
    route: '/workbenches/logic',
    testId: 'logic-proof-workbench',
    defaultValue: 'translate',
    query: '/workbenches/logic?mode=proof',
    queryValue: 'proof',
    options: [
      ['translate', 'Translate a statement'],
      ['table', 'Truth table'],
      ['compare', 'Compare expressions'],
      ['argument', 'Test an argument'],
      ['proof', 'Build a proof'],
    ],
  },
  {
    route: '/workbenches/probability',
    testId: 'probability-model-builder',
    defaultValue: 'counting',
    query: '/workbenches/probability?mode=bayes',
    queryValue: 'bayes',
    options: [
      ['counting', 'Count outcomes'],
      ['conditioning', 'Condition on an event'],
      ['bayes', 'Apply Bayes'],
      ['verify', 'Run a seeded check'],
    ],
  },
  {
    route: '/workbenches/finance',
    testId: 'money-timeline-workbench',
    defaultValue: 'cashflows',
    query: '/workbenches/finance?scenario=bond',
    queryValue: 'bond',
    options: [
      ['cashflows', 'Move cash flows'],
      ['annuity', 'Value an annuity'],
      ['bond', 'Price a bond'],
    ],
  },
  {
    route: '/workbenches/linear',
    testId: 'row-operations-coach',
    defaultValue: 'system',
    query: '/workbenches/linear?goal=inverse',
    queryValue: 'inverse',
    options: [
      ['system', 'Solve a system'],
      ['rref', 'Reach RREF'],
      ['inverse', 'Find an inverse'],
      ['arithmetic', 'Matrix arithmetic'],
    ],
  },
  {
    route: '/workbenches/applications',
    testId: 'optimization-strategy-workbench',
    defaultValue: 'linear',
    query: '/workbenches/applications?mode=advanced',
    queryValue: 'advanced',
    options: [
      ['linear', 'Graphical linear program'],
      ['game', 'Zero-sum game'],
      ['advanced', 'Simplex and Markov'],
    ],
  },
] as const;

async function setPersistedTask(
  page: import('@playwright/test').Page,
  draft: { labId: string; contentVersion: string; state: Record<string, unknown> },
) {
  await page.evaluate(async ({ labId, contentVersion, state }) => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('amat19-local');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error('Could not open the local database.'));
    });
    await new Promise<void>((resolve, reject) => {
      const writeTransaction = database.transaction('labDrafts', 'readwrite');
      writeTransaction.oncomplete = () => resolve();
      writeTransaction.onerror = () => reject(writeTransaction.error ?? new Error('Could not update the local draft.'));
      writeTransaction.objectStore('labDrafts').put({
        labId,
        contentVersion,
        updatedAt: new Date().toISOString(),
        state,
      });
    });
    database.close();
  }, draft);
}

test.describe('Focused workbench task picker', () => {
  test('each workbench exposes one compact picker with a foundation default', async ({ page }) => {
    for (const workbench of workbenches) {
      await page.goto(workbench.route);
      const picker = page.getByRole('combobox', { name: 'Choose a task' });
      await expect(picker, workbench.route).toHaveCount(1);
      await expect(picker, workbench.route).toHaveValue(workbench.defaultValue);

      for (const [value, label] of workbench.options) {
        await expect(picker.locator(`option[value="${value}"]`), `${workbench.route} ${value}`).toHaveText(label);
      }
    }
  });

  test('query-selected tasks open the matching surface without changing the public query contract', async ({ page }) => {
    for (const workbench of workbenches) {
      await page.goto(workbench.query);
      await expect(page.getByRole('combobox', { name: 'Choose a task' }), workbench.query).toHaveValue(workbench.queryValue);
    }
  });

  test('switching tasks removes the previous mathematical surface', async ({ page }) => {
    await page.goto('/workbenches/logic?mode=table');
    await expect(page.locator('.logic-workbench__table-scroll')).toBeVisible();

    await page.getByRole('combobox', { name: 'Choose a task' }).selectOption('translate');

    await expect(page.locator('.logic-workbench__table-scroll')).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'Turn controlled language into symbols.' })).toBeVisible();
  });

  test('switching tasks clears stale feedback and result disclosure', async ({ page }) => {
    await page.goto('/workbenches/probability');
    const picker = page.getByRole('combobox', { name: 'Choose a task' });
    await page.getByLabel('Counting model').selectOption('permutation');
    await page.getByRole('button', { name: 'Check model' }).click();
    await expect(page.locator('[data-probability-result]')).toBeVisible();

    await picker.selectOption('conditioning');
    await picker.selectOption('counting');
    await expect(page.locator('[data-probability-result]')).toHaveCount(0);
    await expect(page.locator('[data-counting-feedback]')).toHaveText('');
  });

  test('group labels keep the picker scannable without restoring a mode bar', async ({ page }) => {
    await page.goto('/workbenches/probability');
    const picker = page.getByRole('combobox', { name: 'Choose a task' });
    await expect(picker.locator('optgroup')).toHaveCount(3);
    await expect(picker.locator('optgroup').first()).toHaveAttribute('label', 'Start here');
    await expect(picker.locator('optgroup').nth(1)).toHaveAttribute('label', 'Model events');
    await expect(picker.locator('optgroup').nth(2)).toHaveAttribute('label', 'Check evidence');
    await expect(page.locator('.probability-builder__mode')).toHaveCount(0);
  });

  test('valid saved tasks persist, while invalid saved task values return to foundations', async ({ page }) => {
    test.setTimeout(90_000);
    await page.goto('/workbenches/logic');
    const picker = page.getByRole('combobox', { name: 'Choose a task' });
    await picker.selectOption('proof');
    await page.waitForTimeout(400);
    const continuityPage = await page.context().newPage();
    await continuityPage.goto('/workbenches/logic');
    await expect(continuityPage.getByRole('combobox', { name: 'Choose a task' })).toHaveValue('proof');
    await continuityPage.close();
    await page.goto('/');

    const invalidCases = [
      {
        route: '/workbenches/logic',
        fallback: 'translate',
        draft: {
          labId: 'workbench.logic-proof',
          contentVersion: '1',
          state: {
            mode: '__invalid_task__', expression: 'P -> Q', left: 'P -> Q', right: '~Q -> ~P',
            premises: 'P -> Q\nQ', conclusion: 'P', translationPromptId: 'if-then', translationAnswer: '',
          },
        },
      },
      {
        route: '/workbenches/probability',
        fallback: 'counting',
        draft: {
          labId: 'workbench.probability-model',
          contentVersion: '1',
          state: {
            mode: '__invalid_task__', orderMatters: true, repetitionAllowed: false, n: 8, r: 3,
            cells: [20, 10, 5, 15], condition: 'a-given-b', trials: 10_000, seed: 'amat19-verification',
          },
        },
      },
      {
        route: '/workbenches/finance',
        fallback: 'cashflows',
        draft: {
          labId: 'finance.money-timeline',
          contentVersion: '1',
          state: {
            scenario: '__invalid_task__', flows: [{ id: 1, time: '0', amount: '-2000' }, { id: 2, time: '3', amount: '2500' }],
            cashflowRate: '0.05', focalDate: '0', annuityPayment: '1500', annuityRate: '0.01', annuityPeriods: '12',
            annuityTiming: 'immediate', annuityDirection: 'present', bondFace: '1000', bondCouponRate: '0.05',
            bondRedemption: '1000', bondYield: '0.04', bondPeriods: '10',
          },
        },
      },
      {
        route: '/workbenches/linear',
        fallback: 'system',
        draft: {
          labId: 'linear.row-operations-coach',
          contentVersion: '2',
          state: {
            goal: '__invalid_task__', sourceRaw: '1 1 3\n1 -1 1', currentRaw: '1 1 3\n1 -1 1',
            history: [], arithmeticRightRaw: '2 1\n1 2', arithmeticOperation: 'add',
          },
        },
      },
      {
        route: '/workbenches/applications',
        fallback: 'linear',
        draft: {
          labId: 'workbench.optimization-strategy',
          contentVersion: '1',
          state: {
            mode: '__invalid_task__', cx: '3', cy: '2', sense: 'max',
            constraints: [{ a: '1', b: '1', relation: '<=', c: '4' }, { a: '1', b: '0', relation: '<=', c: '3' }, { a: '0', b: '1', relation: '<=', c: '2' }],
            game: [['4', '0'], ['1', '3']], markov: ['4/5', '1/5', '2/5', '3/5'], initialA: '1', markovSteps: 3,
          },
        },
      },
    ] as const;
    for (const item of invalidCases) {
      await setPersistedTask(page, item.draft);
      const probe = await page.context().newPage();
      await probe.goto(item.route);
      await expect(probe.getByRole('combobox', { name: 'Choose a task' }), item.route).toHaveValue(item.fallback);
      await probe.close();
    }
  });

  for (const viewport of [{ width: 375, height: 667 }, { width: 640, height: 480 }]) {
    test(`first mathematical action stays above the mobile dock at ${viewport.width}x${viewport.height}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      for (const workbench of workbenches) {
        await page.goto(workbench.route);
        const root = page.getByTestId(workbench.testId);
        const action = workbench.route.includes('/finance')
          ? root.locator('[data-primary-controls] input').first()
          : root.locator('[data-primary-control]').first();
        await expect(action, workbench.route).toBeVisible();
        const metrics = await root.evaluate((element) => {
          const candidate = element.querySelector<HTMLElement>('[data-primary-controls] input, [data-primary-control]');
          const dock = document.querySelector<HTMLElement>('.mobile-nav');
          const candidateBox = candidate?.getBoundingClientRect();
          const dockBox = dock?.getBoundingClientRect();
          return { bottom: candidateBox?.bottom ?? Infinity, dockTop: dockBox?.top ?? window.innerHeight };
        });
        expect(metrics.bottom, workbench.route).toBeLessThanOrEqual(metrics.dockTop);
      }
    });
  }
});
