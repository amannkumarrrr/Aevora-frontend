import { getSongKey } from './songUtils.js';

/**
 * Normalized song profile structure for recommendation evaluation
 * {
 *   id,
 *   title,
 *   artist,
 *   album,
 *   language,
 *   genre,
 *   mood,
 *   duration,
 *   artwork,
 *   audioUrl,
 *   raw
 * }
 */

// Known artist language & genre mappings for accurate inference
const ARTIST_PRESETS = [
  // Punjabi Hip-Hop / Rap
  {
    names: ['karan aujla', 'shubh', 'ap dhillon', 'sidhu moose wala', 'sidhu moosewala', 'prem dhillon', 'jordan sandhu', 'gur sidhu', 'amrit maan', 'wazir patar', 'navaan sandhu', 'mankirt aulakh'],
    language: 'punjabi',
    genre: 'hip-hop/rap',
    mood: 'aggressive/energetic',
  },
  // Punjabi Melodic / Romantic
  {
    names: ['diljit dosanjh', 'b praak', 'kaka', 'jassi gill', 'garry sandhu', 'harddy sandhu', 'nimrat khaira', 'sunanda sharma', 'ammy virk'],
    language: 'punjabi',
    genre: 'romantic',
    mood: 'romantic/intimate',
  },
  // Hindi Hip-Hop / Rap
  {
    names: ['divine', 'mc stan', 'raftaar', 'kr$na', 'emiway bantai', 'seedhe maut', 'king', 'badshah', 'yo yo honey singh', 'honey singh', 'ikka', 'dino james'],
    language: 'hindi',
    genre: 'hip-hop/rap',
    mood: 'aggressive/energetic',
  },
  // Hindi Romantic / Melancholic
  {
    names: ['arijit singh', 'atif aslam', 'jubin nautiyal', 'shreya ghoshal', 'mohit chauhan', 'kk', 'sonu nigam', 'armaan malik', 'pritam', 'sachin-jigar', 'mithoon', 'rochak kohli', 'vishal mishra'],
    language: 'hindi',
    genre: 'romantic',
    mood: 'romantic/intimate',
  },
  // English Pop / Melodic
  {
    names: ['taylor swift', 'ed sheeran', 'justin bieber', 'dua lipa', 'billie eilish', 'shawn mendes', 'selena gomez', 'bruno mars', 'olivia rodrigo', 'katy perry', 'charlie puth', 'ariana grande', 'coldplay'],
    language: 'english',
    genre: 'pop',
    mood: 'upbeat/party',
  },
  // English Hip-Hop / Rap
  {
    names: ['eminem', 'drake', 'travis scott', 'kendrick lamar', 'kanye west', 'j. cole', 'post malone', '21 savage', '50 cent', 'snoop dogg', 'future', 'metro boomin'],
    language: 'english',
    genre: 'hip-hop/rap',
    mood: 'aggressive/energetic',
  },
];

// Keyword dictionaries for dynamic metadata inference
const KEYWORDS = {
  punjabi: ['jatt', 'pind', 'yaari', 'bamb', 'gaddi', 'soch', 'qismat', 'suit', 'akhaan', 'mithi', 'chobar', 'fukra', 'patiala', 'peg', 'daaru', 'bhangra', 'boliyan', 'dhol', 'punjabi'],
  hindi: ['dil', 'pyaar', 'ishq', 'mohabbat', 'zindagi', 'tum', 'hum', 'sanam', 'bewafa', 'teri', 'meri', 'channa', 'humsafar', 'musafir', 'shayad', 'khairiyat', 'dhurandhar', 'aankhon', 'deewana', 'hindi', 'bollywood'],
  english: ['love', 'baby', 'night', 'summer', 'forever', 'heart', 'dance', 'lights', 'dream', 'world', 'pop', 'rock', 'stay', 'alone'],

  hipHop: ['rap', 'hip hop', 'trap', 'drill', 'cypher', 'flow', 'snitching', 'no snitching', 'shooter', 'badmashi', 'bars', '52 bars', 'flex', 'cheques', 'baller', 'elevated', 'brown munde', 'insane', 'goat', 'warning', 'mafia', 'gang', 'gangster', 'anthem', 'diss', 'freestyle', 'badshah', 'hustle', 'hood'],
  sad: ['sad', 'dard', 'bewafa', 'judai', 'broken', 'tears', 'cry', 'alone', 'tanha', 'bichhda', 'roya', 'heartbreak', 'yaad', 'vichhoda', 'chhod diya', 'pachtaoge', 'filhall', 'tujhe kitna chahne lage', 'alvida', 'musafir', 'lonely', 'sorrow'],
  romantic: ['love', 'ishq', 'pyaar', 'mohabbat', 'romantic', 'dil', 'humsafar', 'heart', 'forever', 'valentine', 'deewana', 'pehla nasha', 'tum hi ho', 'kesariya', 'channa mereya', 'soniye', 'heer', 'ranjha', 'shayad', 'khairiyat', 'raataan lambiyan', 'apna bana le', 'perfect', 'lover', 'softly', 'crush'],
  dance: ['party', 'dance', 'club', 'dj', 'remix', 'bhangra', 'nach', 'dhol', 'beat', 'groove', 'thumka', 'daaru', 'peg', 'sharab', 'disco', 'bass', 'celebration'],
};

/**
 * Detects language from song title, artist, and album
 */
export function detectLanguage(title = '', artist = '', album = '') {
  const combined = `${title} ${artist} ${album}`.toLowerCase();

  // 1. Check known artist presets
  for (const preset of ARTIST_PRESETS) {
    if (preset.names.some((name) => combined.includes(name))) {
      return preset.language;
    }
  }

  // 2. Check keyword matches
  let punjabiCount = 0;
  for (const kw of KEYWORDS.punjabi) {
    if (combined.includes(kw)) punjabiCount++;
  }

  let hindiCount = 0;
  for (const kw of KEYWORDS.hindi) {
    if (combined.includes(kw)) hindiCount++;
  }

  if (punjabiCount > 0 && punjabiCount >= hindiCount) return 'punjabi';
  if (hindiCount > 0) return 'hindi';

  // Default heuristic: If English words or ASCII predominant, default to english/hindi
  return 'hindi';
}

/**
 * Infers Genre and Mood conservatively from song metadata
 */
export function inferGenreAndMood(title = '', artist = '', album = '', language = '') {
  const combined = `${title} ${artist} ${album}`.toLowerCase();

  // 1. Check artist presets first
  for (const preset of ARTIST_PRESETS) {
    if (preset.names.some((name) => combined.includes(name))) {
      // Check if title has a specific mood override (e.g. a sad song by a hip-hop artist or vice versa)
      if (KEYWORDS.sad.some((kw) => combined.includes(kw))) {
        return { genre: 'sad', mood: 'sad/melancholic' };
      }
      if (KEYWORDS.dance.some((kw) => combined.includes(kw))) {
        return { genre: 'dance/party', mood: 'upbeat/party' };
      }
      return { genre: preset.genre, mood: preset.mood };
    }
  }

  // 2. Keyword-based inference
  if (KEYWORDS.hipHop.some((kw) => combined.includes(kw))) {
    return { genre: 'hip-hop/rap', mood: 'aggressive/energetic' };
  }
  if (KEYWORDS.sad.some((kw) => combined.includes(kw))) {
    return { genre: 'sad', mood: 'sad/melancholic' };
  }
  if (KEYWORDS.romantic.some((kw) => combined.includes(kw))) {
    return { genre: 'romantic', mood: 'romantic/intimate' };
  }
  if (KEYWORDS.dance.some((kw) => combined.includes(kw))) {
    return { genre: 'dance/party', mood: 'upbeat/party' };
  }

  // Fallback defaults based on language
  if (language === 'punjabi') {
    return { genre: 'bhangra/pop', mood: 'upbeat/party' };
  }
  if (language === 'english') {
    return { genre: 'pop', mood: 'upbeat/party' };
  }

  return { genre: 'romantic/melodic', mood: 'romantic/intimate' };
}

/**
 * Normalizes song into unified profile structure
 */
export function extractSongProfile(song) {
  if (!song) return null;

  const id = song.id || song.songid || '';
  const title = (song.title || '').trim();
  const artist = (song.singers || song.artist || song.primary_artists || 'Unknown Artist').trim();
  const album = (song.album || '').trim();
  let language = (song.language || '').toLowerCase().trim();
  const duration = Number(song.duration) || 0;
  const artwork = song.image_url || song.image || '';
  const audioUrl = song.url || song.media_url || '';

  if (!language || language === 'unknown') {
    language = detectLanguage(title, artist, album);
  }

  const { genre, mood } = inferGenreAndMood(title, artist, album, language);

  return {
    id,
    title,
    artist,
    album,
    language,
    genre,
    mood,
    duration,
    artwork,
    audioUrl,
    raw: song,
  };
}

/**
 * Calculates similarity score between current playing song and candidate song
 * 
 * Weighted scoring system:
 * - Same language: very high priority (+40 pts)
 * - Same genre/style: high priority (+25 pts)
 * - Same mood: high priority (+20 pts)
 * - Similar / same artist: medium priority (+15 pts)
 * - Album / era context: (+5 pts)
 * - Controlled randomness: (+0-15 pts)
 */
export function calculateSimilarityScore(currentProfile, candidateProfile) {
  if (!currentProfile || !candidateProfile) return 0;

  let score = 0;

  // 1. Language matching (Very High Priority: +40 points)
  if (currentProfile.language && candidateProfile.language) {
    if (currentProfile.language === candidateProfile.language) {
      score += 40;
    } else if (
      (currentProfile.language === 'punjabi' && candidateProfile.language === 'hindi') ||
      (currentProfile.language === 'hindi' && candidateProfile.language === 'punjabi')
    ) {
      // Partial compatibility between Indian regional music (especially in Desi Hip-Hop/Pop)
      score += 15;
    }
  }

  // 2. Genre matching (High Priority: +25 points)
  if (currentProfile.genre && candidateProfile.genre) {
    if (currentProfile.genre === candidateProfile.genre) {
      score += 25;
    } else if (
      (currentProfile.genre.includes('hip-hop') && candidateProfile.genre.includes('hip-hop')) ||
      (currentProfile.genre.includes('romantic') && candidateProfile.genre.includes('romantic')) ||
      (currentProfile.genre.includes('pop') && candidateProfile.genre.includes('pop'))
    ) {
      score += 18;
    }
  }

  // 3. Mood matching (High Priority: +20 points)
  if (currentProfile.mood && candidateProfile.mood) {
    if (currentProfile.mood === candidateProfile.mood) {
      score += 20;
    } else if (
      (currentProfile.mood.includes('romantic') && candidateProfile.mood.includes('chill')) ||
      (currentProfile.mood.includes('aggressive') && candidateProfile.mood.includes('upbeat'))
    ) {
      score += 10;
    }
  }

  // 4. Artist / Style similarity (Medium Priority: +15 points)
  if (currentProfile.artist && candidateProfile.artist) {
    const curArtists = currentProfile.artist.toLowerCase().split(/[,/&]+/).map((a) => a.trim()).filter(Boolean);
    const candArtists = candidateProfile.artist.toLowerCase().split(/[,/&]+/).map((a) => a.trim()).filter(Boolean);

    const hasCommonArtist = curArtists.some((ca) => candArtists.some((canda) => ca.includes(canda) || canda.includes(ca)));
    if (hasCommonArtist) {
      score += 15;
    }
  }

  // 5. Album / Era similarity (+5 points)
  if (currentProfile.album && candidateProfile.album && currentProfile.album.toLowerCase() === candidateProfile.album.toLowerCase()) {
    score += 5;
  }

  // 6. Randomness factor (Medium Priority: +0-15 points to ensure diverse candidate selection)
  score += Math.random() * 15;

  return score;
}

/**
 * Extracts candidate search queries from the current song profile
 */
export function buildRecommendationQueries(profile) {
  if (!profile) return ['Top Bollywood', 'Global Hits'];

  const queries = [];
  const primaryArtist = profile.artist.split(/[,/&]+/)[0].trim();

  // 1. Primary artist (e.g. "Karan Aujla" or "Arijit Singh")
  if (primaryArtist && primaryArtist !== 'Unknown Artist') {
    queries.push(primaryArtist);
  }

  // 2. Language + Genre (e.g. "Punjabi Hip Hop", "Hindi Romantic", "English Pop")
  if (profile.language && profile.genre) {
    const cleanGenre = profile.genre.replace(/[/]+/g, ' ');
    queries.push(`${profile.language} ${cleanGenre}`);
  }

  // 3. Language hits (e.g. "Punjabi songs", "Hindi songs")
  if (profile.language) {
    queries.push(`${profile.language} songs`);
  }

  return queries;
}

/**
 * Selects the optimal next recommended song based on currentSong context
 *
 * Flow:
 * currentSong
 *    ↓
 * extract metadata profile
 *    ↓
 * find/generate candidate songs
 *    ↓
 * calculate similarity score
 *    ↓
 * filter already played / current song
 *    ↓
 * randomly select from high-scoring candidates
 *    ↓
 * play recommended song
 */
export async function getRecommendedNextSong(currentSong, options = {}) {
  const {
    recentlyPlayed = [],
    likedSongs = [],
    localPool = [],
    searchApi = null,
    trendingApi = null,
  } = options;

  if (!currentSong) return null;

  const currentProfile = extractSongProfile(currentSong);
  const currentKey = getSongKey(currentSong);

  // Set of recently played song keys to prevent repetition (last 15 songs)
  const recentKeys = new Set(
    recentlyPlayed
      .slice(0, 15)
      .map(getSongKey)
      .filter(Boolean)
  );
  recentKeys.add(currentKey);

  const candidatePool = [];

  // Helper to validate and add songs to candidatePool
  const addCandidates = (songs) => {
    if (!Array.isArray(songs)) return;
    for (const s of songs) {
      if (!s || !s.url || !s.url.trim() || !s.title) continue;
      const key = getSongKey(s);
      if (!key) continue;
      // Filter out current song and recently played
      if (recentKeys.has(key)) continue;
      candidatePool.push(s);
    }
  };

  // 1. Add candidates from local memory pools
  addCandidates(localPool);
  addCandidates(likedSongs);

  // 2. Dynamically fetch fresh candidates matching current song context via Search API
  if (typeof searchApi === 'function') {
    const queries = buildRecommendationQueries(currentProfile);
    // Pick the top 2 queries to query concurrently with minimal latency
    const targetQueries = queries.slice(0, 2);

    try {
      const searchPromises = targetQueries.map((q) =>
        searchApi(q).catch((err) => {
          console.warn(`[Recommendation] Search query "${q}" failed:`, err.message);
          return [];
        })
      );

      const resultsList = await Promise.all(searchPromises);
      for (const res of resultsList) {
        addCandidates(res);
      }
    } catch (apiErr) {
      console.warn('[Recommendation] Dynamic candidate fetch failed:', apiErr.message);
    }
  }

  // 3. Deduplicate candidate pool
  const seenKeys = new Set();
  const uniqueCandidates = [];
  for (const song of candidatePool) {
    const key = getSongKey(song);
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      uniqueCandidates.push(song);
    }
  }

  // 4. Score all candidates using weighted similarity algorithm
  if (uniqueCandidates.length > 0) {
    const scoredList = uniqueCandidates.map((song) => {
      const candidateProfile = extractSongProfile(song);
      const score = calculateSimilarityScore(currentProfile, candidateProfile);
      return { song, score };
    });

    // Sort candidates descending by score
    scoredList.sort((a, b) => b.score - a.score);

    const highestScore = scoredList[0].score;
    // Top tier: candidates within 18 points of the highest score
    const topTier = scoredList.filter((item) => item.score >= highestScore - 18);

    // Random selection from the high-scoring tier to prevent repetitive autoplay
    const chosen = topTier[Math.floor(Math.random() * topTier.length)];
    return chosen.song;
  }

  // 5. Fallback 1: Relax recently played filter if candidate pool was too restrictive
  const relaxedPool = [...localPool, ...likedSongs].filter((s) => {
    if (!s || !s.url || !s.url.trim() || !s.title) return false;
    return getSongKey(s) !== currentKey;
  });

  if (relaxedPool.length > 0) {
    return relaxedPool[Math.floor(Math.random() * relaxedPool.length)];
  }

  // 6. Fallback 2: Broader trending recommendation
  if (typeof trendingApi === 'function') {
    try {
      const trending = await trendingApi();
      const valid = (trending || []).filter((s) => {
        if (!s || !s.url || !s.url.trim() || !s.title) return false;
        return getSongKey(s) !== currentKey;
      });
      if (valid.length > 0) {
        return valid[Math.floor(Math.random() * valid.length)];
      }
    } catch (e) {
      console.warn('[Recommendation] Broader fallback failed:', e.message);
    }
  }

  return null;
}

export default {
  extractSongProfile,
  detectLanguage,
  inferGenreAndMood,
  calculateSimilarityScore,
  buildRecommendationQueries,
  getRecommendedNextSong,
};
