import { formatTime } from "../format-time.js";

/**
 * Update the progress bar and time display.
 *
 * @param {object} els — { bar, time }
 * @param {number} elapsedSec — seconds elapsed
 * @param {number} totalSec — total sequence duration in seconds
 */
export function updateProgress(els, elapsedSec, totalSec) {
  els.time.textContent = `${formatTime(elapsedSec)} / ${formatTime(totalSec)}`;
  els.bar.style.width = `${(elapsedSec / totalSec) * 100}%`;
}
