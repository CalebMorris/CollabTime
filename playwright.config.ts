import { defineConfig, devices } from 'playwright/test'

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:5173/CollabTime/'
const isLocalhost = ['localhost', '127.0.0.1'].includes(new URL(BASE_URL).hostname)

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  webServer: isLocalhost
    ? {
        command: 'npm run dev',
        url: 'http://localhost:5173/CollabTime/',
        reuseExistingServer: !process.env.CI,
        timeout: 30_000,
      }
    : undefined,
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
})
