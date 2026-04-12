import { test, expect } from "@playwright/test";
import { readFileSync } from "fs";
import { join } from "path";
import { parseSequence } from "../../js/sequence-loader.js";

const goodFixture = JSON.parse(
  readFileSync(join(process.cwd(), "config/test/sequences/evening-fixture.json"), "utf-8"),
);
const missingNameFixture = JSON.parse(
  readFileSync(join(process.cwd(), "config/test/sequences/missing-name.json"), "utf-8"),
);

test.describe("parseSequence", () => {
  test("parses a valid sequence", () => {
    const seq = parseSequence(goodFixture);
    expect(seq.title).toBe("Test Sequence");
    expect(seq.poses).toHaveLength(3);
    expect(seq.poses[0].id).toBe("test-arrive");
  });

  test("rejects non-object input", () => {
    expect(() => parseSequence(null)).toThrow(/object/i);
    expect(() => parseSequence([])).toThrow(/object/i);
    expect(() => parseSequence("nope")).toThrow(/object/i);
  });

  test("rejects a sequence missing the 'poses' array", () => {
    expect(() => parseSequence({ title: "T" })).toThrow(/poses/i);
  });

  test("rejects a sequence with an empty 'poses' array", () => {
    expect(() => parseSequence({ poses: [] })).toThrow(/empty/i);
  });

  test("rejects a pose missing 'name'", () => {
    expect(() => parseSequence(missingNameFixture)).toThrow(/missing.*name/i);
  });

  test("rejects a pose with non-numeric holdSeconds", () => {
    expect(() =>
      parseSequence({
        poses: [{ id: "x", name: "X", holdSeconds: "thirty", breath: "slow", speech: "..." }],
      }),
    ).toThrow(/holdSeconds/i);
  });

  test("rejects a pose with zero or negative holdSeconds", () => {
    expect(() =>
      parseSequence({
        poses: [{ id: "x", name: "X", holdSeconds: 0, breath: "slow", speech: "..." }],
      }),
    ).toThrow(/holdSeconds/i);
  });

  test("rejects a pose with invalid breath pattern", () => {
    expect(() =>
      parseSequence({
        poses: [{ id: "x", name: "X", holdSeconds: 10, breath: "yelling", speech: "..." }],
      }),
    ).toThrow(/breath/i);
  });

  test("rejects a pose with non-string speech", () => {
    expect(() =>
      parseSequence({
        poses: [{ id: "x", name: "X", holdSeconds: 10, breath: "slow", speech: 42 }],
      }),
    ).toThrow(/speech/i);
  });

  test("accepts all three valid breath patterns", () => {
    for (const breath of ["slow", "guided", "natural"]) {
      const seq = parseSequence({
        poses: [{ id: "x", name: "X", holdSeconds: 10, breath, speech: "..." }],
      });
      expect(seq.poses[0].breath).toBe(breath);
    }
  });

  test("rejects the old 'duration' field with a clear error", () => {
    expect(() =>
      parseSequence({
        poses: [{ id: "x", name: "X", duration: 10, breath: "slow", speech: "..." }],
      }),
    ).toThrow(/old.*duration.*holdSeconds/i);
  });
});
