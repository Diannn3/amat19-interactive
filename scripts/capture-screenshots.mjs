import { chromium } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const outDir = path.resolve('artifacts/round2');
fs.mkdirSync(outDir, { recursive: true });

async function capture() {
  const browser = await chromium.launch();

  // Desktop context
  const desktop = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });

  // Mobile context
  const mobile = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
  });

  // 1. Home Desktop
  const pageHomeDesk = await desktop.newPage();
  await pageHomeDesk.goto('http://127.0.0.1:6767/');
  await pageHomeDesk.waitForLoadState('networkidle');
  await pageHomeDesk.screenshot({ path: path.join(outDir, 'home-desktop.png'), fullPage: false });
  await pageHomeDesk.screenshot({ path: path.join(outDir, 'home-desktop-full.png'), fullPage: true });

  // 2. Home Mobile
  const pageHomeMob = await mobile.newPage();
  await pageHomeMob.goto('http://127.0.0.1:6767/');
  await pageHomeMob.waitForLoadState('networkidle');
  await pageHomeMob.screenshot({ path: path.join(outDir, 'home-mobile.png'), fullPage: false });

  // 3. Course Desktop
  const pageCourseDesk = await desktop.newPage();
  await pageCourseDesk.goto('http://127.0.0.1:6767/course');
  await pageCourseDesk.waitForLoadState('networkidle');
  await pageCourseDesk.screenshot({ path: path.join(outDir, 'course-desktop.png'), fullPage: false });
  await pageCourseDesk.screenshot({ path: path.join(outDir, 'course-desktop-full.png'), fullPage: true });

  // 4. Course Mobile
  const pageCourseMob = await mobile.newPage();
  await pageCourseMob.goto('http://127.0.0.1:6767/course');
  await pageCourseMob.waitForLoadState('networkidle');
  await pageCourseMob.screenshot({ path: path.join(outDir, 'course-mobile.png'), fullPage: false });

  // 5. Logic Workbench Desktop
  const pageLogicDesk = await desktop.newPage();
  await pageLogicDesk.goto('http://127.0.0.1:6767/workbenches/logic');
  await pageLogicDesk.waitForLoadState('networkidle');
  await pageLogicDesk.screenshot({ path: path.join(outDir, 'logic-desktop.png'), fullPage: false });

  // 6. Logic Table Instrument
  const taskSelect = pageLogicDesk.getByLabel('Choose a task');
  if (await taskSelect.isVisible()) {
    await taskSelect.selectOption('table');
    await pageLogicDesk.waitForTimeout(400);
    await pageLogicDesk.screenshot({ path: path.join(outDir, 'logic-table-instrument.png'), fullPage: false });
  }

  await browser.close();
  console.log('Screenshots captured successfully in artifacts/round2');
}

capture().catch((err) => {
  console.error(err);
  process.exit(1);
});
