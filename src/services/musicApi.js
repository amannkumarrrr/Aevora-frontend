/**
 * Music API Service
 * Centralized service for all music streaming API calls
 */
// Resolves backend API URL:
// 1. Production: Uses import.meta.env.VITE_API_URL (defaults to https://aevora-backend.vercel.app)
// 2. Local Development: Defaults to 'http://localhost:5000'
function getApiBaseUrl() {
  const envUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL;

  const rawUrl = envUrl || (
    import.meta.env.DEV ? 'http://localhost:5000' : 'https://aevora-backend.vercel.app'
  );

  const clean = rawUrl.trim().replace(/\/+$/, '');
  return clean.endsWith('/api') ? clean : `${clean}/api`;
}

const API_BASE_URL = getApiBaseUrl();

/**
 * Searches for songs by name, artist, or query
 * @param {string} query
 * @returns {Promise<Array>} List of song objects
 */
export async function searchSongs(query) {
  if (!query || !query.trim()) return [];

  try {
    const url = `${API_BASE_URL}/search?q=${encodeURIComponent(query.trim())}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`);
    }
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('API searchSongs error:', error);
    throw error;
  }
}

/**
 * Fetches song details by URL or Song ID
 * @param {string} songUrlOrId
 * @returns {Promise<Object>} Song metadata object
 */
export async function getSong(songUrlOrId) {
  if (!songUrlOrId) return null;

  try {
    const url = `${API_BASE_URL}/song?query=${encodeURIComponent(songUrlOrId)}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch song details (${response.status})`);
    }
    const data = await response.json();
    return data.data || null;
  } catch (error) {
    console.error('API getSong error:', error);
    throw error;
  }
}

/**
 * Fetches lyrics on demand for a song
 * @param {string} songUrlOrId
 * @returns {Promise<string|null>} Lyrics text or null
 */
export async function getLyrics(songUrlOrId) {
  if (!songUrlOrId) return null;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

    const url = `${API_BASE_URL}/lyrics?query=${encodeURIComponent(songUrlOrId)}`;
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      return null;
    }
    const data = await response.json();
    if (!data || !data.lyrics || typeof data.lyrics !== 'string' || !data.lyrics.trim() || data.lyrics.trim() === 'null') {
      return null;
    }
    return data.lyrics.trim();
  } catch (error) {
    console.warn('API getLyrics error or timeout:', error.message);
    return null;
  }
}

/**
 * Fetches playlist songs
 * @param {string} playlistUrlOrId
 * @returns {Promise<Array>} List of songs
 */
export async function getPlaylist(playlistUrlOrId) {
  if (!playlistUrlOrId) return [];

  try {
    const url = `${API_BASE_URL}/playlist?query=${encodeURIComponent(playlistUrlOrId)}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch playlist (${response.status})`);
    }
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('API getPlaylist error:', error);
    throw error;
  }
}

/**
 * Fetches album songs
 * @param {string} albumUrlOrId
 * @returns {Promise<Array>} List of songs
 */
export async function getAlbum(albumUrlOrId) {
  if (!albumUrlOrId) return [];

  try {
    const url = `${API_BASE_URL}/album?query=${encodeURIComponent(albumUrlOrId)}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch album (${response.status})`);
    }
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('API getAlbum error:', error);
    throw error;
  }
}

/**
 * Fetches trending & popular songs for the homepage
 * @returns {Promise<Array>} List of trending songs
 */
export async function getTrendingSongs() {
  try {
    const url = `${API_BASE_URL}/trending`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch trending songs (${response.status})`);
    }
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('API getTrendingSongs error:', error);
    return [];
  }
}
