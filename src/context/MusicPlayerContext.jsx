import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import { Check, Sparkles } from 'lucide-react';
import { getLyrics, getTrendingSongs, searchSongs } from '../services/musicApi';
import { getSongKey } from '../utils/songUtils';
import { getRecommendedNextSong, generateSmartShuffleQueue } from '../utils/recommendationEngine';

const MusicPlayerContext = createContext(null);

const STORAGE_KEY_LIKED_SONGS = 'echoMusicLikedSongs';
const STORAGE_KEY_RECENTLY_PLAYED = 'echoMusicRecentlyPlayed';
const STORAGE_KEY_VOLUME = 'aurabeat_volume';
const STORAGE_KEY_CROSSFADE = 'aevora_crossfade_duration';
const STORAGE_KEY_SMART_SHUFFLE = 'aevora_smart_shuffle';
const STORAGE_KEY_EXPLICIT_QUEUE = 'aevora_explicit_queue';

/**
 * Safely loads explicit user queue from localStorage
 */
function loadExplicitQueue() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_EXPLICIT_QUEUE);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.map(normalizeLikedSong).filter(Boolean);
    }
    return [];
  } catch (err) {
    console.warn('Failed to load explicit queue from localStorage:', err);
    return [];
  }
}

/**
 * Safely persists explicit user queue to localStorage
 */
function persistExplicitQueue(songs) {
  try {
    localStorage.setItem(STORAGE_KEY_EXPLICIT_QUEUE, JSON.stringify((songs || []).slice(0, 50)));
  } catch (err) {
    console.warn('Failed to save explicit queue to localStorage:', err);
  }
}

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
 * Normalizes a song object to minimal required fields for persistence & playback
 */
function normalizeLikedSong(song) {
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
  const [explicitQueue, setExplicitQueue] = useState(loadExplicitQueue);
  const [smartQueue, setSmartQueue] = useState([]);
  const [isSmartQueueLoading, setIsSmartQueueLoading] = useState(false);

  // Subtle floating toast notification state
  const [toast, setToast] = useState(null);
  const toastTimeoutRef = useRef(null);

  const showToast = useCallback((message, type = 'success') => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    const id = Date.now();
    setToast({ id, message, type });
    toastTimeoutRef.current = setTimeout(() => {
      setToast((prev) => (prev?.id === id ? null : prev));
    }, 2400);
  }, []);
  const [isSmartShuffle, setIsSmartShuffleState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SMART_SHUFFLE);
      return saved !== 'false'; // Default: true (Smart Shuffle is enabled)
    } catch {
      return true;
    }
  });

  const setIsSmartShuffle = useCallback((val) => {
    const boolVal = Boolean(val);
    setIsSmartShuffleState(boolVal);
    try {
      localStorage.setItem(STORAGE_KEY_SMART_SHUFFLE, boolVal.toString());
    } catch {}
  }, []);

  const [repeatMode, setRepeatMode] = useState('off'); // 'off' | 'all' | 'one'
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

  // Crossfade duration state (0 = Off, 2, 4, 6, 8, 10, 12 seconds)
  const [crossfadeDuration, setCrossfadeDurationState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CROSSFADE);
      if (saved !== null) {
        const val = parseInt(saved, 10);
        if ([0, 2, 4, 6, 8, 10, 12].includes(val)) return val;
      }
      return 0; // Default: Off
    } catch {
      return 0;
    }
  });

  const setCrossfadeDuration = useCallback((val) => {
    const num = parseInt(val, 10) || 0;
    setCrossfadeDurationState(num);
    try {
      localStorage.setItem(STORAGE_KEY_CROSSFADE, num.toString());
    } catch {}
  }, []);

  // Managed dual HTML5 Audio instances for seamless crossfade
  const audioRefA = useRef(new Audio());
  const audioRefB = useRef(new Audio());
  const activeAudioKeyRef = useRef('A'); // 'A' or 'B'

  const getActiveAudio = useCallback(() => (activeAudioKeyRef.current === 'A' ? audioRefA.current : audioRefB.current), []);
  const getInactiveAudio = useCallback(() => (activeAudioKeyRef.current === 'A' ? audioRefB.current : audioRefA.current), []);

  const crossfadeDurationRef = useRef(crossfadeDuration);
  useEffect(() => {
    crossfadeDurationRef.current = crossfadeDuration;
  }, [crossfadeDuration]);

  const volumeRef = useRef(volume);
  useEffect(() => {
    volumeRef.current = volume;
  }, [volume]);

  const isMutedRef = useRef(isMuted);
  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  const isSmartShuffleRef = useRef(isSmartShuffle);
  useEffect(() => {
    isSmartShuffleRef.current = isSmartShuffle;
  }, [isSmartShuffle]);

  const explicitQueueRef = useRef(explicitQueue);
  useEffect(() => {
    explicitQueueRef.current = explicitQueue;
  }, [explicitQueue]);

  const smartQueueRef = useRef(smartQueue);
  useEffect(() => {
    smartQueueRef.current = smartQueue;
  }, [smartQueue]);

  const nextRequestIdRef = useRef(0);

  const crossfadeStateRef = useRef({
    status: 'idle', // 'idle' | 'preloading' | 'fading' | 'paused'
    songKey: null,
    nextTrack: null,
    baseProgress: 0,
    progress: 0,
    startTime: 0,
    totalDurationMs: 0,
    remainingMs: 0,
    rafId: null,
    pausedProgress: 0,
  });

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

  // Cleanup on unmount
  useEffect(() => {
    const audioA = audioRefA.current;
    const audioB = audioRefB.current;
    return () => {
      cancelCrossfade(false);
      try {
        audioA.pause();
        audioA.removeAttribute('src');
        audioB.pause();
        audioB.removeAttribute('src');
      } catch {}
    };
  }, []);

  // Update volume on audio elements respecting master volume and crossfade progress
  useEffect(() => {
    const activeAudio = getActiveAudio();
    const inactiveAudio = getInactiveAudio();
    const master = isMuted ? 0 : volume;

    const state = crossfadeStateRef.current;
    if (state.status === 'fading' || state.status === 'paused') {
      const p = state.progress || 0;
      activeAudio.volume = Math.max(0, Math.min(1, master * (1 - p)));
      inactiveAudio.volume = Math.max(0, Math.min(1, master * p));
    } else {
      activeAudio.volume = master;
      inactiveAudio.volume = 0;
    }

    try {
      localStorage.setItem(STORAGE_KEY_VOLUME, volume.toString());
    } catch {}
  }, [volume, isMuted, getActiveAudio, getInactiveAudio]);

  const generateBatchRequestIdRef = useRef(0);

  // Generates a fresh batch of upcoming smart recommendations when currentSong changes
  const generateSmartQueueBatch = useCallback(async (baseSong) => {
    if (!baseSong) return;
    const reqId = ++generateBatchRequestIdRef.current;
    setIsSmartQueueLoading(true);

    try {
      const batch = await generateSmartShuffleQueue(baseSong, {
        recentlyPlayed,
        likedSongs,
        localPool: availableSongsPoolRef.current,
        explicitQueue: explicitQueueRef.current,
        existingSmartQueue: [],
        searchApi: searchSongs,
        trendingApi: getTrendingSongs,
        batchSize: 6,
      });

      if (reqId === generateBatchRequestIdRef.current) {
        setSmartQueue(batch);
        smartQueueRef.current = batch;
      }
    } catch (err) {
      console.warn('[SmartShuffle] Error generating smart batch:', err.message);
    } finally {
      if (reqId === generateBatchRequestIdRef.current) {
        setIsSmartQueueLoading(false);
      }
    }
  }, [recentlyPlayed, likedSongs]);

  const isRefillingRef = useRef(false);

  // Background refill when smart queue gets low (<= 2 songs)
  const triggerSmartQueueRefill = useCallback(async (baseSong, currentRemaining) => {
    if (isRefillingRef.current || !isSmartShuffleRef.current) return;
    isRefillingRef.current = true;

    try {
      const newItems = await generateSmartShuffleQueue(baseSong || currentSong, {
        recentlyPlayed,
        likedSongs,
        localPool: availableSongsPoolRef.current,
        explicitQueue: explicitQueueRef.current,
        existingSmartQueue: currentRemaining,
        searchApi: searchSongs,
        trendingApi: getTrendingSongs,
        batchSize: 5,
      });

      if (newItems && newItems.length > 0) {
        setSmartQueue((prev) => {
          const existingKeys = new Set(prev.map(getSongKey));
          const additions = newItems.filter((s) => !existingKeys.has(getSongKey(s)));
          const updated = [...prev, ...additions];
          smartQueueRef.current = updated;
          return updated;
        });
      }
    } catch (err) {
      console.warn('[SmartShuffle] Refill error:', err.message);
    } finally {
      isRefillingRef.current = false;
    }
  }, [currentSong, recentlyPlayed, likedSongs]);

  // Toggle Smart Shuffle
  const toggleSmartShuffle = useCallback(() => {
    setIsSmartShuffleState((prev) => {
      const next = !prev;
      isSmartShuffleRef.current = next;
      try {
        localStorage.setItem(STORAGE_KEY_SMART_SHUFFLE, next.toString());
      } catch {}
      if (next && smartQueueRef.current.length === 0 && currentSong) {
        generateSmartQueueBatch(currentSong);
      }
      return next;
    });
  }, [currentSong, generateSmartQueueBatch]);

  // Resolves next track based on explicit queue, smart shuffle queue, or fallback
  const resolveNextTrack = useCallback(async () => {
    const currentKey = getSongKey(currentSong);

    // 1. Explicit queue check (User manually queued tracks take absolute priority)
    const curExplicit = explicitQueueRef.current;
    if (curExplicit && curExplicit.length > 0) {
      const nextSong = curExplicit[0];
      const remainingExplicit = curExplicit.slice(1);
      return {
        song: nextSong,
        source: 'explicit',
        newExplicitQueue: remainingExplicit,
      };
    }

    // 2. Smart Shuffle Queue check (Intelligently generated batch)
    if (isSmartShuffleRef.current) {
      const curSmart = smartQueueRef.current;
      if (curSmart && curSmart.length > 0) {
        const nextSong = curSmart[0];
        const remainingSmart = curSmart.slice(1);

        // Auto-refill if remaining is low (<= 2 songs)
        if (remainingSmart.length <= 2) {
          triggerSmartQueueRefill(nextSong, remainingSmart);
        }

        return {
          song: nextSong,
          source: 'smart',
          newSmartQueue: remainingSmart,
        };
      }

      // If smartQueue was temporarily empty, generate immediately on-the-fly
      try {
        const freshBatch = await generateSmartShuffleQueue(currentSong, {
          recentlyPlayed,
          likedSongs,
          localPool: availableSongsPoolRef.current,
          explicitQueue: curExplicit,
          searchApi: searchSongs,
          trendingApi: getTrendingSongs,
          batchSize: 6,
        });

        if (freshBatch && freshBatch.length > 0) {
          const nextSong = freshBatch[0];
          const remainingSmart = freshBatch.slice(1);
          setSmartQueue(remainingSmart);
          smartQueueRef.current = remainingSmart;

          return {
            song: nextSong,
            source: 'smart',
            newSmartQueue: remainingSmart,
          };
        }
      } catch (err) {
        console.warn('[SmartShuffle] On-the-fly batch generation error:', err.message);
      }
    }

    // 3. Fallback: Contextual recommendation engine
    try {
      const nextSong = await getRecommendedNextSong(currentSong, {
        recentlyPlayed,
        likedSongs,
        localPool: availableSongsPoolRef.current,
        searchApi: searchSongs,
        trendingApi: getTrendingSongs,
      });

      if (nextSong && nextSong.url && nextSong.url.trim()) {
        return { song: nextSong, source: 'recommendation' };
      }
    } catch (recErr) {
      console.warn('[SmartShuffle] Direct recommendation error:', recErr.message);
    }

    // 4. Fallback: Trending songs
    try {
      const trending = await getTrendingSongs();
      const validTrending = (trending || []).filter((s) => {
        if (!s || !s.url || !s.url.trim() || !s.title) return false;
        return getSongKey(s) !== currentKey;
      });

      if (validTrending.length > 0) {
        const nextSong = validTrending[Math.floor(Math.random() * validTrending.length)];
        return { song: nextSong, source: 'trending' };
      }
    } catch (err) {
      console.warn('[SmartShuffle] Trending fallback error:', err.message);
    }

    return null;
  }, [currentSong, likedSongs, recentlyPlayed, triggerSmartQueueRefill]);

  // Cancels active crossfade animation and resets inactive audio
  const cancelCrossfade = useCallback((restoreActiveVolume = true) => {
    const state = crossfadeStateRef.current;
    if (state.rafId) {
      cancelAnimationFrame(state.rafId);
      state.rafId = null;
    }

    const inactiveAudio = getInactiveAudio();
    try {
      inactiveAudio.oncanplay = null;
      inactiveAudio.onerror = null;
      inactiveAudio.pause();
      inactiveAudio.currentTime = 0;
      inactiveAudio.removeAttribute('src');
      inactiveAudio.load();
      inactiveAudio.volume = 0;
    } catch {}

    if (restoreActiveVolume) {
      const activeAudio = getActiveAudio();
      activeAudio.volume = isMutedRef.current ? 0 : volumeRef.current;
    }

    crossfadeStateRef.current = {
      status: 'idle',
      songKey: null,
      nextTrack: null,
      baseProgress: 0,
      progress: 0,
      startTime: 0,
      totalDurationMs: 0,
      remainingMs: 0,
      rafId: null,
      pausedProgress: 0,
    };
  }, [getActiveAudio, getInactiveAudio]);

  // Completes crossfade: swaps active audio references and stops old audio
  const completeCrossfade = useCallback(() => {
    const state = crossfadeStateRef.current;
    if (state.rafId) {
      cancelAnimationFrame(state.rafId);
      state.rafId = null;
    }

    const nextTrack = state.nextTrack;
    if (!nextTrack || !nextTrack.song) {
      cancelCrossfade(true);
      return;
    }

    const oldAudio = getActiveAudio();
    try {
      oldAudio.oncanplay = null;
      oldAudio.onerror = null;
      oldAudio.pause();
      oldAudio.currentTime = 0;
      oldAudio.removeAttribute('src');
      oldAudio.load();
      oldAudio.volume = 0;
    } catch {}

    // Swap active audio reference: 'A' <-> 'B'
    activeAudioKeyRef.current = activeAudioKeyRef.current === 'A' ? 'B' : 'A';
    const newActiveAudio = getActiveAudio();
    newActiveAudio.volume = isMutedRef.current ? 0 : volumeRef.current;

    crossfadeStateRef.current = {
      status: 'idle',
      songKey: null,
      nextTrack: null,
      baseProgress: 0,
      progress: 0,
      startTime: 0,
      totalDurationMs: 0,
      remainingMs: 0,
      rafId: null,
      pausedProgress: 0,
    };

    const { song, newExplicitQueue, newSmartQueue } = nextTrack;
    if (newExplicitQueue !== undefined) {
      setExplicitQueue(newExplicitQueue);
      explicitQueueRef.current = newExplicitQueue;
      persistExplicitQueue(newExplicitQueue);
    }
    if (newSmartQueue !== undefined) {
      setSmartQueue(newSmartQueue);
      smartQueueRef.current = newSmartQueue;
    }

    setCurrentSong(song);
    addToRecentlyPlayed(song);
    setIsPlaying(true);
  }, [getActiveAudio, cancelCrossfade, addToRecentlyPlayed]);

  // Animation frame loop for linear volume crossfading
  const runFadeAnimation = useCallback(() => {
    const state = crossfadeStateRef.current;
    if (state.status !== 'fading') return;

    const now = performance.now();
    const elapsed = now - state.startTime;
    const remainingMs = Math.max(100, state.remainingMs || 4000);
    const fraction = Math.min(1, Math.max(0, elapsed / remainingMs));
    const base = state.baseProgress || 0;
    const progress = Math.min(1, Math.max(0, base + (1 - base) * fraction));
    state.progress = progress;

    const activeAudio = getActiveAudio();
    const inactiveAudio = getInactiveAudio();
    const masterVol = isMutedRef.current ? 0 : volumeRef.current;

    // Linear fade: active (1 - t), inactive (t)
    activeAudio.volume = Math.max(0, Math.min(1, masterVol * (1 - progress)));
    inactiveAudio.volume = Math.max(0, Math.min(1, masterVol * progress));

    if (progress < 1) {
      state.rafId = requestAnimationFrame(runFadeAnimation);
    } else {
      completeCrossfade();
    }
  }, [getActiveAudio, getInactiveAudio, completeCrossfade]);

  // Preloads inactive audio and initiates smooth crossfade transition
  const startCrossfadeToTrack = useCallback((nextTrack, fadeDurationSec, reqId = null) => {
    return new Promise((resolve) => {
      if (!nextTrack || !nextTrack.song || !nextTrack.song.url) {
        resolve(false);
        return;
      }

      const currentKey = getSongKey(currentSong);
      const activeAudio = getActiveAudio();
      const inactiveAudio = getInactiveAudio();

      const state = crossfadeStateRef.current;
      state.status = 'preloading';
      state.songKey = currentKey;
      state.nextTrack = nextTrack;

      inactiveAudio.src = nextTrack.song.url;
      inactiveAudio.currentTime = 0;
      inactiveAudio.volume = 0;
      inactiveAudio.load();

      let settled = false;
      const timeoutId = setTimeout(() => {
        if (!settled) {
          settled = true;
          cleanupListeners();
          resolve(false);
        }
      }, 4000);

      const cleanupListeners = () => {
        inactiveAudio.oncanplay = null;
        inactiveAudio.onerror = null;
        clearTimeout(timeoutId);
      };

      const doStartFade = () => {
        if (settled) return;
        settled = true;
        cleanupListeners();

        if (
          (reqId !== null && reqId !== nextRequestIdRef.current) ||
          crossfadeStateRef.current.status !== 'preloading' ||
          crossfadeStateRef.current.songKey !== currentKey ||
          activeAudio.paused
        ) {
          resolve(false);
          return;
        }

        inactiveAudio.play().then(() => {
          const durationMs = fadeDurationSec * 1000;
          crossfadeStateRef.current = {
            status: 'fading',
            songKey: currentKey,
            nextTrack,
            baseProgress: 0,
            progress: 0,
            startTime: performance.now(),
            totalDurationMs: durationMs,
            remainingMs: durationMs,
            rafId: null,
            pausedProgress: 0,
          };
          runFadeAnimation();
          resolve(true);
        }).catch((err) => {
          console.warn('[Crossfade] Playback blocked or failed:', err.message);
          resolve(false);
        });
      };

      inactiveAudio.onerror = () => {
        if (!settled) {
          settled = true;
          cleanupListeners();
          resolve(false);
        }
      };

      if (inactiveAudio.readyState >= 2) {
        doStartFade();
      } else {
        inactiveAudio.oncanplay = doStartFade;
      }
    });
  }, [currentSong, getActiveAudio, getInactiveAudio, runFadeAnimation]);

  // Preloads and initiates crossfade when active audio enters remaining time threshold
  const checkAndTriggerCrossfade = useCallback(async (activeAudio) => {
    const cfDuration = crossfadeDurationRef.current;
    if (cfDuration <= 0) return;

    const dur = activeAudio.duration;
    const curTime = activeAudio.currentTime;
    if (!dur || isNaN(dur) || dur <= 0 || activeAudio.paused) return;

    // Safe crossfade duration for short tracks: max 45% of song duration
    const safeDuration = Math.min(cfDuration, Math.max(0, dur * 0.45));
    if (safeDuration < 1) return;

    const timeRemaining = dur - curTime;
    if (timeRemaining > safeDuration) return;

    const currentKey = getSongKey(currentSong);
    const state = crossfadeStateRef.current;

    // Trigger only if currently idle and not already triggered for this song
    if (state.status !== 'idle' || state.songKey === currentKey) return;

    state.status = 'preloading';
    state.songKey = currentKey;

    try {
      const nextTrack = await resolveNextTrack();
      if (
        crossfadeStateRef.current.status !== 'preloading' ||
        crossfadeStateRef.current.songKey !== currentKey ||
        activeAudio.paused ||
        !nextTrack ||
        !nextTrack.song ||
        !nextTrack.song.url
      ) {
        if (crossfadeStateRef.current.status === 'preloading') {
          cancelCrossfade(true);
        }
        return;
      }

      const started = await startCrossfadeToTrack(nextTrack, safeDuration);
      if (!started && crossfadeStateRef.current.status === 'preloading') {
        cancelCrossfade(true);
      }
    } catch (err) {
      console.warn('[Crossfade] Preload / resolve error:', err.message);
      cancelCrossfade(true);
    }
  }, [currentSong, resolveNextTrack, cancelCrossfade, startCrossfadeToTrack]);

  // Direct audio playback helper without queue re-scoping
  const playSongDirectly = useCallback((song) => {
    if (!song) return;
    setPlayerError(null);

    setCurrentSong(song);
    addToRecentlyPlayed(song);

    const activeAudio = getActiveAudio();
    const inactiveAudio = getInactiveAudio();

    // Ensure inactive audio is stopped and reset
    try {
      inactiveAudio.oncanplay = null;
      inactiveAudio.onerror = null;
      inactiveAudio.pause();
      inactiveAudio.currentTime = 0;
      inactiveAudio.removeAttribute('src');
      inactiveAudio.volume = 0;
    } catch {}

    if (song.url && song.url.trim()) {
      activeAudio.src = song.url;
      activeAudio.volume = isMutedRef.current ? 0 : volumeRef.current;
      activeAudio.load();
      activeAudio.play().then(() => {
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
  }, [addToRecentlyPlayed, getActiveAudio, getInactiveAudio]);

  // User-facing song selection (e.g. clicked from card, search, playlist)
  const playSong = useCallback((song, newQueue = null, index = -1) => {
    if (!song) return;

    cancelCrossfade(false);

    // If newQueue is provided (e.g. Play All from Playlist / Album / Liked Songs)
    if (newQueue && Array.isArray(newQueue) && newQueue.length > 0) {
      const targetKey = getSongKey(song);
      const idx = index !== -1 ? index : newQueue.findIndex((s) => getSongKey(s) === targetKey);
      const remaining = idx !== -1 ? newQueue.slice(idx + 1) : [];
      setExplicitQueue(remaining);
      explicitQueueRef.current = remaining;
      persistExplicitQueue(remaining);
      registerAvailableSongs(newQueue);
    } else {
      // Standalone playback (e.g. clicked from Search Results or individual card)
      // Search results must NOT become the playback queue!
      // If the clicked song was in explicitQueue, remove it cleanly so it doesn't duplicate
      const clickedKey = getSongKey(song);
      setExplicitQueue((prev) => {
        const filtered = prev.filter((s) => getSongKey(s) !== clickedKey);
        explicitQueueRef.current = filtered;
        persistExplicitQueue(filtered);
        return filtered;
      });
    }

    // Immediately trigger fresh Smart Shuffle batch for the newly selected song
    if (isSmartShuffleRef.current) {
      generateSmartQueueBatch(song);
    }

    playSongDirectly(song);
  }, [cancelCrossfade, registerAvailableSongs, generateSmartQueueBatch, playSongDirectly]);

  // 1. Add to Queue: Appends song to the END of explicit queue (prevents duplicates)
  const addToQueue = useCallback((song) => {
    if (!song) return false;
    const normalized = normalizeLikedSong(song) || song;
    const key = getSongKey(normalized);
    if (!key) return false;

    const currentExplicit = explicitQueueRef.current || [];
    const exists = currentExplicit.some((s) => getSongKey(s) === key);
    if (exists) {
      showToast(`"${normalized.title}" is already in queue`, 'info');
      return false;
    }

    const updated = [...currentExplicit, normalized];
    explicitQueueRef.current = updated;
    setExplicitQueue(updated);
    persistExplicitQueue(updated);
    showToast(`Added "${normalized.title}" to queue`, 'success');
    return true;
  }, [showToast]);

  // 2. Play Next: Adds song to the FRONT of explicit queue (immediately after current song)
  const playNextSong = useCallback((song) => {
    if (!song) return false;
    const normalized = normalizeLikedSong(song) || song;
    const key = getSongKey(normalized);
    if (!key) return false;

    const currentExplicit = explicitQueueRef.current || [];
    const filtered = currentExplicit.filter((s) => getSongKey(s) !== key);
    const updated = [normalized, ...filtered];
    explicitQueueRef.current = updated;
    setExplicitQueue(updated);
    persistExplicitQueue(updated);
    showToast(`"${normalized.title}" will play next`, 'success');
    return true;
  }, [showToast]);

  // 3. Move queue item (fromIndex -> toIndex) for reordering
  const moveQueueItem = useCallback((fromIndex, toIndex) => {
    setExplicitQueue((prev) => {
      if (fromIndex < 0 || fromIndex >= prev.length || toIndex < 0 || toIndex >= prev.length) {
        return prev;
      }
      const updated = [...prev];
      const [moved] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, moved);
      explicitQueueRef.current = updated;
      persistExplicitQueue(updated);
      return updated;
    });
  }, []);

  // 4. Bulk reorder explicit queue
  const reorderExplicitQueue = useCallback((newList) => {
    if (!Array.isArray(newList)) return;
    setExplicitQueue(newList);
    explicitQueueRef.current = newList;
    persistExplicitQueue(newList);
  }, []);

  // 5. Remove single song from queue
  const removeFromQueue = useCallback((index, queueType = 'explicit') => {
    if (queueType === 'explicit') {
      setExplicitQueue((prev) => {
        const removed = prev[index];
        const updated = prev.filter((_, idx) => idx !== index);
        explicitQueueRef.current = updated;
        persistExplicitQueue(updated);
        if (removed) {
          showToast(`Removed "${removed.title}" from queue`, 'info');
        }
        return updated;
      });
    } else {
      setSmartQueue((prev) => {
        const updated = prev.filter((_, idx) => idx !== index);
        smartQueueRef.current = updated;
        return updated;
      });
    }
  }, [showToast]);

  // 6. Clear explicit user queue
  const clearExplicitQueue = useCallback(() => {
    setExplicitQueue([]);
    explicitQueueRef.current = [];
    persistExplicitQueue([]);
    showToast('Queue cleared', 'info');
  }, [showToast]);

  // 7. Clear all queues
  const clearQueue = useCallback(() => {
    setExplicitQueue([]);
    explicitQueueRef.current = [];
    persistExplicitQueue([]);
    setSmartQueue([]);
    smartQueueRef.current = [];
    showToast('All queues cleared', 'info');
  }, [showToast]);

  // Toggle Play / Pause
  const togglePlay = useCallback(() => {
    const activeAudio = getActiveAudio();
    const inactiveAudio = getInactiveAudio();
    const state = crossfadeStateRef.current;

    if (!currentSong) {
      if (explicitQueueRef.current.length > 0) {
        playSong(explicitQueueRef.current[0]);
      } else if (smartQueueRef.current.length > 0) {
        playSong(smartQueueRef.current[0]);
      }
      return;
    }

    if (isPlaying) {
      activeAudio.pause();
      if (state.status === 'fading') {
        inactiveAudio.pause();
        if (state.rafId) {
          cancelAnimationFrame(state.rafId);
          state.rafId = null;
        }
        state.status = 'paused';
        state.pausedProgress = state.progress;
      }
      setIsPlaying(false);
    } else {
      activeAudio.play().then(() => {
        setIsPlaying(true);
        if (state.status === 'paused') {
          inactiveAudio.play().then(() => {
            state.status = 'fading';
            const p0 = state.pausedProgress || 0;
            state.baseProgress = p0;
            state.remainingMs = Math.max(100, (1 - p0) * (state.totalDurationMs || 4000));
            state.startTime = performance.now();
            runFadeAnimation();
          }).catch(console.error);
        }
      }).catch((err) => {
        console.error('Play resume failed:', err);
      });
    }
  }, [getActiveAudio, getInactiveAudio, currentSong, isPlaying, playSong, runFadeAnimation]);

  // Next song handler with full AUTOPLAY and SMART CONTEXTUAL RECOMMENDATION
  const handleNextSong = useCallback(async () => {
    const reqId = ++nextRequestIdRef.current;
    cancelCrossfade(false);

    try {
      const nextTrack = await resolveNextTrack();
      if (reqId !== nextRequestIdRef.current) return;

      if (!nextTrack || !nextTrack.song) {
        setIsPlaying(false);
        return;
      }

      const cfDuration = crossfadeDurationRef.current;
      const activeAudio = getActiveAudio();

      // If crossfade is enabled, song is actively playing, and has a loaded duration
      if (cfDuration > 0 && isPlaying && currentSong && activeAudio && !activeAudio.paused && activeAudio.currentTime > 1) {
        const manualFadeDur = Math.min(cfDuration, 3);
        const started = await startCrossfadeToTrack(nextTrack, manualFadeDur, reqId);
        if (started) return;
      }

      // Apply queue state updates
      if (nextTrack.newExplicitQueue !== undefined) {
        setExplicitQueue(nextTrack.newExplicitQueue);
        explicitQueueRef.current = nextTrack.newExplicitQueue;
        persistExplicitQueue(nextTrack.newExplicitQueue);
      }
      if (nextTrack.newSmartQueue !== undefined) {
        setSmartQueue(nextTrack.newSmartQueue);
        smartQueueRef.current = nextTrack.newSmartQueue;
      }

      playSongDirectly(nextTrack.song);
    } catch (err) {
      console.warn('[Player] handleNextSong error:', err.message);
      setIsPlaying(false);
    }
  }, [cancelCrossfade, resolveNextTrack, isPlaying, currentSong, getActiveAudio, playSongDirectly, startCrossfadeToTrack]);

  // Previous song handler
  const handlePrevSong = useCallback(() => {
    const activeAudio = getActiveAudio();
    if (activeAudio.currentTime > 3) {
      activeAudio.currentTime = 0;
      return;
    }

    cancelCrossfade(true);

    // If recently played history is available, play the previous track
    if (recentlyPlayed && recentlyPlayed.length > 1) {
      const prevSong = recentlyPlayed[1];
      if (prevSong) {
        playSong(prevSong);
        return;
      }
    }

    activeAudio.currentTime = 0;
  }, [getActiveAudio, cancelCrossfade, recentlyPlayed, playSong]);

  // Seek handler
  const seek = useCallback((time) => {
    const activeAudio = getActiveAudio();
    if (activeAudio) {
      activeAudio.currentTime = time;
      setCurrentTime(time);

      const dur = activeAudio.duration || 0;
      const cfDuration = crossfadeDurationRef.current;
      const safeDuration = Math.min(cfDuration, Math.max(0, dur * 0.45));

      // If user seeks away from the crossfade zone, cancel active crossfade and restore volume
      if (dur - time > safeDuration + 0.5) {
        cancelCrossfade(true);
      } else if (crossfadeStateRef.current.status !== 'idle') {
        cancelCrossfade(true);
      }
    }
  }, [getActiveAudio, cancelCrossfade]);

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

  // Dual HTML5 Audio event listeners setup
  useEffect(() => {
    const audioA = audioRefA.current;
    const audioB = audioRefB.current;

    const handleTimeUpdate = (e) => {
      if (e.target === getActiveAudio()) {
        setCurrentTime(e.target.currentTime);
        checkAndTriggerCrossfade(e.target);
      }
    };

    const handleLoadedMetadata = (e) => {
      if (e.target === getActiveAudio()) {
        setDuration(e.target.duration || 0);
        setPlayerError(null);
      }
    };

    const handleEnded = (e) => {
      if (e.target === getActiveAudio()) {
        if (repeatModeRef.current === 'one') {
          e.target.currentTime = 0;
          e.target.play().catch(console.error);
        } else if (crossfadeStateRef.current.status === 'fading') {
          completeCrossfade();
        } else {
          cancelCrossfade(false);
          handleNextSongRef.current();
        }
      }
    };

    const handleError = (e) => {
      if (e.target === getActiveAudio()) {
        console.warn('Audio playback error occurred for URL:', e.target.src);
        setPlayerError('This song cannot be played right now.');
        setIsPlaying(false);
        setTimeout(() => {
          handleNextSongRef.current();
        }, 1200);
      } else {
        // Inactive preloaded audio failed
        console.warn('Preloaded audio failed to load:', e.target.src);
        cancelCrossfade(true);
      }
    };

    const handlePlay = (e) => {
      if (e.target === getActiveAudio()) setIsPlaying(true);
    };

    const handlePause = (e) => {
      if (e.target === getActiveAudio() && crossfadeStateRef.current.status !== 'fading') {
        setIsPlaying(false);
      }
    };

    const list = [audioA, audioB];
    list.forEach((aud) => {
      aud.addEventListener('timeupdate', handleTimeUpdate);
      aud.addEventListener('loadedmetadata', handleLoadedMetadata);
      aud.addEventListener('ended', handleEnded);
      aud.addEventListener('error', handleError);
      aud.addEventListener('play', handlePlay);
      aud.addEventListener('pause', handlePause);
    });

    return () => {
      list.forEach((aud) => {
        aud.removeEventListener('timeupdate', handleTimeUpdate);
        aud.removeEventListener('loadedmetadata', handleLoadedMetadata);
        aud.removeEventListener('ended', handleEnded);
        aud.removeEventListener('error', handleError);
        aud.removeEventListener('play', handlePlay);
        aud.removeEventListener('pause', handlePause);
      });
    };
  }, [getActiveAudio, checkAndTriggerCrossfade, cancelCrossfade, completeCrossfade]);

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

    // If song already has non-empty cached lyrics attached, display immediately
    if (targetSong.lyrics && typeof targetSong.lyrics === 'string' && targetSong.lyrics.trim() && targetSong.lyrics.trim() !== 'null') {
      setLyricsText(targetSong.lyrics.trim());
      setLyricsLoading(false);
      setLyricsFetchedId(targetId);
      return;
    }

    setLyricsLoading(true);
    setLyricsText(null);

    try {
      const lyrics = await getLyrics(targetId, targetSong.singers, targetSong.title);
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
    // Unified queue for backwards compatibility
    queue: [...explicitQueue, ...smartQueue],
    explicitQueue,
    smartQueue,
    isSmartQueueLoading,
    currentIndex: currentSong ? 0 : -1,
    repeatMode,
    isShuffled: isSmartShuffle,
    isSmartShuffle,
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
    crossfadeDuration,
    setCrossfadeDuration,
    playSong,
    togglePlay,
    playNext: handleNextSong,
    playPrevious: handlePrevSong,
    seek,
    setVolumeLevel,
    toggleMute,
    toggleShuffle: toggleSmartShuffle,
    toggleSmartShuffle,
    setIsSmartShuffle,
    toggleRepeat,
    fetchLyrics,
    openLyrics,
    closeLyrics,
    clearRecentlyPlayed,
    addToQueue,
    playNextSong,
    moveQueueItem,
    reorderExplicitQueue,
    removeFromQueue,
    clearExplicitQueue,
    clearQueue,
    toast,
    showToast,
  };

  return (
    <MusicPlayerContext.Provider value={value}>
      {children}
      {toast && (
        <div
          className="aevora-floating-toast"
          role="status"
          aria-live="polite"
          style={{
            position: 'fixed',
            bottom: currentSong ? '86px' : '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 99999,
            background: 'rgba(18, 20, 32, 0.94)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(168, 85, 247, 0.35)',
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.6), 0 0 16px rgba(168, 85, 247, 0.25)',
            color: '#ffffff',
            padding: '8px 18px',
            borderRadius: '9999px',
            fontSize: '0.82rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            pointerEvents: 'none',
            animation: 'toastFadeSlide 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards',
          }}
        >
          {toast.type === 'info' ? (
            <Sparkles size={14} color="#a855f7" />
          ) : (
            <Check size={14} color="#a855f7" />
          )}
          <span>{toast.message}</span>
        </div>
      )}
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
