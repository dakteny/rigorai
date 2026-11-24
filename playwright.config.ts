import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 60_000,
  expect: { timeout: 20_000 },
  reporter: "line",
  outputDir: "/tmp/browser/rigor-auth-e2e/results",
  use: {
    baseURL: process.env["E2E_BASE_URL"] || "http://localhost:8080",
    browserName: "chromium",
    headless: true,
    trace: "off",
    screenshot: "off",
    video: "off",
  },
  projects: [
    { name: "desktop", use: { viewport: { width: 1280, height: 1800 } } },
    { name: "mobile", use: { viewport: { width: 479, height: 515 } } },
  ],
});
