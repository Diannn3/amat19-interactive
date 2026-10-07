import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/e2e', testMatch: 'pwa-release-lifecycle.spec.ts',
  fullyParallel: false, workers: 1, timeout: 90000,
  use: { baseURL: 'http://127.0.0.1:4367', browserName: 'chromium', serviceWorkers: 'allow', trace: 'retain-on-failure' },
  webServer: { command: 'node scripts/build-release-fixtures.mjs && node scripts/serve-release-fixtures.mjs', url: 'http://127.0.0.1:4367/release.json', timeout: 180000, reuseExistingServer: false },
});
