import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import { getLyrics, getTrendingSongs } from '../services/musicApi';

const MusicPlayerContext = createContext(null);

export const STORAGE_KEY_LIKED_SONGS = 'echoMusicLikedSongs';
export const STORAGE_KEY_RECENTLY_PLAYED = 'echoMusicRecentlyPlayed';
const STORAGE_KEY_VOLUME = 'aurabeat_volume';

/**
 * Safely loads recently played songs from localStorage
 */
function loadRecentlyPlayed() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_RECENTLY_PLAYED);
    if (!raw) {
      const legacy = localStorage.getItem('aurabeat_recently_played');
      if (legacy) {
        const parsed = JSON.parse(legacy);
        if (Array.isArray(parsed)) return parsed.map(normalizeLikedSong).filter(Boolean);
      }
      return [];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.map(normalizeLikedSong).filter(Boolean);
    }
    return [];
  } catch (err) {
    console.warn('Failed to load recently played from localStorage:', err);
    return [];
  }
}

/**
 * Safely persists recently played songs to localStorage
 */
function persistRecentlyPlayed(songs) {
  try {
    localStorage.setItem(STORAGE_KEY_RECENTLY_PLAYED, JSON.stringify(songs));
  } catch (err) {
    console.warn('Failed to save recently played to localStorage:', err);
  }
}

/**
 * Returns a robust unique key for a song.
 * Uses songid or id or perma_url or url. Never identifies only by title.
 */
export function getSongKey(song) {
  if (!song) return '';
  return String(song.songid || song.id || song.perma_url || song.url || '').trim();
}

/**
 * Normalizes a song object to minimal required fields for persistence & playback
 */
export function normalizeLikedSong(song) {
  if (!song) return null;
  const key = getSongKey(song);
  if (!key) return null;

  return {
    songid: song.songid || song.id || key,
    id: song.id || song.songid || key,
    title: song.title || 'Unknown Title',
    singers: song.singers || song.artist || 'Unknown Artist',
    album: song.album || '',
    image_url: song.image_url || song.image || '',
    url: song.url || '',
    duration: Number(song.duration) || 0,
    language: song.language || '',
    perma_url: song.perma_url || '',
    likedAt: song.likedAt || Date.now(),
  };
}

/**
 * Safely loads liked songs from localStorage with error recovery
 */
function loadLikedSongs() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LIKED_SONGS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.map(normalizeLikedSong).filter(Boolean);
    }
    return [];
  } catch (err) {
    console.warn('Failed to load liked songs from localStorage, resetting safely:', err);
    return [];
  }
}

/**
 * Safely persists liked songs to localStorage with quota protection
 */
function persistLikedSongs(songs) {
  try {
    localStorage.setItem(STORAGE_KEY_LIKED_SONGS, JSON.stringify(songs));
  } catch (err) {
    console.warn('Failed to save liked songs to localStorage:', err);
  }
}

export function MusicPlayerProvider({ children }) {
  // Player state
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_VOLUME);
      return saved !== null ? parseFloat(saved) : 0.8;
    } catch {
      return 0.8;
    }
  });
  const [isMuted, setIsMuted] = useState(false);
  const [queue, setQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [repeatMode, setRepeatMode] = useState('off'); // 'off' | 'all' | 'one'
  const [isShuffled, setIsShuffled] = useState(false);
  const [playerError, setPlayerError] = useState(null);

  // Mobile full-screen overlay state
  const [isMobilePlayerExpanded, setIsMobilePlayerExpanded] = useState(false);

  // Lyrics state
  const [lyricsOpen, setLyricsOpen] = useState(false);
  const [lyricsSong, setLyricsSong] = useState(null);
  const [lyricsText, setLyricsText] = useState(null);
  const [lyricsLoading, setLyricsLoading] = useState(false);
  const [lyricsFetchedId, setLyricsFetchedId] = useState(null);

  // Liked songs state (browser-specific persistence)
  const [likedSongs, setLikedSongs] = useState(loadLikedSongs);

  // Recently played songs from localStorage (device-specific)
  const [recentlyPlayed, setRecentlyPlayed] = useState(loadRecentlyPlayed);

  // Native HTML5 Audio instance
  const audioRef = useRef(new Audio());

  // In-memory pool of available songs for zero-latency autoplay
  const availableSongsPoolRef = useRef([]);

  // Register songs into available pool for autoplay
  const registerAvailableSongs = useCallback((songs) => {
    if (!Array.isArray(songs) || songs.length === 0) return;
    const valid = songs.filter((s) => s && s.url && s.url.trim());
    if (valid.length === 0) return;

    const existingKeys = new Set(availableSongsPoolRef.current.map(getSongKey));
    const toAdd = valid.filter((s) => !existingKeys.has(getSongKey(s)));
    if (toAdd.length > 0) {
      availableSongsPoolRef.current = [...availableSongsPoolRef.current, ...toAdd];
    }
  }, []);

  // Pre-seed available pool on mount so autoplay is immediately armed
  useEffect(() => {
    getTrendingSongs()
      .then((songs) => {
        if (Array.isArray(songs) && songs.length > 0) {
          registerAvailableSongs(songs);
        }
      })
      .catch(() => {});
  }, [registerAvailableSongs]);

  // Check if a song is liked
  const isSongLiked = useCallback(
    (song) => {
      if (!song) return false;
      const key = getSongKey(song);
      if (!key) return false;
      return likedSongs.some((s) => getSongKey(s) === key);
    },
    [likedSongs]
  );

  // Toggle like/unlike state
  const toggleLike = useCallback((song) => {
    if (!song) return;
    const key = getSongKey(song);
    if (!key) return;

    setLikedSongs((prev) => {
      const exists = prev.some((s) => getSongKey(s) === key);
      let updated;
      if (exists) {
        // Unlike: remove from list
        updated = prev.filter((s) => getSongKey(s) !== key);
      } else {
        // Like: normalize and add to beginning
        const normalized = normalizeLikedSong(song);
        if (!normalized) return prev;
        updated = [normalized, ...prev.filter((s) => getSongKey(s) !== key)];
      }
      persistLikedSongs(updated);
      return updated;
    });
  }, []);

  // Remove a song from liked songs explicitly
  const removeLikedSong = useCallback((song) => {
    if (!song) return;
    const key = getSongKey(song);
    if (!key) return;
    setLikedSongs((prev) => {
      const updated = prev.filter((s) => getSongKey(s) !== key);
      persistLikedSongs(updated);
      return updated;
    });
  }, []);

  // Save recently played helper (most recent at top, deduplicated)
  const addToRecentlyPlayed = useCallback((song) => {
    if (!song || !song.title) return;
    const key = getSongKey(song);
    if (!key) return;

    setRecentlyPlayed((prev) => {
      const filtered = prev.filter((item) => getSongKey(item) !== key);
      const normalized = normalizeLikedSong(song);
      if (!normalized) return prev;

      const updated = [
        {
          ...normalized,
          playedAt: Date.now(),
        },
        ...filtered,
      ].slice(0, 30);

      persistRecentlyPlayed(updated);
      return updated;
    });
  }, []);

  // Update volume on audio element
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = isMuted ? 0 : volume;
    }
    try {
      localStorage.setItem(STORAGE_KEY_VOLUME, volume.toString());
    } catch {}
  }, [volume, isMuted]);

  // Play a song
  const playSong = useCallback((song, newQueue = null, index = -1) => {
    if (!song) return;

    setPlayerError(null);

    // Update queue if provided
    if (newQueue && Array.isArray(newQueue) && newQueue.length > 0) {
      setQueue(newQueue);
      const targetKey = getSongKey(song);
      const idx = index !== -1 ? index : newQueue.findIndex((s) => getSongKey(s) === targetKey);
      setCurrentIndex(idx !== -1 ? idx : 0);
      registerAvailableSongs(newQueue);
    } else if (index !== -1) {
      setCurrentIndex(index);
    }

    setCurrentSong(song);
    addToRecentlyPlayed(song);

    const audio = audioRef.current;
    if (song.url && song.url.trim()) {
      audio.src = song.url;
      audio.load();
      audio.play().then(() => {
        setIsPlaying(true);
      }).catch((err) => {
        console.warn('Audio play failed or blocked:', err.message);
        setPlayerError('Playback error: Unable to stream audio');
        setIsPlaying(false);
      });
    } else {
      setPlayerError('This song cannot be played right now.');
      setIsPlaying(false);
    }
  }, [addToRecentlyPlayed, registerAvailableSongs]);

  // Toggle Play / Pause
  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!currentSong) {
      if (queue.length > 0) {
        playSong(queue[0], queue, 0);
      }
      return;
    }

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().then(() => {
        setIsPlaying(true);
      }).catch((err) => {
        console.error('Play resume failed:', err);
      });
    }
  }, [currentSong, isPlaying, queue, playSong]);

  // Next song handler with full AUTOPLAY requirements
  const handleNextSong = useCallback(async () => {
    const currentKey = getSongKey(currentSong);

    // 1. If an existing queue exists, find next playable track
    if (queue.length > 0) {
      if (isShuffled) {
        const validOptions = queue
          .map((s, idx) => ({ s, idx }))
          .filter((item) => item.idx !== currentIndex && item.s?.url && item.s.url.trim());

        if (validOptions.length > 0) {
          const picked = validOptions[Math.floor(Math.random() * validOptions.length)];
          playSong(picked.s, queue, picked.idx);
          return;
        }
      }

      // Sequential scan forward in queue for a valid song
      let nextIdx = currentIndex + 1;
      while (nextIdx < queue.length) {
        const candidate = queue[nextIdx];
        if (candidate && candidate.url && candidate.url.trim()) {
          playSong(candidate, queue, nextIdx);
          return;
        }
        nextIdx++;
      }

      // If at end of queue and repeatMode is 'all', wrap around
      if (repeatMode === 'all') {
        for (let i = 0; i < queue.length; i++) {
          if (queue[i] && queue[i].url && queue[i].url.trim()) {
            playSong(queue[i], queue, i);
            return;
          }
        }
      }
    }

    // 2. Queue ended or no queue: pick next song automatically from candidates
    const candidateList = [
      ...availableSongsPoolRef.current,
      ...likedSongs,
      ...recentlyPlayed,
    ].filter((s) => {
      if (!s || !s.url || !s.url.trim() || !s.title) return false;
      return getSongKey(s) !== currentKey;
    });

    // Deduplicate candidates
    const seen = new Set();
    const uniqueCandidates = [];
    for (const c of candidateList) {
      const key = getSongKey(c);
      if (key && !seen.has(key)) {
        seen.add(key);
        uniqueCandidates.push(c);
      }
    }

    if (uniqueCandidates.length > 0) {
      // Pick next valid song from candidates
      const nextSong = uniqueCandidates[Math.floor(Math.random() * uniqueCandidates.length)];
      playSong(nextSong, uniqueCandidates, 0);
      return;
    }

    // 3. If local pool exhausted, fetch trending songs dynamically
    try {
      const trending = await getTrendingSongs();
      const validTrending = (trending || []).filter((s) => {
        if (!s || !s.url || !s.url.trim() || !s.title) return false;
        return getSongKey(s) !== currentKey;
      });

      if (validTrending.length > 0) {
        registerAvailableSongs(validTrending);
        const nextSong = validTrending[0];
        playSong(nextSong, validTrending, 0);
        return;
      }
    } catch (err) {
      console.warn('Autoplay fetch fallback failed:', err.message);
    }

    // 4. If only 1 song exists or none available, gracefully stop to avoid infinite loop
    setIsPlaying(false);
  }, [queue, currentIndex, isShuffled, repeatMode, currentSong, likedSongs, recentlyPlayed, playSong, registerAvailableSongs]);

  // Previous song handler
  const handlePrevSong = useCallback(() => {
    const audio = audioRef.current;
    if (audio.currentTime > 3) {
      audio.currentTime = 0;
      return;
    }

    if (queue.length === 0) return;

    let prevIdx = currentIndex - 1;
    if (prevIdx < 0) {
      prevIdx = repeatMode === 'all' ? queue.length - 1 : 0;
    }

    if (queue[prevIdx]) {
      playSong(queue[prevIdx], queue, prevIdx);
    }
  }, [queue, currentIndex, repeatMode, playSong]);

  // Seek handler
  const seek = useCallback((time) => {
    const audio = audioRef.current;
    if (audio) {
      audio.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  // Volume handler
  const setVolumeLevel = useCallback((val) => {
    const clamped = Math.max(0, Math.min(1, val));
    setVolume(clamped);
    if (clamped > 0 && isMuted) {
      setIsMuted(false);
    }
  }, [isMuted]);

  // Toggle Mute
  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
  }, []);

  // Toggle Shuffle
  const toggleShuffle = useCallback(() => {
    setIsShuffled((prev) => !prev);
  }, []);

  // Toggle Repeat
  const toggleRepeat = useCallback(() => {
    setRepeatMode((prev) => {
      if (prev === 'off') return 'all';
      if (prev === 'all') return 'one';
      return 'off';
    });
  }, []);

  // Stable refs for event listeners to avoid stale closures or re-binding
  const handleNextSongRef = useRef(handleNextSong);
  useEffect(() => {
    handleNextSongRef.current = handleNextSong;
  }, [handleNextSong]);

  const repeatModeRef = useRef(repeatMode);
  useEffect(() => {
    repeatModeRef.current = repeatMode;
  }, [repeatMode]);

  // Single HTML5 Audio event listeners setup
  useEffect(() => {
    const audio = audioRef.current;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration || 0);
      setPlayerError(null);
    };

    const handleEnded = () => {
      if (repeatModeRef.current === 'one') {
        audio.currentTime = 0;
        audio.play().catch(console.error);
      } else {
        // Trigger automatic next song playback
        handleNextSongRef.current();
      }
    };

    const handleError = () => {
      console.warn('Audio playback error occurred for URL:', audio.src);
      setPlayerError('This song cannot be played right now.');
      setIsPlaying(false);
      // Skip invalid song automatically after short delay
      setTimeout(() => {
        handleNextSongRef.current();
      }, 1200);
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
    };
  }, []);

  // Fetch lyrics for a song without opening the popup modal
  const fetchLyrics = useCallback(async (songToFetch = null) => {
    const targetSong = songToFetch || currentSong;
    if (!targetSong) return;

    const targetId = getSongKey(targetSong);
    setLyricsSong(targetSong);

    if (lyricsFetchedId === targetId) {
      setLyricsLoading(false);
      return;
    }

    if (targetSong.has_lyrics === false && !targetSong.lyrics) {
      setLyricsText(null);
      setLyricsLoading(false);
      setLyricsFetchedId(targetId);
      return;
    }

    setLyricsLoading(true);
    setLyricsText(null);

    try {
      const lyrics = await getLyrics(targetId);
      if (lyrics && typeof lyrics === 'string' && lyrics.trim() && lyrics.trim() !== 'null') {
        setLyricsText(lyrics.trim());
      } else {
        setLyricsText(null);
      }
    } catch (err) {
      console.warn('Failed to load lyrics:', err.message);
      setLyricsText(null);
    } finally {
      setLyricsLoading(false);
      setLyricsFetchedId(targetId);
    }
  }, [currentSong, lyricsFetchedId]);

  // Open Lyrics Modal and fetch lyrics on demand (for explicit button clicks)
  const openLyrics = useCallback(async (songToFetch = null) => {
    setLyricsOpen(true);
    await fetchLyrics(songToFetch);
  }, [fetchLyrics]);

  const closeLyrics = useCallback(() => {
    setLyricsOpen(false);
  }, []);

  const clearRecentlyPlayed = useCallback(() => {
    setRecentlyPlayed([]);
    try {
      localStorage.removeItem(STORAGE_KEY_RECENTLY_PLAYED);
    } catch {}
  }, []);

  const value = {
    currentSong,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    queue,
    currentIndex,
    repeatMode,
    isShuffled,
    playerError,
    isMobilePlayerExpanded,
    setIsMobilePlayerExpanded,
    lyricsOpen,
    lyricsSong,
    lyricsText,
    lyricsLoading,
    likedSongs,
    isSongLiked,
    toggleLike,
    removeLikedSong,
    registerAvailableSongs,
    recentlyPlayed,
    playSong,
    togglePlay,
    playNext: handleNextSong,
    playPrevious: handlePrevSong,
    seek,
    setVolumeLevel,
    toggleMute,
    toggleShuffle,
    toggleRepeat,
    fetchLyrics,
    openLyrics,
    closeLyrics,
    clearRecentlyPlayed,
  };

  return (
    <MusicPlayerContext.Provider value={value}>
      {children}
    </MusicPlayerContext.Provider>
  );
}

export function useMusicPlayer() {
  const context = useContext(MusicPlayerContext);
  if (!context) {
    throw new Error('useMusicPlayer must be used within a MusicPlayerProvider');
  }
  return context;
}
