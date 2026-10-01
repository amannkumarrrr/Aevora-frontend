import React from 'react';
import { X, ListMusic, Play, Trash2 } from 'lucide-react';
import { useMusicPlayer } from '../context/MusicPlayerContext';
import { formatTime } from './SongCard';

export default function QueueModal({ isOpen, onClose }) {
  const { queue, currentIndex, playSong } = useMusicPlayer();

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="lyrics-card" style={{ maxWidth: '540px' }} onClick={(e) => e.stopPropagation()}>
        <div className="lyrics-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <ListMusic size={22} color="var(--accent-primary)" />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Playing Queue</h3>
            <span
              style={{
                fontSize: '0.78rem',
                background: 'rgba(255, 255, 255, 0.1)',
                padding: '2px 8px',
                borderRadius: 'var(--radius-full)',
                color: 'var(--text-muted)',
              }}
            >
              {queue.length} songs
            </span>
          </div>

          <button type="button" onClick={onClose} className="btn-icon" style={{ width: 34, height: 34 }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '16px 20px', maxHeight: '60vh', overflowY: 'auto' }}>
          {queue.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-dim)', padding: '30px 0' }}>Queue is empty.</p>
          ) : (
            queue.map((song, idx) => {
              const isCurrent = idx === currentIndex;
              return (
                <div
                  key={song.id || song.songid || idx}
                  className={`queue-item ${isCurrent ? 'active' : ''}`}
                  onClick={() => playSong(song, queue, idx)}
                >
                  <span style={{ fontSize: '0.85rem', color: isCurrent ? 'var(--accent-primary)' : 'var(--text-dim)', width: 20 }}>
                    {idx + 1}
                  </span>
                  <img
                    src={song.image_url}
                    alt={song.title}
                    style={{ width: 40, height: 40, borderRadius: 'var(--radius-sm)', objectFit: 'cover' }}
                  />
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <p style={{ fontSize: '0.9rem', fontWeight: isCurrent ? 700 : 500, color: isCurrent ? '#a5b4fc' : 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {song.title}
                    </p>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {song.singers}
                    </p>
                  </div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                    {formatTime(song.duration)}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
