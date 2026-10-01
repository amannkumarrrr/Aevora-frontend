import React, { useEffect } from 'react';
import { X, Mic2, Loader2, Music } from 'lucide-react';
import { useMusicPlayer } from '../context/MusicPlayerContext';

export default function LyricsModal() {
  const { lyricsOpen, lyricsSong, lyricsText, lyricsLoading, closeLyrics } = useMusicPlayer();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && lyricsOpen) {
        closeLyrics();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lyricsOpen, closeLyrics]);

  if (!lyricsOpen) return null;

  return (
    <div className="modal-backdrop" onClick={closeLyrics}>
      <div className="lyrics-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="lyrics-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, overflow: 'hidden' }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 'var(--radius-sm)',
                overflow: 'hidden',
                flexShrink: 0,
                background: '#1a1d2e',
              }}
            >
              {lyricsSong?.image_url ? (
                <img
                  src={lyricsSong.image_url}
                  alt={lyricsSong.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                  <Music size={20} color="var(--text-dim)" />
                </div>
              )}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {lyricsSong?.title || 'Song Lyrics'}
              </h3>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {lyricsSong?.singers || 'Artist'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={closeLyrics}
            className="btn-icon"
            style={{ width: 34, height: 34, flexShrink: 0 }}
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Lyrics Body */}
        <div className="lyrics-content">
          {lyricsLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '40px 0' }}>
              <Loader2 size={32} className="spin" style={{ color: 'var(--accent-primary)', animation: 'spin 1s linear infinite' }} />
              <p style={{ color: 'var(--text-muted)' }}>Loading lyrics...</p>
            </div>
          ) : lyricsText ? (
            <div>{lyricsText}</div>
          ) : (
            <div style={{ padding: '40px 0', color: 'var(--text-muted)' }}>
              <Mic2 size={36} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
              <p style={{ fontSize: '1rem', fontWeight: 600 }}>Lyrics are not available for this song.</p>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginTop: 4 }}>
                We're always adding new lyrics to the database.
              </p>
            </div>
          )}
        </div>

        <div style={{ padding: '14px 24px', borderTop: '1px solid var(--border-subtle)', textAlign: 'right' }}>
          <button type="button" onClick={closeLyrics} className="btn-primary" style={{ padding: '8px 24px' }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
