import { Given, When, Then, expect } from "./fixtures.js";

Given("I am on the practice page", async ({ page }) => {
  await page.goto("/");
  await page.waitForSelector("#btnStart");
});

When("I open the settings disclosure", async ({ page }) => {
  const details = page.locator(".settings");
  if (!(await details.getAttribute("open") !== null)) {
    await page.click(".settings summary");
  }
});

When("I change the speed slider to {string}", async ({ page }, value) => {
  const slider = page.locator("#rateSlider");
  await slider.fill(value);
  await slider.dispatchEvent("input");
});

When("I reload the page", async ({ page }) => {
  await page.reload();
  await page.waitForSelector("#btnStart");
});

When("I click reset to defaults", async ({ page }) => {
  await page.click("#settingsReset");
});

When("I click Begin", async ({ page }) => {
  await page.click("#btnStart");
});

Then("the speed slider value should be {string}", async ({ page }, value) => {
  await expect(page.locator("#rateSlider")).toHaveValue(value);
});

Then("the settings disclosure should be collapsed", async ({ page }) => {
  const details = page.locator(".settings");
  await expect(details).not.toHaveAttribute("open", "");
});
