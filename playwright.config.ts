import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright configuration for aniannoth-overview end-to-end tests.
 *
 * NOTE: @playwright/test is not yet installed as a dependency.
 * Before running these tests, install it with:
 *   npm install --save-dev @playwright/test
 * (This is a protected action — requires explicit user authorization.)
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',

  use: {
    baseURL: 'http://localhost:4173',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    // Port is fixed in vite.config.ts (strictPort) — same canonical 4173 used for
    // manual dev, so this never silently attaches to a different project's server.
    command: 'npm run dev',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
  },
})
