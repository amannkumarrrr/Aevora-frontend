import React from 'react';
import { Link } from 'react-router-dom';
import { useMusicPlayer } from '../context/MusicPlayerContext';
import { Heart, Play, Pause, Clock, Music } from 'lucide-react';
import { formatTime } from '../components/SongCard';

export default function LikedSongs() {
  const {
    likedSongs,
    currentSong,
    isPlaying,
    playSong,
    togglePlay,
    toggleLike,
    isSongLiked,
  } = useMusicPlayer();

  const handlePlayAll = () => {
    if (likedSongs.length > 0) {
      playSong(likedSongs[0], likedSongs, 0);
    }
  };

  const isCurrentPlaying = (song) => {
    if (!currentSong || !song) return false;
    const currentKey = currentSong.songid || currentSong.id || currentSong.url;
    const songKey = song.songid || song.id || song.url;
    return currentKey === songKey && isPlaying;
  };

  const isCurrentActive = (song) => {
    if (!currentSong || !song) return false;
    const currentKey = currentSong.songid || currentSong.id || currentSong.url;
    const songKey = song.songid || song.id || song.url;
    return currentKey === songKey;
  };

  const totalDuration = likedSongs.reduce((acc, s) => acc + (Number(s.duration) || 0), 0);
  const totalMins = Math.floor(totalDuration / 60);

  return (
    <div className="echo-liked-page">
      {/* Header Banner */}
      <div className="echo-liked-banner">
        {/* Heart Artwork Box */}
        <div className="echo-liked-artwork">
          <Heart className="echo-liked-banner-heart" size={64} fill="#ffffff" color="#ffffff" />
        </div>

        {/* Info Column */}
        <div className="echo-liked-info-col">
          <span className="echo-liked-badge">
            Playlist
          </span>
          <h1 className="echo-liked-heading">
            Liked Songs
          </h1>
          <p className="echo-liked-meta">
            Saved to this device • <strong style={{ color: '#fff' }}>{likedSongs.length}</strong>{' '}
            song{likedSongs.length === 1 ? '' : 's'}
            {totalMins > 0 ? ` • about ${totalMins} min` : ''}
          </p>
        </div>
      </div>

      {/* Action Bar */}
      {likedSongs.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
          <button
            type="button"
            className="btn-primary"
            onClick={handlePlayAll}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 24px',
              fontSize: '0.92rem',
              fontWeight: 700,
              borderRadius: 'var(--radius-full)',
            }}
          >
            <Play size={18} fill="#000" color="#000" />
            Play All
          </button>
        </div>
      )}

      {/* Empty State */}
      {likedSongs.length === 0 ? (
        <div
          className="glass-panel"
          style={{
            padding: '64px 24px',
            textAlign: 'center',
            maxWidth: '520px',
            margin: '40px auto',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            borderRadius: 20,
          }}
        >
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.05)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 18,
            }}
          >
            <Heart size={36} color="var(--text-dim)" />
          </div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: 8, color: '#fff' }}>
            No liked songs yet
          </h2>
          <p
            style={{
              color: 'var(--text-muted)',
              fontSize: '0.92rem',
              lineHeight: 1.5,
              marginBottom: 24,
              maxWidth: 380,
            }}
          >
            Songs you like by tapping the heart icon will appear here. They are saved directly to this browser.
          </p>
          <Link to="/" className="btn-primary" style={{ padding: '10px 24px', borderRadius: 'var(--radius-full)' }}>
            Explore Music
          </Link>
        </div>
      ) : (
        /* Liked Songs List Table */
        <div className="echo-liked-table">
          {/* Table Header */}
          <div className="echo-liked-table-header">
            <span className="col-idx">#</span>
            <span className="col-title">Title</span>
            <span className="col-album">Album</span>
            <span className="col-dur" style={{ textAlign: 'right' }}>
              <Clock size={14} style={{ display: 'inline', verticalAlign: 'middle' }} />
            </span>
            <span className="col-like" style={{ textAlign: 'center' }}>Like</span>
          </div>

          {/* Song Rows */}
          {likedSongs.map((song, idx) => {
            const isPlayingThis = isCurrentPlaying(song);
            const isActiveThis = isCurrentActive(song);
            const isLiked = isSongLiked(song);

            return (
              <div
                key={song.songid || song.id || idx}
                className={`echo-liked-row ${isActiveThis ? 'is-active' : ''}`}
                onClick={() => {
                  if (isActiveThis) {
                    togglePlay();
                  } else {
                    playSong(song, likedSongs, idx);
                  }
                }}
                title={`Play ${song.title}`}
              >
                {/* Index / Play indicator */}
                <div className="col-idx">
                  {isPlayingThis ? (
                    <Pause size={16} fill="currentColor" />
                  ) : (
                    <span>{idx + 1}</span>
                  )}
                </div>

                {/* Track Info (Thumb + Title + Artist) */}
                <div className="col-title echo-liked-track-info">
                  <img
                    src={song.image_url}
                    alt={song.title}
                    className="echo-liked-thumb"
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&h=500&fit=crop';
                    }}
                  />
                  <div className="echo-liked-track-text">
                    <div className="echo-liked-track-title" style={{ color: isActiveThis ? '#f43f5e' : '#ffffff' }}>
                      {song.title}
                    </div>
                    <div className="echo-liked-track-artist">
                      {song.singers}
                    </div>
                  </div>
                </div>

                {/* Album */}
                <div className="col-album echo-liked-album">
                  {song.album || '—'}
                </div>

                {/* Duration */}
                <div className="col-dur echo-liked-dur">
                  {formatTime(song.duration)}
                </div>

                {/* Like / Unlike Button */}
                <div className="col-like echo-liked-action">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleLike(song);
                    }}
                    title={isLiked ? 'Remove from Liked Songs' : 'Like'}
                    className="echo-liked-heart-btn"
                  >
                    <Heart
                      size={18}
                      fill={isLiked ? '#f43f5e' : 'none'}
                      color={isLiked ? '#f43f5e' : 'currentColor'}
                    />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

