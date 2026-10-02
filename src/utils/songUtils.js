/**
 * Returns a robust unique key for a song.
 * Uses songid or id or perma_url or url. Never identifies only by title.
 * @param {object} song
 * @returns {string} Unique song key
 */
export function getSongKey(song) {
  if (!song) return '';
  return String(song.songid || song.id || song.perma_url || song.url || '').trim();
}

export default {
  getSongKey,
};
