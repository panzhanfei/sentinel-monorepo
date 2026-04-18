import { defineConfig, devices } from "@playwright/test";

const baseURL =
  process.env.E2E_BASE_URL?.replace(/\/$/, "") ?? "http://127.0.0.1:3000";

const startLocalServer = process.env.E2E_SKIP_WEB_SERVER !== "1";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: startLocalServer
    ? {
        command:
          "pnpm --filter main-next exec next dev --hostname 127.0.0.1 --port 3000",
        cwd: "..",
        url: `${baseURL}/`,
        reuseExistingServer: !process.env.CI,
        timeout: 180_000,
        stdout: "pipe",
        stderr: "pipe",
      }
    : undefined,
});
