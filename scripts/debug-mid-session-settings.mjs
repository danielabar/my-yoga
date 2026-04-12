/**
 * Debug script: mid-session settings change.
 *
 * WHY: Changing voice/speed/pitch sliders during a session updates
 * localStorage but doesn't audibly change the speech output. This script
 * automates a browser session to capture console logs and determine
 * whether the getter reads stale DOM values, or the Web Speech API
 * ignores the updated rate/pitch.
 *
 * WHAT IT DOES:
 *   1. Launches Chromium via Playwright.
 *   2. Navigates to the practice page.
 *   3. Clicks Begin to start a session.
 *   4. After 2 seconds, changes the speed slider from 0.85 → 1.2
 *      (a large jump that should be clearly audible).
 *   5. Waits for 3 more poses to speak after the change.
 *   6. Prints all captured console logs tagged [session], [voice],
 *      and [getVoiceOpts] so we can see whether the getter picked up
 *      the new slider value.
 *
 * REQUIRES: Temporary console.log instrumentation in session.js,
 * voice.js, and practice/script.js (added in the step-6 debug pass).
 * Remove the instrumentation after diagnosis.
 *
 * HOW TO USE:
 *   1. Make sure the dev server is running: npm run dev
 *   2. Run: node scripts/debug-mid-session-settings.js
 *   3. Read the output — look for whether the rate value changes
 *      from 0.85 to 1.2 in the [getVoiceOpts] and [voice] logs
 *      after the slider change.
 */

import { chromium } from "playwright";

const BASE_URL = "http://localhost:3000";

async function run() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  const logs = [];
  page.on("console", (msg) => {
    const text = msg.text();
    if (
      text.includes("[session]") ||
      text.includes("[voice]") ||
      text.includes("[getVoiceOpts]")
    ) {
      logs.push(text);
      console.log(`  CONSOLE: ${text}`);
    }
  });

  console.log("1. Navigating to practice page...");
  await page.goto(BASE_URL);
  await page.waitForSelector("#btnStart");

  console.log("2. Clicking Begin...");
  await page.click("#btnStart");

  console.log("3. Waiting 2s for first pose to start speaking...");
  await page.waitForTimeout(2000);

  console.log("4. Opening settings disclosure...");
  await page.click(".settings summary");
  await page.waitForTimeout(300);

  console.log("5. Changing speed slider from 0.85 → 1.2...");
  const slider = page.locator("#rateSlider");
  await slider.fill("1.2");
  await slider.dispatchEvent("input");
  console.log(`   Slider value after fill: ${await slider.inputValue()}`);

  console.log("6. Waiting 30s for a few more poses to play...");
  await page.waitForTimeout(30000);

  console.log("\n=== COLLECTED LOGS ===");
  for (const log of logs) {
    console.log(log);
  }

  // Summarize findings
  console.log("\n=== ANALYSIS ===");
  const afterChange = logs.filter(
    (l) => logs.indexOf(l) > logs.findIndex((x) => x.includes("1.2"))
  );
  const getterLogs = afterChange.filter((l) => l.includes("[getVoiceOpts]"));
  const voiceLogs = afterChange.filter((l) => l.includes("[voice]"));

  if (getterLogs.length === 0) {
    console.log("FINDING: No [getVoiceOpts] logs after slider change — getter was not called for subsequent poses.");
  } else if (getterLogs.every((l) => l.includes("1.2"))) {
    console.log("FINDING: Getter reads updated DOM value (1.2). Change reaches speak().");
  } else {
    console.log("FINDING: Getter returns STALE value even after slider change.");
  }

  if (voiceLogs.length > 0 && voiceLogs.every((l) => l.includes("rate=1.2"))) {
    console.log("FINDING: speak() receives rate=1.2 — if speech still sounds slow, it's a Web Speech API limitation.");
  } else if (voiceLogs.length > 0) {
    console.log("FINDING: speak() does NOT receive rate=1.2 — value lost between getter and speak().");
  }

  console.log("\n7. Closing browser...");
  await browser.close();
}

run().catch((err) => {
  console.error("Script failed:", err);
  process.exit(1);
});
