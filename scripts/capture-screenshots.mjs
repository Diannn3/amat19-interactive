import { chromium } from '@playwright/test';
import path from 'node:path';
import fs from 'node:fs';

const port = process.env.PORT || 6768;
const outDir = path.resolve('artifacts/audit');
fs.mkdirSync(outDir, { recursive: true });

const routes = [
  ['home', '/'],
  ['course', '/course'],
  ['study', '/study'],
  ['progress', '/progress'],
  ['reference', '/reference'],
  ['saved', '/saved'],
  ['settings', '/settings'],
  ['exam', '/exam'],
  ['module-logic', '/modules/logic'],
  ['module-probability', '/modules/probability'],
  ['module-finance', '/modules/finance'],
  ['module-linear', '/modules/linear'],
  ['module-applications', '/modules/applications'],
  ['lesson-truth-tables', '/lessons/logic/truth-tables'],
  ['logic', '/workbenches/logic'],
  ['probability', '/workbenches/probability'],
  ['finance', '/workbenches/finance'],
  ['linear', '/workbenches/linear'],
  ['applications', '/workbenches/applications'],
];

async function captureRoute(context, viewportName, name, route, fullPage = false) {
  const page = await context.newPage();
  await page.goto(`http://127.0.0.1:${port}${route}`);
  await page.waitForLoadState('networkidle');
  await page.screenshot({
    path: path.join(outDir, `${name}-${viewportName}${fullPage ? '-full' : ''}.png`),
    fullPage,
  });
  await page.close();
}

async function capture() {
  const browser = await chromium.launch();

  const desktop = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 1,
  });

  const mobile = await browser.newContext({
    viewport: { width: 375, height: 667 },
    deviceScaleFactor: 1,
    isMobile: true,
  });

  const darkDesktop = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 1,
  });
  await darkDesktop.addInitScript(() => {
    localStorage.setItem('amat19-theme', 'dark');
  });

  const darkMobile = await browser.newContext({
    viewport: { width: 375, height: 667 },
    deviceScaleFactor: 1,
    isMobile: true,
  });
  await darkMobile.addInitScript(() => {
    localStorage.setItem('amat19-theme', 'dark');
  });

  for (const [name, route] of routes) {
    await captureRoute(desktop, 'desktop-1280', name, route);
    await captureRoute(mobile, 'mobile-375', name, route);
  }

  for (const [name, route] of [
    ['home', '/'],
    ['course', '/course'],
    ['study', '/study'],
    ['progress', '/progress'],
    ['settings', '/settings'],
  ]) {
    await captureRoute(desktop, 'desktop-1280', name, route, true);
  }

  for (const [name, route] of [
    ['home', '/'],
    ['settings', '/settings'],
    ['logic', '/workbenches/logic'],
    ['probability', '/workbenches/probability'],
  ]) {
    await captureRoute(darkDesktop, 'desktop-1280-dark', name, route);
    await captureRoute(darkMobile, 'mobile-375-dark', name, route);
  }

  // Keep one deterministic interaction-state capture for the densest workbench.
  const logic = await desktop.newPage();
  await logic.goto(`http://127.0.0.1:${port}/workbenches/logic`);
  await logic.waitForLoadState('networkidle');
  const taskSelect = logic.getByLabel('Choose a task');
  if (await taskSelect.isVisible()) {
    await taskSelect.selectOption('table');
    await logic.waitForTimeout(250);
    await logic.screenshot({
      path: path.join(outDir, 'logic-table-desktop-1280.png'),
      fullPage: false,
    });
  }
  await logic.close();

  await browser.close();
  console.log(`Screenshots captured successfully in ${outDir}`);
}

capture().catch((error) => {
  console.error(error);
  process.exit(1);
});
