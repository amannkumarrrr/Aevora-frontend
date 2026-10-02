import React, { useState, useEffect, useRef } from 'react';
import { useMusicPlayer } from '../context/MusicPlayerContext';
import {
  ChevronDown,
  ListMusic,
  Heart,
  MoreHorizontal,
  Shuffle,
  SkipBack,
  SkipForward,
  Play,
  Pause,
  Repeat,
  Repeat1,
  Mic2,
  Loader2,
} from 'lucide-react';
import { formatTime } from '../utils/formatTime';
import QueueModal from './QueueModal';
import { extractDominantColors } from '../utils/colorExtractor';

export default function NowPlayingView({ isOpen, onClose }) {
  const {
    currentSong,
    isPlaying,
    currentTime,
    duration,
    isShuffled,
    repeatMode,
    lyricsText,
    lyricsLoading,
    togglePlay,
    playNext,
    playPrevious,
    seek,
    toggleShuffle,
    toggleRepeat,
    fetchLyrics,
    isSongLiked,
    toggleLike,
  } = useMusicPlayer();

  const [queueOpen, setQueueOpen] = useState(false);
  const [themePalette, setThemePalette] = useState(null);
  const attemptedSongRef = useRef(null);
  const activeLineRef = useRef(null);

  // Close with Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body/document scroll when Now Playing is open (restore on close)
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);


  // Automatically fetch lyrics if not already loaded when entering this view (once per song)
  useEffect(() => {
    const songId = currentSong?.songid || currentSong?.id || currentSong?.url;
    if (isOpen && currentSong && songId && songId !== attemptedSongRef.current) {
      attemptedSongRef.current = songId;
      fetchLyrics(currentSong);
    }
  }, [isOpen, currentSong, fetchLyrics]);

  // Dynamically extract dominant colors from current song's artwork
  useEffect(() => {
    let isCurrent = true;
    if (currentSong?.image_url) {
      extractDominantColors(currentSong.image_url).then((palette) => {
        if (isCurrent) {
          setThemePalette(palette);
        }
      });
    }
    return () => {
      isCurrent = false;
    };
  }, [currentSong?.image_url]);

  const percent = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Split lyrics into lines for synchronized-style presentation
  const lyricsLines = lyricsText ? lyricsText.split('\n').filter((l) => l.trim().length > 0) : [];
  
  // Estimate active line based on current track progress
  const activeLineIndex = lyricsLines.length > 0 && duration > 0
    ? Math.min(Math.floor((currentTime / duration) * lyricsLines.length), lyricsLines.length - 1)
    : 0;

  // Auto-scroll active lyric line smoothly into center view
  useEffect(() => {
    if (activeLineRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [activeLineIndex]);

  if (!isOpen || !currentSong) return null;

  return (
    <div
      className="echo-now-playing-fullscreen"
      role="dialog"
      aria-modal="true"
    >
      {/* Dedicated Subtle Dynamic Ambient Background Layer (Behind UI content) */}
      <div className="now-playing-background" aria-hidden="true">
        <div
          className="now-playing-ambient-orb"
          style={{
            background: themePalette
              ? `radial-gradient(circle at 75% 30%, rgba(${themePalette.r}, ${themePalette.g}, ${themePalette.b}, 0.28) 0%, rgba(${themePalette.r}, ${themePalette.g}, ${themePalette.b}, 0.10) 45%, transparent 70%),
                 radial-gradient(circle at 25% 75%, rgba(${themePalette.r}, ${themePalette.g}, ${themePalette.b}, 0.12) 0%, transparent 55%)`
              : 'none',
            opacity: themePalette ? 1 : 0,
          }}
        />
      </div>

      {/* Main UI Content Layer */}
      <div className="now-playing-content">
        {/* Top Bar with minimize chevron on left and queue on right */}
        <div className="echo-np-top-bar">
          <button
            type="button"
            className="echo-np-icon-btn"
            onClick={onClose}
            title="Minimize player"
            aria-label="Minimize player"
          >
            <ChevronDown size={28} />
          </button>

          <button
            type="button"
            className="echo-np-icon-btn"
            onClick={() => setQueueOpen(true)}
            title="Queue"
            aria-label="View queue"
          >
            <ListMusic size={24} />
          </button>
        </div>

        {/* Main Container: Left Column (Player) + Right Column (Lyrics) */}
        <div className="echo-np-container">
          {/* LEFT COLUMN: Large Artwork, Track Details, and Controls */}
          <div className="echo-np-left">
            <div className="echo-np-artwork-wrap">
              <img
                src={currentSong.image_url}
                alt={currentSong.title}
                className="echo-np-artwork"
                onError={(e) => {
                  e.target.src = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&h=500&fit=crop';
                }}
              />
            </div>

            {/* Title, Artist, and Favorite/Options */}
            <div className="echo-np-meta-row">
              <div className="echo-np-titles">
                <h1 className="echo-np-title">{currentSong.title}</h1>
                <p className="echo-np-artist">{currentSong.singers}</p>
              </div>

              <div className="echo-np-actions">
                <button
                  type="button"
                  className={`echo-np-heart-btn ${isSongLiked(currentSong) ? 'liked' : ''}`}
                  onClick={() => toggleLike(currentSong)}
                  title={isSongLiked(currentSong) ? 'Remove from Liked Songs' : 'Save to Liked Songs'}
                  aria-label={isSongLiked(currentSong) ? 'Remove from Liked Songs' : 'Save to Liked Songs'}
                >
                  <Heart
                    size={22}
                    fill={isSongLiked(currentSong) ? '#f43f5e' : 'none'}
                    color={isSongLiked(currentSong) ? '#f43f5e' : '#fff'}
                  />
                </button>

                <button
                  type="button"
                  className="echo-np-more-btn"
                  title="More options"
                  aria-label="More options"
                  onClick={() => setQueueOpen(true)}
                >
                  <MoreHorizontal size={22} color="#fff" />
                </button>
              </div>
            </div>

            {/* Progress Slider and Timestamps */}
            <div className="echo-np-progress-section">
              <input
                type="range"
                min={0}
                max={duration || 100}
                step={0.1}
                value={currentTime || 0}
                onChange={(e) => seek(parseFloat(e.target.value))}
                className="echo-np-slider"
                style={{
                  background: `linear-gradient(to right, #ffffff 0%, #ffffff ${percent}%, rgba(255, 255, 255, 0.22) ${percent}%, rgba(255, 255, 255, 0.22) 100%)`,
                }}
                aria-label="Seek track position"
              />
              <div className="echo-np-time-row">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Controls Row: Shuffle, Prev, Big White Play/Pause, Next, Repeat */}
            <div className="echo-np-controls-row">
              <button
                type="button"
                className={`echo-np-ctrl-btn ${isShuffled ? 'active' : ''}`}
                onClick={toggleShuffle}
                title={isShuffled ? 'Shuffle: On' : 'Shuffle: Off'}
                aria-label="Toggle shuffle"
              >
                <Shuffle size={20} />
              </button>

              <button
                type="button"
                className="echo-np-ctrl-btn"
                onClick={playPrevious}
                title="Previous track"
                aria-label="Previous track"
              >
                <SkipBack size={24} fill="currentColor" />
              </button>

              {/* Big White Circular Play Button */}
              <button
                type="button"
                className="echo-np-play-circle"
                onClick={togglePlay}
                title={isPlaying ? 'Pause' : 'Play'}
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? (
                  <Pause size={24} fill="#000" color="#000" />
                ) : (
                  <Play size={24} fill="#000" color="#000" style={{ marginLeft: 3 }} />
                )}
              </button>

              <button
                type="button"
                className="echo-np-ctrl-btn"
                onClick={playNext}
                title="Next track"
                aria-label="Next track"
              >
                <SkipForward size={24} fill="currentColor" />
              </button>

              <button
                type="button"
                className={`echo-np-ctrl-btn ${repeatMode !== 'off' ? 'active' : ''}`}
                onClick={toggleRepeat}
                title={`Repeat: ${repeatMode}`}
                aria-label={`Toggle repeat (currently ${repeatMode})`}
              >
                {repeatMode === 'one' ? <Repeat1 size={20} /> : <Repeat size={20} />}
              </button>
            </div>
          </div>

          {/* RIGHT COLUMN: Synchronized Lyrics Display matching Screenshot 2 */}
          <div className="echo-np-right">
            <div className="echo-lyrics-scroll-container">
              {lyricsLoading ? (
                <div className="echo-lyrics-loading">
                  <Loader2 size={36} className="spin" style={{ color: 'rgba(255, 255, 255, 0.7)', animation: 'spin 1s linear infinite' }} />
                  <p>Loading lyrics...</p>
                </div>
              ) : lyricsLines.length > 0 ? (
                <div className="echo-lyrics-lines">
                  {lyricsLines.map((line, idx) => {
                    const isActive = idx === activeLineIndex;
                    return (
                      <p
                        key={idx}
                        ref={isActive ? activeLineRef : null}
                        className={`echo-lyrics-line ${isActive ? 'active' : ''}`}
                        onClick={() => {
                          const targetTime = (idx / lyricsLines.length) * duration;
                          seek(targetTime);
                        }}
                      >
                        {line}
                      </p>
                    );
                  })}
                </div>
              ) : (
                <div className="echo-lyrics-empty">
                  <Mic2 size={44} style={{ opacity: 0.35, marginBottom: 14 }} />
                  <h3>{currentSong.title}</h3>
                  <p style={{ opacity: 0.6, marginTop: 6 }}>Lyrics are not available for this song.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Queue Modal */}
      <QueueModal isOpen={queueOpen} onClose={() => setQueueOpen(false)} />
    </div>
  );
}

