// Playwright config — Loop 3 FR-4 live smoke.
// Runs the Vite dev server with VITE_USE_MSW=false so the browser hits the
// real Railway backend. Separate from the default config so MSW-on remains
// the canonical CI path.

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: /flow-a-live\.spec\.ts$/,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium-live',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'node scripts/dev-live.mjs',
    url: 'http://localhost:5173',
    timeout: 60_000,
    reuseExistingServer: false,
  },
});
