import React from 'react';
import SongCard from './SongCard';
import { Music, AlertCircle } from 'lucide-react';

export default function SongList({
  songs = [],
  isLoading = false,
  error = null,
  onRetry = null,
  emptyMessage = 'No songs found.',
  isSearchResult = false,
}) {
  if (isLoading) {
    return (
      <div className="song-grid">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="song-card" style={{ cursor: 'default' }}>
            <div className="skeleton" style={{ width: '100%', aspectRatio: '1/1', borderRadius: 'var(--radius-sm)', marginBottom: 12 }} />
            <div className="skeleton" style={{ height: 16, width: '80%', marginBottom: 8 }} />
            <div className="skeleton" style={{ height: 13, width: '60%', marginBottom: 10 }} />
            <div className="skeleton" style={{ height: 12, width: '40%' }} />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="glass-panel"
        style={{
          padding: '48px 24px',
          textAlign: 'center',
          maxWidth: '540px',
          margin: '30px auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '14px',
        }}
      >
        <div style={{ color: '#f43f5e' }}>
          <AlertCircle size={44} />
        </div>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Connection Issue</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>{error}</p>
        {onRetry && (
          <button type="button" onClick={onRetry} className="btn-primary" style={{ marginTop: 8 }}>
            Try Again
          </button>
        )}
      </div>
    );
  }

  if (!songs || songs.length === 0) {
    return (
      <div
        className="glass-panel"
        style={{
          padding: '48px 24px',
          textAlign: 'center',
          maxWidth: '500px',
          margin: '30px auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <div style={{ color: 'var(--text-dim)' }}>
          <Music size={40} />
        </div>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 600 }}>{emptyMessage}</h3>
        <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>
          Try searching for popular artists like Arijit Singh, Ed Sheeran, Taylor Swift, or Marshmello.
        </p>
      </div>
    );
  }

  return (
    <div className="song-grid">
      {songs.map((song, idx) => (
        <SongCard
          key={song.id || song.songid || idx}
          song={song}
          songList={isSearchResult ? null : songs}
          index={isSearchResult ? -1 : idx}
        />
      ))}
    </div>
  );
}
