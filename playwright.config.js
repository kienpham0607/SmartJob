import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/ui',
  globalSetup: './tests/ui/setup.js',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 45000,
  expect: { timeout: 10000 },
  reporter: 'list',
  outputDir: '.local/ui-results',
  use: {
    channel: process.env.BROWSER_CHANNEL || 'chrome',
    headless: true,
    viewport: { width: 1366, height: 900 },
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
});
