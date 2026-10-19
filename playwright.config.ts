import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright config for the Kaalvanta specs.
 *
 * `E2E_BASE_URL` is injected by test-suite/scripts/playwright-run.mjs (dev or
 * live target). Everything here is deliberately serial: the specs arrange and
 * clean up real rows.
 */
const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:3000";
const media = process.env.E2E_MEDIA === "on";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 45_000,
  expect: { timeout: 10_000 },
  reporter: [["list"], ["json", { outputFile: "test-results/report.json" }]],
  use: {
    baseURL,
    trace: media ? "on" : "retain-on-failure",
    video: media ? "on" : "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
