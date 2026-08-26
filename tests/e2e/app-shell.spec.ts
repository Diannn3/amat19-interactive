import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('@core course shell exposes Logic, Probability, and local progress routes', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /See the rule/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /Logic/ }).first()).toBeVisible();
  await expect(page.getByRole('link', { name: /Probability/ }).first()).toBeVisible();
  await page.goto('/progress');
  await expect(page.getByTestId('progress-summary')).toBeVisible();
  await expect(page.getByTestId('data-manager')).toBeVisible();
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

test('mobile routes do not create page-level horizontal overflow', async ({ page }) => {
  for (const route of ['/', '/modules/logic', '/labs/truth-table', '/labs/formal-proof', '/labs/counting', '/labs/conditional-probability', '/progress']) {
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

test('@core mixed course check withholds explanations until submission', async ({ page }) => {
  await page.goto('/exam');
  const exam = page.getByTestId('mixed-exam');
  await expect(exam.getByText('Correct.', { exact: true })).toHaveCount(0);
  await exam.getByRole('radio').first().check();
  await exam.getByRole('button', { name: /Submit all answers/i }).click();
  await expect(exam.locator('.mixed-practice__score')).toBeVisible();
  await expect(exam.locator('.mixed-question__result').first()).toBeVisible();
});
