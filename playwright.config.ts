import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  use: {
    baseURL: 'http://127.0.0.1:4321',
    trace: 'retain-on-failure'
  },
  webServer: {
    command: 'pnpm --filter @amat19/web dev --host 127.0.0.1',
    url: 'http://127.0.0.1:4321',
    reuseExistingServer: !process.env.CI
  },
  projects: [
    { name: 'mobile-375', use: { viewport: { width: 375, height: 667 } } },
    { name: 'small-640', use: { viewport: { width: 640, height: 480 } } },
    { name: 'tablet-768', use: { viewport: { width: 768, height: 1024 } } },
    { name: 'desktop-1280', use: { viewport: { width: 1280, height: 720 } } },
    { name: 'desktop-1920', use: { viewport: { width: 1920, height: 1080 } } }
  ]
});
