import { chromium } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const port = process.env.PORT || 6768;
const outDir = path.resolve('artifacts/audit');
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
  await pageHomeDesk.goto(`http://127.0.0.1:${port}/`);
  await pageHomeDesk.waitForLoadState('networkidle');
  await pageHomeDesk.screenshot({ path: path.join(outDir, 'home-desktop.png'), fullPage: false });
  await pageHomeDesk.screenshot({ path: path.join(outDir, 'home-desktop-full.png'), fullPage: true });

  // 2. Home Mobile
  const pageHomeMob = await mobile.newPage();
  await pageHomeMob.goto(`http://127.0.0.1:${port}/`);
  await pageHomeMob.waitForLoadState('networkidle');
  await pageHomeMob.screenshot({ path: path.join(outDir, 'home-mobile.png'), fullPage: false });

  // 3. Course Desktop
  const pageCourseDesk = await desktop.newPage();
  await pageCourseDesk.goto(`http://127.0.0.1:${port}/course`);
  await pageCourseDesk.waitForLoadState('networkidle');
  await pageCourseDesk.screenshot({ path: path.join(outDir, 'course-desktop.png'), fullPage: false });
  await pageCourseDesk.screenshot({ path: path.join(outDir, 'course-desktop-full.png'), fullPage: true });

  // 4. Course Mobile
  const pageCourseMob = await mobile.newPage();
  await pageCourseMob.goto(`http://127.0.0.1:${port}/course`);
  await pageCourseMob.waitForLoadState('networkidle');
  await pageCourseMob.screenshot({ path: path.join(outDir, 'course-mobile.png'), fullPage: false });

  // 5. Logic Workbench Desktop
  const pageLogicDesk = await desktop.newPage();
  await pageLogicDesk.goto(`http://127.0.0.1:${port}/workbenches/logic`);
  await pageLogicDesk.waitForLoadState('networkidle');
  await pageLogicDesk.screenshot({ path: path.join(outDir, 'logic-desktop.png'), fullPage: false });

  // 6. Logic Table Instrument
  const taskSelect = pageLogicDesk.getByLabel('Choose a task');
  if (await taskSelect.isVisible()) {
    await taskSelect.selectOption('table');
    await pageLogicDesk.waitForTimeout(400);
    await pageLogicDesk.screenshot({ path: path.join(outDir, 'logic-table-instrument.png'), fullPage: false });
  }

  // 7. Logic Mobile Table
  const pageLogicMob = await mobile.newPage();
  await pageLogicMob.goto(`http://127.0.0.1:${port}/workbenches/logic`);
  await pageLogicMob.waitForLoadState('networkidle');
  const taskSelectMob = pageLogicMob.getByLabel('Choose a task');
  if (await taskSelectMob.isVisible()) {
    await taskSelectMob.selectOption('table');
    await pageLogicMob.waitForTimeout(400);
    await pageLogicMob.screenshot({ path: path.join(outDir, 'logic-mobile-table.png'), fullPage: false });
  }

  // 8. Probability Workbench
  const pageProbDesk = await desktop.newPage();
  await pageProbDesk.goto(`http://127.0.0.1:${port}/workbenches/probability`);
  await pageProbDesk.waitForLoadState('networkidle');
  await pageProbDesk.screenshot({ path: path.join(outDir, 'probability-desktop.png'), fullPage: false });

  // 9. Finance Workbench
  const pageFinDesk = await desktop.newPage();
  await pageFinDesk.goto(`http://127.0.0.1:${port}/workbenches/finance`);
  await pageFinDesk.waitForLoadState('networkidle');
  await pageFinDesk.screenshot({ path: path.join(outDir, 'finance-desktop.png'), fullPage: false });

  // 10. Linear Workbench
  const pageLinDesk = await desktop.newPage();
  await pageLinDesk.goto(`http://127.0.0.1:${port}/workbenches/linear`);
  await pageLinDesk.waitForLoadState('networkidle');
  await pageLinDesk.screenshot({ path: path.join(outDir, 'linear-desktop.png'), fullPage: false });

  // 11. Applications Workbench
  const pageAppDesk = await desktop.newPage();
  await pageAppDesk.goto(`http://127.0.0.1:${port}/workbenches/applications`);
  await pageAppDesk.waitForLoadState('networkidle');
  await pageAppDesk.screenshot({ path: path.join(outDir, 'applications-desktop.png'), fullPage: false });

  // 12. Study / Resources Hub
  const pageStudyDesk = await desktop.newPage();
  await pageStudyDesk.goto(`http://127.0.0.1:${port}/study`);
  await pageStudyDesk.waitForLoadState('networkidle');
  await pageStudyDesk.screenshot({ path: path.join(outDir, 'study-desktop.png'), fullPage: false });

  await browser.close();
  console.log(`Screenshots captured successfully in ${outDir}`);
}

capture().catch((err) => {
  console.error(err);
  process.exit(1);
});
