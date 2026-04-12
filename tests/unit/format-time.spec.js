import { test, expect } from "@playwright/test";
import { formatTime } from "../../js/format-time.js";

test.describe("formatTime", () => {
  test("zero seconds", () => {
    expect(formatTime(0)).toBe("0:00");
  });

  test("under a minute", () => {
    expect(formatTime(45)).toBe("0:45");
  });

  test("pads single-digit seconds", () => {
    expect(formatTime(65)).toBe("1:05");
  });

  test("exactly one minute", () => {
    expect(formatTime(60)).toBe("1:00");
  });

  test("full session", () => {
    expect(formatTime(960)).toBe("16:00");
  });

  test("rounds down fractional seconds", () => {
    expect(formatTime(30.7)).toBe("0:30");
  });

  test("treats negative input as zero", () => {
    expect(formatTime(-5)).toBe("0:00");
  });
});
