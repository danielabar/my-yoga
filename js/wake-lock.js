/**
 * Wake lock manager.
 *
 * Tracks at most one screen wake lock for the page. The contract is:
 *
 *   - Call start() once at app boot to register browser event listeners.
 *   - Call acquire() when you want the screen to stay awake.
 *     Idempotent: multiple acquires while held are no-ops.
 *   - Call release() when you're done. Always awaited internally so the OS
 *     sees an explicit release before any subsequent acquire.
 *
 * Self-managed browser events (registered by start()):
 *
 *   - 'visibilitychange'  → if the tab returns to visible AND we still want
 *                           the lock, re-acquire (the OS auto-releases on hide)
 *   - 'pagehide'          → release the lock (best chance to do so cleanly
 *                           before the tab is buried on iOS Safari)
 *
 * The split between `wantsLock` (intent) and `lock` (current sentinel) is
 * deliberate: it lets the visibility handler distinguish "session over, do
 * nothing" from "session active, re-acquire". just-breathe conflates these
 * and ends up in a state where the OS won't sleep the phone after stop.
 *
 * Design: docs/architecture.md §"Wake-lock design"
 */

let lock = null;
let wantsLock = false;

async function tryAcquire() {
  if (!("wakeLock" in navigator)) return;
  if (lock) return;
  if (document.visibilityState !== "visible") return;
  try {
    lock = await navigator.wakeLock.request("screen");
    lock.addEventListener("release", () => {
      lock = null;
    });
  } catch {
    // NotAllowedError: insecure context, permission denied, or document hidden.
  }
}

async function tryRelease() {
  if (!lock) return;
  const sentinel = lock;
  lock = null;
  try {
    await sentinel.release();
  } catch {
    // Already released or never held — not actionable.
  }
}

export async function acquire() {
  wantsLock = true;
  await tryAcquire();
}

export async function release() {
  wantsLock = false;
  await tryRelease();
}

export function isHeld() {
  return lock !== null;
}

/**
 * Register browser event listeners. Call once from app.js at boot.
 * Separated from module-level evaluation so unit tests can import this
 * module in plain Node without needing a DOM.
 */
export function start() {
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && wantsLock) {
      tryAcquire();
    }
  });

  window.addEventListener("pagehide", () => {
    if (lock) {
      const sentinel = lock;
      lock = null;
      sentinel.release().catch(() => {});
    }
  });
}

/** @internal Test-only: reset module state between tests. */
export function _reset() {
  lock = null;
  wantsLock = false;
}
