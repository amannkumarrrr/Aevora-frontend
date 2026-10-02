import React from 'react';
import { Play, Pause, FileText, Heart, ListStart } from 'lucide-react';
import { useMusicPlayer } from '../context/MusicPlayerContext';
import { formatTime } from '../utils/formatTime';
import QueueButton from './QueueButton';

export { QueueButton };

export default function SongCard({
  song,
  songList = null,
  index = -1,
  variant = 'card', // 'card' (vertical grid card) | 'pick' (horizontal column row)
  style = {},
  className = '',
}) {
  const {
    currentSong,
    isPlaying,
    playSong,
    togglePlay,
    openLyrics,
    isSongLiked,
    toggleLike,
    playNextSong,
  } = useMusicPlayer();

  if (!song) return null;

  const isCurrent = currentSong && (currentSong.id === song.id || currentSong.songid === song.songid);
  const isThisPlaying = isCurrent && isPlaying;
  const isLiked = isSongLiked(song);

  const handleCardClick = (e) => {
    // If clicking on an action button, do not toggle play
    if (e.target.closest('.card-action-btn') || e.target.closest('.song-card-queue-btn')) return;

    if (isCurrent) {
      togglePlay();
    } else {
      playSong(song, songList, index);
    }
  };

  const handlePlayNextClick = (e) => {
    e.stopPropagation();
    playNextSong(song);
  };

  const handleLyricsClick = (e) => {
    e.stopPropagation();
    openLyrics(song);
  };

  // -------------------------------------------------------------
  // VARIANT B: Horizontal Column Row (Quick Picks, Made For You, etc.)
  // -------------------------------------------------------------
  if (variant === 'pick') {
    return (
      <div
        className={`echo-pick-item ${isCurrent ? 'active' : ''} ${className}`}
        onClick={handleCardClick}
        title={`Play ${song.title} by ${song.singers}`}
        style={style}
      >
        <div className="echo-pick-thumb-wrap">
          <img
            src={song.image_url}
            alt={song.title}
            className="echo-pick-thumb"
            loading="lazy"
            onError={(e) => {
              e.target.src = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&h=500&fit=crop';
            }}
          />
          <div className="echo-pick-overlay">
            {isThisPlaying ? (
              <Pause size={18} fill="#fff" />
            ) : (
              <Play size={18} fill="#fff" style={{ marginLeft: 2 }} />
            )}
          </div>
        </div>

        <div className="echo-pick-info">
          <h4 className="echo-pick-title">{song.title}</h4>
          <div className="echo-pick-sub">
            <span className="echo-explicit-badge">E</span>
            <span className="echo-pick-artist">{song.singers}</span>
          </div>
        </div>

        {/* Universal Actions Area */}
        <div className="echo-pick-actions">
          {/* Universal Add-to-Queue button with hover on desktop & touch on mobile */}
          <QueueButton song={song} size={15} />

          {/* Play Next action */}
          <button
            type="button"
            className="card-action-btn song-card-playnext-btn"
            onClick={handlePlayNextClick}
            title="Play next (immediately after current song)"
            aria-label={`Play ${song.title} next`}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-dim)',
              cursor: 'pointer',
              padding: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ListStart size={15} />
          </button>

          {/* Like button */}
          <button
            type="button"
            className="card-action-btn"
            onClick={(e) => {
              e.stopPropagation();
              toggleLike(song);
            }}
            title={isLiked ? 'Remove from Liked Songs' : 'Save to Liked Songs'}
            aria-label={isLiked ? 'Remove from Liked Songs' : 'Save to Liked Songs'}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 4,
              color: isLiked ? '#f43f5e' : 'var(--text-dim)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'transform 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.2)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            <Heart
              size={16}
              fill={isLiked ? '#f43f5e' : 'none'}
              color={isLiked ? '#f43f5e' : 'currentColor'}
            />
          </button>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // VARIANT A: Standard Vertical Song Card (Search Results, Albums, etc.)
  // -------------------------------------------------------------
  return (
    <div
      className={`song-card ${isCurrent ? 'is-active' : ''} ${className}`}
      onClick={handleCardClick}
      title={`Play ${song.title} by ${song.singers}`}
      style={style}
    >
      <div className="song-thumb-wrap">
        <img
          src={song.image_url}
          alt={song.title}
          className="song-thumb"
          loading="lazy"
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&h=500&fit=crop';
          }}
        />

        {/* Hover / Active Play Button Overlay */}
        <div className="song-play-overlay">
          <button
            type="button"
            className="play-bubble-btn"
            aria-label={isThisPlaying ? 'Pause' : 'Play'}
            onClick={handleCardClick}
          >
            {isThisPlaying ? <Pause size={20} fill="#fff" /> : <Play size={20} fill="#fff" style={{ marginLeft: 2 }} />}
          </button>
        </div>

        {/* Sound wave badge when active */}
        {isThisPlaying && (
          <div
            style={{
              position: 'absolute',
              bottom: 8,
              right: 8,
              background: 'rgba(0, 0, 0, 0.75)',
              padding: '4px 8px',
              borderRadius: 'var(--radius-full)',
            }}
          >
            <div className="sound-wave">
              <span className="sound-bar"></span>
              <span className="sound-bar"></span>
              <span className="sound-bar"></span>
              <span className="sound-bar"></span>
            </div>
          </div>
        )}
      </div>

      <div className="song-info">
        <h4 className="song-title">{song.title}</h4>
        <p className="song-artist">{song.singers}</p>

        <div className="song-meta-row">
          <span className="song-album" title={song.album}>
            {song.album || 'Single'}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>{formatTime(song.duration)}</span>

            {/* Play Next Button (Desktop hover & mobile touch) */}
            <button
              type="button"
              className="card-action-btn song-card-playnext-btn"
              onClick={handlePlayNextClick}
              title="Play next (immediately after current song)"
              aria-label={`Play ${song.title} next`}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-dim)',
                cursor: 'pointer',
                padding: '2px',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <ListStart size={14} />
            </button>

            {/* Add to Queue Button (Desktop hover & mobile touch with checkmark feedback) */}
            <QueueButton song={song} size={14} />

            {/* Like Button */}
            <button
              type="button"
              className="card-action-btn"
              onClick={(e) => {
                e.stopPropagation();
                toggleLike(song);
              }}
              title={isLiked ? 'Unlike' : 'Like'}
              aria-label={isLiked ? 'Unlike' : 'Like'}
              style={{
                background: 'none',
                border: 'none',
                color: isLiked ? '#f43f5e' : 'var(--text-dim)',
                cursor: 'pointer',
                padding: '2px',
                display: 'flex',
                alignItems: 'center',
                transition: 'transform 0.15s ease, color 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.2)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            >
              <Heart
                size={14}
                fill={isLiked ? '#f43f5e' : 'none'}
                color={isLiked ? '#f43f5e' : 'currentColor'}
              />
            </button>

            {/* Lyrics Button */}
            <button
              type="button"
              className="card-action-btn"
              onClick={handleLyricsClick}
              title="View lyrics"
              aria-label="View lyrics"
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-dim)',
                cursor: 'pointer',
                padding: '2px',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <FileText size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
