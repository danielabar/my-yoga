import { test, expect } from "@playwright/test";
import { acquire, release, isHeld, start, _reset } from "../../js/wake-lock.js";

let releaseCalls;
let requestCalls;
let releaseListenerCallback;
let mockVisibilityState;
let visibilityHandlers;
let pagehideHandlers;

function makeMockSentinel() {
  return {
    release: async () => {
      releaseCalls.push(Date.now());
    },
    addEventListener: (event, fn) => {
      if (event === "release") releaseListenerCallback = fn;
    },
  };
}

test.describe("wake-lock", () => {
  test.beforeEach(() => {
    releaseCalls = [];
    requestCalls = [];
    releaseListenerCallback = null;
    mockVisibilityState = "visible";
    visibilityHandlers = [];
    pagehideHandlers = [];

    global.document = {
      get visibilityState() {
        return mockVisibilityState;
      },
      addEventListener: (event, fn) => {
        if (event === "visibilitychange") visibilityHandlers.push(fn);
      },
    };
    global.window = {
      addEventListener: (event, fn) => {
        if (event === "pagehide") pagehideHandlers.push(fn);
      },
    };
    global.navigator = {
      wakeLock: {
        request: async () => {
          requestCalls.push(Date.now());
          return makeMockSentinel();
        },
      },
    };

    _reset();
    start();
  });

  test("acquire requests a screen wake lock", async () => {
    await acquire();
    expect(isHeld()).toBe(true);
    expect(requestCalls).toHaveLength(1);
  });

  test("release awaits the underlying release()", async () => {
    await acquire();
    await release();
    expect(isHeld()).toBe(false);
    expect(releaseCalls).toHaveLength(1);
  });

  test("acquire is idempotent", async () => {
    await acquire();
    await acquire();
    expect(isHeld()).toBe(true);
    expect(requestCalls).toHaveLength(1);
  });

  test("release with nothing held is a no-op", async () => {
    await expect(release()).resolves.toBeUndefined();
    expect(releaseCalls).toHaveLength(0);
  });

  test("acquire swallows errors when the API throws", async () => {
    global.navigator.wakeLock.request = async () => {
      throw new Error("not allowed");
    };
    await expect(acquire()).resolves.toBeUndefined();
    expect(isHeld()).toBe(false);
  });

  test("does not re-acquire on visibility change after release was called", async () => {
    await acquire();
    await release();
    mockVisibilityState = "visible";
    visibilityHandlers.forEach((fn) => fn());
    await Promise.resolve();
    expect(isHeld()).toBe(false);
  });

  test("re-acquires on visibility return when still wanted", async () => {
    await acquire();
    // Simulate OS auto-release
    if (releaseListenerCallback) releaseListenerCallback();
    expect(isHeld()).toBe(false);
    // Tab comes back
    mockVisibilityState = "visible";
    visibilityHandlers.forEach((fn) => fn());
    await Promise.resolve();
    expect(isHeld()).toBe(true);
  });
});
