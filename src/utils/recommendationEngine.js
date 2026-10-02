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
/**
 * Calculates a comprehensive recommendation score for a candidate song
 * against the current song profile, playback history, queue, and sequence diversity.
 *
 * Requirements:
 * - Same language: +30
 * - Hindi <-> Punjabi crossover synergy: +12
 * - Same genre: +25
 * - Similar genre: +15
 * - Same mood: +20
 * - Similar mood: +10
 * - Similar artist: +10
 * - Similar style / album: +10
 * - Previously liked: +10
 * - Recently played (in last 15-20 tracks): -25
 * - Already in explicit queue: -40
 * - Same exact song: -1000
 *
 * Sequence diversity penalties:
 * - Same artist as immediately preceding song in sequence: -25
 * - Same artist as 2nd preceding song in sequence: -15
 * - Same album as immediately preceding song: -20
 * - Same exact genre as last 2 songs: -10
 */
export function scoreCandidate(currentProfile, candidateSong, context = {}) {
  if (!currentProfile || !candidateSong) return -1000;

  const currentKey = currentProfile.id || getSongKey(currentProfile.raw);
  const candKey = getSongKey(candidateSong);
  if (!candKey) return -1000;

  // Exact same song as currently playing
  if (currentKey && candKey === currentKey) return -1000;

  const candidateProfile = extractSongProfile(candidateSong);
  if (!candidateProfile) return -1000;

  const recentlyPlayedSet = context.recentlyPlayedKeys || context.recentlyPlayedIds || new Set();
  const explicitSet = context.explicitKeys || context.explicitIds || new Set();
  const likedSet = context.likedKeys || context.likedIds || new Set();
  const generatedSequence = context.generatedSequence || [];

  // Same song already selected in current generated smart sequence
  if (generatedSequence.some((s) => getSongKey(s) === candKey)) {
    return -1000;
  }

  let score = 0;

  // 1. Language matching (+30 points) - Strongest signal
  if (currentProfile.language && candidateProfile.language) {
    if (currentProfile.language === candidateProfile.language) {
      score += 30;
    } else if (
      (currentProfile.language === 'punjabi' && candidateProfile.language === 'hindi') ||
      (currentProfile.language === 'hindi' && candidateProfile.language === 'punjabi')
    ) {
      // High synergy between Hindi & Punjabi popular / hip-hop music
      score += 12;
    } else {
      // Divergent language (e.g. English vs regional)
      score -= 5;
    }
  }

  // 2. Genre matching (+25 points)
  if (currentProfile.genre && candidateProfile.genre) {
    if (currentProfile.genre === candidateProfile.genre) {
      score += 25;
    } else if (
      (currentProfile.genre.includes('hip-hop') && candidateProfile.genre.includes('hip-hop')) ||
      (currentProfile.genre.includes('romantic') && candidateProfile.genre.includes('romantic')) ||
      (currentProfile.genre.includes('pop') && candidateProfile.genre.includes('pop'))
    ) {
      score += 15;
    }
  }

  // 3. Mood matching (+20 points)
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

  // 4. Similar artist (+10 points)
  if (currentProfile.artist && candidateProfile.artist) {
    const curArtists = currentProfile.artist.toLowerCase().split(/[,/&]+/).map((a) => a.trim()).filter(Boolean);
    const candArtists = candidateProfile.artist.toLowerCase().split(/[,/&]+/).map((a) => a.trim()).filter(Boolean);
    const hasCommonArtist = curArtists.some((ca) => candArtists.some((canda) => ca.includes(canda) || canda.includes(ca)));
    if (hasCommonArtist) {
      score += 10;
    }
  }

  // 5. Similar style / Album (+10 points)
  if (currentProfile.album && candidateProfile.album && currentProfile.album.toLowerCase() === candidateProfile.album.toLowerCase()) {
    score += 10;
  }

  // 6. Previously liked (+10 points)
  if (likedSet.has(candKey) || (candidateSong.id && likedSet.has(candidateSong.id))) {
    score += 10;
  }

  // 7. Recently played (-25 penalty for last 15-20 tracks)
  if (recentlyPlayedSet.has(candKey) || (candidateSong.id && recentlyPlayedSet.has(candidateSong.id))) {
    score -= 25;
  }

  // 8. Already in explicit queue (-40 penalty)
  if (explicitSet.has(candKey) || (candidateSong.id && explicitSet.has(candidateSong.id))) {
    score -= 40;
  }

  // 9. DIVERSITY RULES (Prevent sequence repetition: Artist A -> Artist A -> Artist A)
  if (generatedSequence.length > 0) {
    const immediatePrev = generatedSequence[generatedSequence.length - 1];
    const prevProfile = extractSongProfile(immediatePrev);

    if (prevProfile) {
      // Avoid immediate repeat artist
      if (candidateProfile.artist && prevProfile.artist) {
        const prevArtists = prevProfile.artist.toLowerCase().split(/[,/&]+/).map((a) => a.trim()).filter(Boolean);
        const candArtists = candidateProfile.artist.toLowerCase().split(/[,/&]+/).map((a) => a.trim()).filter(Boolean);
        const sharesPrevArtist = prevArtists.some((pa) => candArtists.some((ca) => pa.includes(ca) || ca.includes(pa)));
        if (sharesPrevArtist) {
          score -= 25;
        }
      }

      // Avoid immediate repeat album
      if (candidateProfile.album && prevProfile.album && candidateProfile.album.toLowerCase() === prevProfile.album.toLowerCase()) {
        score -= 20;
      }

      // Avoid 2-back repeat artist (Artist A -> Artist B -> Artist A penalty is lower, but still discouraged)
      if (generatedSequence.length >= 2) {
        const secondPrev = generatedSequence[generatedSequence.length - 2];
        const secondPrevProfile = extractSongProfile(secondPrev);
        if (secondPrevProfile && secondPrevProfile.artist && candidateProfile.artist) {
          const secondArtists = secondPrevProfile.artist.toLowerCase().split(/[,/&]+/).map((a) => a.trim()).filter(Boolean);
          const candArtists = candidateProfile.artist.toLowerCase().split(/[,/&]+/).map((a) => a.trim()).filter(Boolean);
          if (secondArtists.some((sa) => candArtists.some((ca) => sa.includes(ca) || ca.includes(sa)))) {
            score -= 15;
          }
        }
      }

      // Avoid 3 consecutive same exact genre
      if (generatedSequence.length >= 2) {
        const secondPrev = generatedSequence[generatedSequence.length - 2];
        const secondPrevProfile = extractSongProfile(secondPrev);
        if (
          prevProfile.genre === candidateProfile.genre &&
          secondPrevProfile &&
          secondPrevProfile.genre === candidateProfile.genre
        ) {
          score -= 10;
        }
      }
    }
  }

  return score;
}

/**
 * Legacy compatibility similarity scoring function
 */
export function calculateSimilarityScore(currentProfile, candidateProfile) {
  if (!currentProfile || !candidateProfile) return 0;
  return scoreCandidate(currentProfile, candidateProfile.raw || candidateProfile);
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
 * Performs controlled weighted random selection among scored candidates
 * Ensures higher scores have higher probability, but lower scoring candidates
 * still have a non-zero chance of being selected (avoiding purely deterministic queues).
 */
export function weightedRandomSelect(scoredCandidates) {
  if (!Array.isArray(scoredCandidates) || scoredCandidates.length === 0) return null;
  if (scoredCandidates.length === 1) return scoredCandidates[0].song;

  // Filter out invalid or blacklisted candidates (score <= -100)
  const eligible = scoredCandidates.filter((item) => item.score > -100);
  if (eligible.length === 0) {
    return scoredCandidates[Math.floor(Math.random() * scoredCandidates.length)].song;
  }

  // Calculate weights using power curve max(1, score)^1.5 to accentuate high quality
  // while retaining non-zero odds for all eligible items
  const weights = eligible.map((item) => {
    const effectiveScore = Math.max(1, item.score);
    return Math.pow(effectiveScore, 1.5);
  });

  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  if (totalWeight <= 0) {
    return eligible[Math.floor(Math.random() * eligible.length)].song;
  }

  let randomVal = Math.random() * totalWeight;
  for (let i = 0; i < eligible.length; i++) {
    randomVal -= weights[i];
    if (randomVal <= 0) {
      return eligible[i].song;
    }
  }

  return eligible[eligible.length - 1].song;
}

/**
 * Generates an intelligent batch of upcoming Smart Shuffle songs (e.g. 5-8 songs)
 * based on current song context, diversity rules, and weighted randomness.
 */
export async function generateSmartShuffleQueue(currentSong, options = {}) {
  const {
    recentlyPlayed = [],
    likedSongs = [],
    localPool = [],
    explicitQueue = [],
    existingSmartQueue = [],
    searchApi = null,
    trendingApi = null,
    batchSize = 6,
  } = options;

  if (!currentSong) return [];

  const currentProfile = extractSongProfile(currentSong);
  const currentKey = getSongKey(currentSong);

  const recentlyPlayedKeys = new Set(
    recentlyPlayed.slice(0, 20).map(getSongKey).filter(Boolean)
  );
  if (currentKey) recentlyPlayedKeys.add(currentKey);

  const explicitKeys = new Set(
    explicitQueue.map(getSongKey).filter(Boolean)
  );

  const likedKeys = new Set(
    likedSongs.map(getSongKey).filter(Boolean)
  );

  const existingSmartKeys = new Set(
    existingSmartQueue.map(getSongKey).filter(Boolean)
  );

  const candidatePool = [];

  const addCandidates = (songs) => {
    if (!Array.isArray(songs)) return;
    for (const s of songs) {
      if (!s || !s.url || !s.url.trim() || !s.title) continue;
      const key = getSongKey(s);
      if (!key) continue;
      if (key === currentKey || existingSmartKeys.has(key)) continue;
      candidatePool.push(s);
    }
  };

  // 1. In-memory local pools and liked songs
  addCandidates(localPool);
  addCandidates(likedSongs);

  // 2. Fetch fresh candidates via Search API using top 2 recommendation queries
  if (typeof searchApi === 'function') {
    const queries = buildRecommendationQueries(currentProfile);
    const targetQueries = queries.slice(0, 2);

    try {
      const searchPromises = targetQueries.map((q) =>
        searchApi(q).catch((err) => {
          console.warn(`[SmartShuffle] Search query "${q}" failed:`, err.message);
          return [];
        })
      );
      const results = await Promise.all(searchPromises);
      for (const res of results) {
        addCandidates(res);
      }
    } catch (err) {
      console.warn('[SmartShuffle] Dynamic search candidate fetch failed:', err.message);
    }
  }

  // 3. Fallback: If candidate pool is small, fetch trending songs
  if (candidatePool.length < 15 && typeof trendingApi === 'function') {
    try {
      const trending = await trendingApi();
      addCandidates(trending);
    } catch (err) {
      console.warn('[SmartShuffle] Trending candidate fallback failed:', err.message);
    }
  }

  // 4. Deduplicate candidate pool
  const seenKeys = new Set();
  const uniqueCandidates = [];
  for (const song of candidatePool) {
    const key = getSongKey(song);
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      uniqueCandidates.push(song);
    }
  }

  if (uniqueCandidates.length === 0) {
    return [];
  }

  // 5. Iteratively select songs applying diversity rules and weighted randomness
  const generatedSequence = [];
  let remainingCandidates = [...uniqueCandidates];

  const targetCount = Math.min(batchSize, remainingCandidates.length);

  for (let step = 0; step < targetCount; step++) {
    // Score all remaining candidates in the context of the current song and what has been generated so far
    const scored = remainingCandidates.map((song) => {
      const score = scoreCandidate(currentProfile, song, {
        recentlyPlayedKeys,
        explicitKeys,
        generatedSequence,
        likedKeys,
      });
      return { song, score };
    });

    // Select winner using weighted random selection
    const chosenSong = weightedRandomSelect(scored);
    if (!chosenSong) break;

    generatedSequence.push(chosenSong);
    const chosenKey = getSongKey(chosenSong);
    remainingCandidates = remainingCandidates.filter((s) => getSongKey(s) !== chosenKey);
  }

  return generatedSequence;
}

/**
 * Selects the optimal next recommended song based on currentSong context
 */
export async function getRecommendedNextSong(currentSong, options = {}) {
  const batch = await generateSmartShuffleQueue(currentSong, {
    ...options,
    batchSize: 1,
  });
  if (batch && batch.length > 0) {
    return batch[0];
  }
  return null;
}

export default {
  extractSongProfile,
  detectLanguage,
  inferGenreAndMood,
  calculateSimilarityScore,
  buildRecommendationQueries,
  scoreCandidate,
  weightedRandomSelect,
  generateSmartShuffleQueue,
  getRecommendedNextSong,
};
