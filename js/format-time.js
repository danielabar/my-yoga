/**
 * Format a duration in seconds as "M:SS".
 *
 * Examples:
 *   formatTime(0)   → "0:00"
 *   formatTime(45)  → "0:45"
 *   formatTime(65)  → "1:05"
 *   formatTime(960) → "16:00"
 *
 * Accepts fractional seconds (floors them). Negative input is treated as zero
 * — the practice runner never emits negatives but a rounding quirk could land
 * there for a microsecond and we'd rather show "0:00" than "-1:59".
 */
export function formatTime(seconds) {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${m}:${String(rem).padStart(2, "0")}`;
}
