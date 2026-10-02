/**
 * Formats duration in seconds into mm:ss format
 * @param {number|string} seconds
 * @returns {string} Formatted time string (e.g., "3:45", "0:00")
 */
export function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00';
  const total = Math.floor(Number(seconds));
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export default formatTime;
