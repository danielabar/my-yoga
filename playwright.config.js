import { defineConfig } from "@playwright/test";
import { defineBddConfig } from "playwright-bdd";

const e2eTestDir = defineBddConfig({
  features: "tests/e2e/features/*.feature",
  steps: "tests/e2e/steps/*.js",
});

export default defineConfig({
  projects: [
    {
      name: "unit",
      testDir: "tests/unit",
    },
    {
      name: "e2e-chromium",
      testDir: e2eTestDir,
      retries: 3,
      use: {
        browserName: "chromium",
        baseURL: "http://localhost:3000",
        screenshot: "only-on-failure",
        trace: "retain-on-failure",
      },
    },
  ],
  webServer: {
    command: "npx serve . -l 3000",
    port: 3000,
    reuseExistingServer: !process.env.CI,
  },
});
