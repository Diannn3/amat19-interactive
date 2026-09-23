import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: 'pwa-production.spec.ts',
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['html', { open: 'never' }], ['list']] : 'list',
  use: {
    baseURL: 'http://127.0.0.1:4321',
    browserName: 'chromium',
    viewport: { width: 1280, height: 720 },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    serviceWorkers: 'allow'
  },
  webServer: {
    command: 'node node_modules/astro/bin/astro.mjs preview --host 127.0.0.1',
    cwd: 'apps/web',
    env: { ASTRO_PREVIEW_BACKGROUND: '0' },
    url: 'http://127.0.0.1:4321',
    reuseExistingServer: false
  }
});
