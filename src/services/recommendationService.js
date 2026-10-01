/**
 * Recommendation Service for Echo Music
 * Delivers curated, recognizable Hindi & Punjabi recommendations with personalized affinity.
 */

import { searchSongs } from './musicApi';

// Top recognized Hindi artist seeds
export const HINDI_SEEDS = [
  'Arijit Singh',
  'Pritam',
  'Vishal Mishra',
  'Shreya Ghoshal',
  'Anuv Jain',
  'Jubin Nautiyal',
  'Atif Aslam',
  'Darshan Raval',
  'Armaan Malik',
  'Sachin-Jigar',
];

// Top recognized Punjabi artist seeds
export const PUNJABI_SEEDS = [
  'Karan Aujla',
  'Diljit Dosanjh',
  'Sidhu Moose Wala',
  'AP Dhillon',
  'Shubh',
  'Talwiinder',
  'Ammy Virk',
  'Navaan Sandhu',
  'Jordan Sandhu',
  'Gur Sidhu',
  'B Praak',
  'Prem Dhillon',
];

// Artist affinity mapping for personalized recommendations
const ARTIST_AFFINITY = {
  'arijit singh': ['Pritam', 'Vishal Mishra', 'Atif Aslam', 'Shreya Ghoshal', 'Jubin Nautiyal'],
  'pritam': ['Arijit Singh', 'Sachin-Jigar', 'Amit Trivedi', 'Vishal Mishra'],
  'karan aujla': ['Diljit Dosanjh', 'AP Dhillon', 'Shubh', 'Sidhu Moose Wala', 'Gur Sidhu'],
  'diljit dosanjh': ['Karan Aujla', 'AP Dhillon', 'Ammy Virk', 'Sidhu Moose Wala', 'B Praak'],
  'sidhu moose wala': ['Karan Aujla', 'Prem Dhillon', 'Navaan Sandhu', 'Amrit Maan', 'Jordan Sandhu'],
  'ap dhillon': ['Shubh', 'Karan Aujla', 'Talwiinder', 'Diljit Dosanjh'],
  'shubh': ['AP Dhillon', 'Karan Aujla', 'Talwiinder', 'Diljit Dosanjh'],
  'anuv jain': ['Prateek Kuhad', 'Jasleen Royal', 'Arijit Singh', 'Zaeden'],
  'atif aslam': ['Arijit Singh', 'Darshan Raval', 'Pritam', 'Vishal Mishra'],
  'b praak': ['Jaani', 'Ammy Virk', 'Bishakh Jyoti', 'Arijit Singh'],
  'talwiinder': ['AP Dhillon', 'Shubh', 'Karan Aujla'],
};

// Cache keys & in-memory cache
const CACHE_PREFIX = 'echomusic_rec_';
const CACHE_EXPIRY = 15 * 60 * 1000; // 15 minutes

/**
 * Normalizes title for strict duplicate detection
 */
function normalizeTitle(title) {
  if (!title) return '';
  return title
    .toLowerCase()
    .replace(/\(from [^)]+\)/gi, '')
    .replace(/\([^)]+\)/gi, '')
    .replace(/\[[^\]]+\]/gi, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

/**
 * Validates that song is playable and has required visual metadata
 */
export function isPlayableSong(song) {
  if (!song) return false;
  if (!song.title || !song.title.trim()) return false;
  if (!song.singers || !song.singers.trim()) return false;
  if (!song.url || !song.url.trim() || !song.url.startsWith('http')) return false;
  if (!song.image_url || !song.image_url.trim()) return false;
  return true;
}

/**
 * Filters and deduplicates a list of songs
 */
export function sanitizeAndDeduplicate(songs, seenKeys = new Set()) {
  if (!Array.isArray(songs)) return [];

  const uniqueList = [];

  for (const song of songs) {
    if (!isPlayableSong(song)) continue;

    const idKey = String(song.id || song.songid || '').trim();
    const titleKey = normalizeTitle(song.title);
    const primaryKey = idKey || titleKey;

    if (!primaryKey) continue;

    if (seenKeys.has(idKey) || (titleKey && seenKeys.has(titleKey))) {
      continue;
    }

    if (idKey) seenKeys.add(idKey);
    if (titleKey) seenKeys.add(titleKey);

    uniqueList.push(song);
  }

  return uniqueList;
}

/**
 * Shuffles array slightly for variety while preserving top matches
 */
function lightShuffle(array, variance = 0.3) {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    if (Math.random() < variance) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
  }
  return result;
}

/**
 * Cache helper using sessionStorage
 */
function getCached(key) {
  try {
    const raw = sessionStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Date.now() - parsed.timestamp < CACHE_EXPIRY) {
      return parsed.data;
    }
  } catch {
    // Ignore cache parse error
  }
  return null;
}

function setCache(key, data) {
  try {
    sessionStorage.setItem(
      CACHE_PREFIX + key,
      JSON.stringify({ timestamp: Date.now(), data })
    );
  } catch {
    // Ignore storage quota error
  }
}

/**
 * Extracts top artists from recently played history
 */
export function extractTopArtists(recentlyPlayed = [], limit = 3) {
  if (!recentlyPlayed || recentlyPlayed.length === 0) return [];

  const artistCounts = {};
  for (const song of recentlyPlayed) {
    if (!song.singers) continue;
    const parts = song.singers.split(/,|&|feat\.|ft\./i).map((s) => s.trim());
    for (const artist of parts) {
      if (artist.length < 3) continue;
      const lower = artist.toLowerCase();
      artistCounts[lower] = (artistCounts[lower] || 0) + 1;
    }
  }

  return Object.entries(artistCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([lower]) => {
      // Find original capitalized name
      const found = recentlyPlayed.find((s) =>
        s.singers && s.singers.toLowerCase().includes(lower)
      );
      if (found) {
        const parts = found.singers.split(/,|&|feat\.|ft\./i).map((s) => s.trim());
        const match = parts.find((p) => p.toLowerCase() === lower);
        if (match) return match;
      }
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    });
}

/**
 * Generates personalized "Made For You" songs based on listening history
 */
export async function getMadeForYouRecommendations(recentlyPlayed = [], seenKeys = new Set()) {
  const topArtists = extractTopArtists(recentlyPlayed, 2);

  // If user has listening history, recommend related artists
  if (topArtists.length > 0) {
    const queriesToRun = [];
    for (const artist of topArtists) {
      queriesToRun.push(artist);
      const lower = artist.toLowerCase();
      const related = ARTIST_AFFINITY[lower];
      if (related && related.length > 0) {
        queriesToRun.push(related[Math.floor(Math.random() * related.length)]);
      }
    }

    const fetchedPool = [];
    for (const q of queriesToRun.slice(0, 3)) {
      try {
        const results = await searchSongs(q);
        fetchedPool.push(...results);
      } catch (e) {
        console.warn(`MadeForYou query failed for "${q}":`, e.message);
      }
    }

    const clean = sanitizeAndDeduplicate(fetchedPool, seenKeys);
    if (clean.length > 0) {
      return lightShuffle(clean).slice(0, 16);
    }
  }

  // Fallback if no history yet: Mix of trending Hindi & Punjabi superstars
  const fallbackSeeds = ['Arijit Singh', 'Karan Aujla', 'Diljit Dosanjh', 'Shreya Ghoshal'];
  const pool = [];
  for (const seed of fallbackSeeds) {
    try {
      const results = await searchSongs(seed);
      pool.push(...results.slice(0, 4));
    } catch {
      // Ignore fallback seed error
    }
  }

  return lightShuffle(sanitizeAndDeduplicate(pool, seenKeys)).slice(0, 16);
}

/**
 * Gets top curated Quick Picks (mix of Hindi & Punjabi mega-hits, influenced by history)
 */
export async function getCuratedQuickPicks(recentlyPlayed = [], seenKeys = new Set()) {
  const cached = getCached('quick_picks');
  if (cached && cached.length >= 12 && recentlyPlayed.length === 0) {
    return cached;
  }

  // Pick balanced seed artists
  const topArtists = extractTopArtists(recentlyPlayed, 1);
  const preferredArtist = topArtists[0] || null;

  // Curated seeds
  const hindiPick = HINDI_SEEDS[Math.floor(Math.random() * HINDI_SEEDS.length)];
  const punjabiPick = PUNJABI_SEEDS[Math.floor(Math.random() * PUNJABI_SEEDS.length)];
  const queries = [
    preferredArtist || 'Karan Aujla',
    'Arijit Singh',
    punjabiPick,
    hindiPick,
  ].filter(Boolean);

  const pool = [];
  for (const q of queries) {
    try {
      const res = await searchSongs(q);
      // Prioritize top 5 from each query
      pool.push(...res.slice(0, 6));
    } catch (e) {
      console.warn(`Quick pick fetch failed for ${q}:`, e.message);
    }
  }

  const clean = sanitizeAndDeduplicate(pool, seenKeys);
  const finalResults = lightShuffle(clean).slice(0, 20);

  if (finalResults.length > 0 && recentlyPlayed.length === 0) {
    setCache('quick_picks', finalResults);
  }

  return finalResults;
}

/**
 * Gets top Hindi Hits
 */
export async function getHindiHits(seenKeys = new Set()) {
  const cached = getCached('hindi_hits');
  if (cached && cached.length >= 8) {
    return cached;
  }

  // 2-3 top Hindi artists
  const seeds = ['Arijit Singh', 'Pritam', 'Vishal Mishra'];
  const pool = [];

  for (const seed of seeds) {
    try {
      const res = await searchSongs(seed);
      // Only keep songs that are hindi or have recognized artists
      const filtered = res.filter((s) => !s.language || s.language.toLowerCase() === 'hindi');
      pool.push(...(filtered.length > 0 ? filtered : res).slice(0, 5));
    } catch {
      // Ignore single seed error
    }
  }

  const clean = sanitizeAndDeduplicate(pool, seenKeys).slice(0, 16);
  if (clean.length > 0) {
    setCache('hindi_hits', clean);
  }
  return clean;
}

/**
 * Gets top Punjabi Hits
 */
export async function getPunjabiHits(seenKeys = new Set()) {
  const cached = getCached('punjabi_hits');
  if (cached && cached.length >= 8) {
    return cached;
  }

  const seeds = ['Karan Aujla', 'Diljit Dosanjh', 'Sidhu Moose Wala'];
  const pool = [];

  for (const seed of seeds) {
    try {
      const res = await searchSongs(seed);
      const filtered = res.filter((s) => !s.language || s.language.toLowerCase() === 'punjabi');
      pool.push(...(filtered.length > 0 ? filtered : res).slice(0, 5));
    } catch {
      // Ignore single seed error
    }
  }

  const clean = sanitizeAndDeduplicate(pool, seenKeys).slice(0, 16);
  if (clean.length > 0) {
    setCache('punjabi_hits', clean);
  }
  return clean;
}
