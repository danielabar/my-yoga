import { test, expect } from "@playwright/test";
import { pickDefaultVoice } from "../../js/voice.js";

test.describe("pickDefaultVoice", () => {
  test("prefers Samantha when available", () => {
    const voices = [
      { name: "Daniel", lang: "en-GB" },
      { name: "Samantha", lang: "en-US" },
    ];
    expect(pickDefaultVoice(voices).name).toBe("Samantha");
  });

  test("prefers Karen over unknown voices", () => {
    const voices = [
      { name: "Alex", lang: "en-US" },
      { name: "Karen", lang: "en-AU" },
    ];
    expect(pickDefaultVoice(voices).name).toBe("Karen");
  });

  test("falls back to the first voice if no preferred name matches", () => {
    const voices = [
      { name: "Robot", lang: "en-US" },
      { name: "Alien", lang: "en-GB" },
    ];
    expect(pickDefaultVoice(voices).name).toBe("Robot");
  });

  test("returns null for empty list", () => {
    expect(pickDefaultVoice([])).toBeNull();
  });

  test("returns null for undefined", () => {
    expect(pickDefaultVoice(undefined)).toBeNull();
  });
});
