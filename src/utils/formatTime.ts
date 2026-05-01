// ---------------------------------------------------------------------------
// formatTime utilities
// ---------------------------------------------------------------------------

/**
 * Formats elapsed milliseconds as a stopwatch display string.
 *
 * - Under 1 hour  → "mm:ss"  (e.g. "00:00", "01:23", "10:05")
 * - 1 hour+       → "h:mm:ss" (e.g. "1:02:34")
 */
export function formatElapsed(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const mm = String(minutes).padStart(2, "0");
  const ss = String(seconds).padStart(2, "0");

  if (hours > 0) {
    return `${hours}:${mm}:${ss}`;
  }
  return `${mm}:${ss}`;
}

/**
 * Formats countdown milliseconds as a short rest-timer display string.
 *
 * Always "m:ss" (e.g. "1:30", "0:45", "0:05").
 */
export function formatCountdown(ms: number): string {
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  const ss = String(seconds).padStart(2, "0");
  return `${minutes}:${ss}`;
}
