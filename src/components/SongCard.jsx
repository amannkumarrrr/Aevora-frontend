import React from 'react';
import { Play, Pause, FileText, Music, Heart } from 'lucide-react';
import { useMusicPlayer } from '../context/MusicPlayerContext';

export function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00';
  const total = Math.floor(Number(seconds));
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export default function SongCard({ song, songList = [], index = 0 }) {
  const {
    currentSong,
    isPlaying,
    playSong,
    togglePlay,
    openLyrics,
    isSongLiked,
    toggleLike,
  } = useMusicPlayer();

  const isCurrent = currentSong && (currentSong.id === song.id || currentSong.songid === song.songid);
  const isThisPlaying = isCurrent && isPlaying;
  const isLiked = isSongLiked(song);

  const handleCardClick = (e) => {
    // If clicking on lyrics button, do not toggle play
    if (e.target.closest('.card-action-btn')) return;

    if (isCurrent) {
      togglePlay();
    } else {
      playSong(song, songList, index);
    }
  };

  const handleLyricsClick = (e) => {
    e.stopPropagation();
    openLyrics(song);
  };

  return (
    <div
      className={`song-card ${isCurrent ? 'is-active' : ''}`}
      onClick={handleCardClick}
      title={`Play ${song.title} by ${song.singers}`}
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
            <button
              type="button"
              className="card-action-btn"
              onClick={(e) => {
                e.stopPropagation();
                toggleLike(song);
              }}
              title={isLiked ? 'Unlike' : 'Like'}
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
            <button
              type="button"
              className="card-action-btn"
              onClick={handleLyricsClick}
              title="View lyrics"
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
