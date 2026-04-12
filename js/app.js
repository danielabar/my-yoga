import { start as startRouter } from "./router.js";
import { start as startWakeLock } from "./wake-lock.js";

document.addEventListener("DOMContentLoaded", () => {
  startWakeLock();
  startRouter();
});
