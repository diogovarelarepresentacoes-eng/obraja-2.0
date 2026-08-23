import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    actionTimeout: 10000,
  },
  projects: [
    {
      name: 'marketplace',
      use: { ...devices['Desktop Chrome'], baseURL: 'http://localhost:3000' },
      testMatch: '**/marketplace/**/*.spec.ts',
    },
    {
      name: 'supplier',
      use: { ...devices['Desktop Chrome'], baseURL: 'http://localhost:3003' },
      testMatch: '**/supplier/**/*.spec.ts',
    },
  ],
  webServer: [
    {
      command: 'pnpm --filter @obraja/web-marketplace dev',
      url: 'http://localhost:3000',
      reuseExistingServer: true,
      timeout: 120000,
    },
    {
      command: 'pnpm --filter @obraja/web-supplier dev',
      url: 'http://localhost:3003',
      reuseExistingServer: true,
      timeout: 120000,
    },
  ],
});
