import { defineConfig, devices } from '@playwright/test';

const existingBaseURL = process.env.AMAT_E2E_BASE_URL;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['html', { open: 'never' }], ['list']] : 'list',
  use: {
    baseURL: existingBaseURL ?? 'http://127.0.0.1:4321',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure'
  },
  webServer: existingBaseURL ? undefined : {
    command: 'node node_modules/astro/bin/astro.mjs dev --host 127.0.0.1',
    cwd: 'apps/web',
    env: { ASTRO_DEV_BACKGROUND: '0' },
    url: 'http://127.0.0.1:4321',
    reuseExistingServer: !process.env.CI
  },
  projects: [
    { name: 'mobile-375', use: { browserName: 'chromium', viewport: { width: 375, height: 667 } } },
    { name: 'mobile-390', use: { browserName: 'chromium', viewport: { width: 390, height: 844 } } },
    { name: 'mobile-414', use: { browserName: 'chromium', viewport: { width: 414, height: 896 } } },
    { name: 'small-640', use: { browserName: 'chromium', viewport: { width: 640, height: 480 } } },
    { name: 'tablet-768', use: { browserName: 'chromium', viewport: { width: 768, height: 1024 } } },
    { name: 'tablet-1024', use: { browserName: 'chromium', viewport: { width: 1024, height: 768 } } },
    { name: 'desktop-1280', use: { browserName: 'chromium', viewport: { width: 1280, height: 720 } } },
    { name: 'desktop-1440', use: { browserName: 'chromium', viewport: { width: 1440, height: 900 } } },
    { name: 'desktop-1920', use: { browserName: 'chromium', viewport: { width: 1920, height: 1080 } } },
    { name: 'firefox-desktop', use: { browserName: 'firefox', viewport: { width: 1280, height: 720 } } },
    { name: 'webkit-mobile', use: { ...devices['iPhone 13'], browserName: 'webkit' } }
  ]
});
