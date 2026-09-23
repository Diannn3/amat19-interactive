import { chromium } from '@playwright/test';
import { mkdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const repoRoot = fileURLToPath(new URL('..', import.meta.url));
const iconSource = await readFile(resolve(repoRoot, 'apps/web/public/icon.svg'), 'utf8');
const outputDirectory = resolve(repoRoot, 'apps/web/public/icons');
await mkdir(outputDirectory, { recursive: true });

const icons = [
  { name: 'icon-192.png', size: 192 },
  { name: 'icon-512.png', size: 512 },
  { name: 'icon-maskable-512.png', size: 512 },
];

const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage();
  for (const icon of icons) {
    await page.setViewportSize({ width: icon.size, height: icon.size });
    await page.setContent(`<style>html,body{margin:0;width:${icon.size}px;height:${icon.size}px;overflow:hidden}svg{display:block;width:${icon.size}px;height:${icon.size}px}</style>${iconSource}`);
    await page.locator('svg').screenshot({ path: resolve(outputDirectory, icon.name), animations: 'disabled' });
  }
} finally {
  await browser.close();
}
