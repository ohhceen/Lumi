import { defineConfig, devices } from "@playwright/test";

/**
 * E2E tests run against a LOCAL Supabase stack (`npx supabase start`) and a
 * production build of the app. See README → "Running tests".
 */
export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [["list"]],
  globalSetup: "./tests/e2e/global-setup.ts",
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://127.0.0.1:3100",
    trace: "off",
    locale: "id-ID",
    timezoneId: "Asia/Makassar",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] }, testMatch: /responsive\.spec\.ts/ },
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : { command: "npx next start -p 3100", url: "http://127.0.0.1:3100/login", reuseExistingServer: true, timeout: 120_000 },
});
