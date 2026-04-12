import { test, expect } from "@playwright/test";
import { get, getAll, set, reset } from "../../js/settings.js";

/**
 * settings.js reads localStorage as a global and hydrates lazily on first
 * get(). Between tests we call reset() to clear the in-memory cache, then
 * swap in a fresh localStorage stub so the next get() re-hydrates from
 * the new stub.
 */

const KEY = "myYoga:settings:v1";

function makeStorage(initial = {}) {
  const store = { ...initial };
  return {
    getItem: (k) => (k in store ? store[k] : null),
    setItem: (k, v) => {
      store[k] = String(v);
    },
    removeItem: (k) => {
      delete store[k];
    },
    _store: store,
  };
}

test.describe("settings", () => {
  test.beforeEach(() => {
    reset();
    globalThis.localStorage = makeStorage();
  });

  test.afterEach(() => {
    delete globalThis.localStorage;
  });

  // ── First load (no storage) ──

  test("get() returns defaults when storage is empty", () => {
    expect(get("voiceURI")).toBeNull();
    expect(get("rate")).toBe(0.85);
    expect(get("pitch")).toBe(1.0);
  });

  test("get() with unknown key returns undefined", () => {
    expect(get("nonexistent")).toBeUndefined();
  });

  // ── Round-trip ──

  test("set then get returns the new value", () => {
    set("rate", 1.1);
    expect(get("rate")).toBe(1.1);
  });

  test("set voiceURI then get returns it", () => {
    set("voiceURI", "Samantha");
    expect(get("voiceURI")).toBe("Samantha");
  });

  // ── Validation: out-of-range ──

  test("out-of-range rate falls back to default", () => {
    set("rate", 99);
    expect(get("rate")).toBe(0.85);
  });

  test("negative rate falls back to default", () => {
    set("rate", -1);
    expect(get("rate")).toBe(0.85);
  });

  // ── Validation: wrong type ──

  test("string rate falls back to default", () => {
    set("rate", "fast");
    expect(get("rate")).toBe(0.85);
  });

  // ── Validation: voiceURI edge cases ──

  test("empty string voiceURI falls back to default (null)", () => {
    set("voiceURI", "");
    expect(get("voiceURI")).toBeNull();
  });

  test("non-string voiceURI falls back to default", () => {
    set("voiceURI", 42);
    expect(get("voiceURI")).toBeNull();
  });

  // ── Unknown key ──

  test("set with unknown key is silently ignored", () => {
    set("theme", "dark");
    expect(get("theme")).toBeUndefined();
  });

  // ── getAll ──

  test("getAll returns a copy that doesn't affect the cache", () => {
    const all = getAll();
    all.rate = 999;
    expect(get("rate")).toBe(0.85);
  });

  // ── reset ──

  test("reset clears storage and cache, subsequent get returns defaults", () => {
    set("rate", 1.2);
    expect(get("rate")).toBe(1.2);
    reset();
    expect(get("rate")).toBe(0.85);
    expect(globalThis.localStorage._store[KEY]).toBeUndefined();
  });

  // ── Stale / partial storage ──

  test("extra unknown key in storage is ignored, known keys still load", () => {
    reset();
    globalThis.localStorage = makeStorage({
      [KEY]: JSON.stringify({ rate: 1.1, unknownFutureSetting: true }),
    });
    expect(get("rate")).toBe(1.1);
    expect(get("pitch")).toBe(1.0);
    expect(get("unknownFutureSetting")).toBeUndefined();
  });

  test("missing field in storage uses default for that field", () => {
    reset();
    globalThis.localStorage = makeStorage({
      [KEY]: JSON.stringify({ voiceURI: "Karen" }),
    });
    expect(get("voiceURI")).toBe("Karen");
    expect(get("rate")).toBe(0.85);
    expect(get("pitch")).toBe(1.0);
  });

  // ── Corrupted storage ──

  test("corrupted JSON returns all defaults, no throw", () => {
    reset();
    globalThis.localStorage = makeStorage({ [KEY]: "{not valid json!!!" });
    expect(get("rate")).toBe(0.85);
    expect(get("pitch")).toBe(1.0);
    expect(get("voiceURI")).toBeNull();
  });

  // ── localStorage throwing ──

  test("localStorage.getItem throwing returns defaults", () => {
    reset();
    const storage = makeStorage();
    storage.getItem = () => {
      throw new Error("SecurityError");
    };
    globalThis.localStorage = storage;
    expect(get("rate")).toBe(0.85);
  });

  test("localStorage.setItem throwing still updates in-memory cache", () => {
    // First hydrate with working storage so cache is populated
    get("rate");
    // Now break setItem
    globalThis.localStorage.setItem = () => {
      throw new Error("QuotaExceededError");
    };
    set("rate", 1.1);
    expect(get("rate")).toBe(1.1);
  });
});
