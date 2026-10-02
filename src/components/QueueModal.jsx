import React, { useState } from 'react';
import { X, ListMusic, Sparkles, Trash2, Music, Loader2, ChevronUp, ChevronDown, GripVertical } from 'lucide-react';
import { useMusicPlayer } from '../context/MusicPlayerContext';
import { formatTime } from '../utils/formatTime';
import QueueButton from './QueueButton';

export default function QueueModal({ isOpen, onClose }) {
  const {
    currentSong,
    explicitQueue,
    smartQueue,
    isSmartShuffle,
    toggleSmartShuffle,
    isSmartQueueLoading,
    playSong,
    removeFromQueue,
    moveQueueItem,
    clearExplicitQueue,
  } = useMusicPlayer();

  const [draggedIdx, setDraggedIdx] = useState(null);
  const [dragOverIdx, setDragOverIdx] = useState(null);

  if (!isOpen) return null;

  const totalUpcoming = explicitQueue.length + (isSmartShuffle ? smartQueue.length : 0);

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-label="Playback Queue">
      <div className="lyrics-card" style={{ maxWidth: '580px', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }} onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="lyrics-header" style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <ListMusic size={22} color="var(--accent-primary, #6366f1)" />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>Queue</h3>
            <span
              style={{
                fontSize: '0.78rem',
                background: 'rgba(255, 255, 255, 0.08)',
                padding: '2px 8px',
                borderRadius: 'var(--radius-full, 9999px)',
                color: 'var(--text-muted)',
                fontWeight: 600,
              }}
            >
              {totalUpcoming} upcoming
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Quick Smart Shuffle Toggle Button in Header */}
            <button
              type="button"
              onClick={toggleSmartShuffle}
              className="smart-shuffle-pill-btn"
              title={isSmartShuffle ? 'Smart Shuffle is ON (Click to turn off)' : 'Smart Shuffle is OFF (Click to turn on)'}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '5px 10px',
                borderRadius: 'var(--radius-full, 9999px)',
                border: isSmartShuffle ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid rgba(255, 255, 255, 0.1)',
                background: isSmartShuffle ? 'rgba(99, 102, 241, 0.16)' : 'rgba(255, 255, 255, 0.05)',
                color: isSmartShuffle ? '#a5b4fc' : 'var(--text-dim)',
                fontSize: '0.76rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <Sparkles size={13} color={isSmartShuffle ? '#818cf8' : 'currentColor'} />
              <span>Smart Shuffle</span>
            </button>

            <button type="button" onClick={onClose} className="btn-icon" style={{ width: 32, height: 32 }} aria-label="Close queue">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div style={{ padding: '16px 20px', overflowY: 'auto', flex: 1 }}>
          {/* 1. NOW PLAYING SECTION */}
          {currentSong && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-dim)', fontWeight: 700 }}>
                  Now Playing
                </span>
              </div>
              <div
                className="queue-item active"
                style={{
                  background: 'rgba(99, 102, 241, 0.12)',
                  border: '1px solid rgba(99, 102, 241, 0.25)',
                  padding: '10px 12px',
                }}
              >
                <div style={{ width: 22, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div className="sound-wave" style={{ height: 14 }}>
                    <span className="sound-bar" style={{ background: 'var(--accent-primary, #6366f1)' }}></span>
                    <span className="sound-bar" style={{ background: 'var(--accent-primary, #6366f1)' }}></span>
                    <span className="sound-bar" style={{ background: 'var(--accent-primary, #6366f1)' }}></span>
                  </div>
                </div>

                <img
                  src={currentSong.image_url}
                  alt={currentSong.title}
                  style={{ width: 44, height: 44, borderRadius: 'var(--radius-sm, 6px)', objectFit: 'cover' }}
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&h=500&fit=crop';
                  }}
                />

                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '0.92rem', fontWeight: 700, color: '#a5b4fc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0 }}>
                    {currentSong.title}
                  </p>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: '3px 0 0 0' }}>
                    {currentSong.singers}
                  </p>
                </div>

                <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                  {formatTime(currentSong.duration)}
                </span>
              </div>
            </div>
          )}

          {/* 2. EXPLICIT QUEUE (User Added) */}
          <div style={{ marginBottom: 22 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-dim)', fontWeight: 700 }}>
                  Up Next (Your Queue)
                </span>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)', background: 'rgba(255, 255, 255, 0.06)', padding: '1px 6px', borderRadius: 4 }}>
                  {explicitQueue.length}
                </span>
              </div>

              {explicitQueue.length > 0 && (
                <button
                  type="button"
                  onClick={clearExplicitQueue}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-dim)',
                    fontSize: '0.76rem',
                    cursor: 'pointer',
                    fontWeight: 600,
                    padding: '2px 6px',
                  }}
                  onMouseEnter={(e) => (e.target.style.color = '#f43f5e')}
                  onMouseLeave={(e) => (e.target.style.color = 'var(--text-dim)')}
                >
                  Clear
                </button>
              )}
            </div>

            {explicitQueue.length === 0 ? (
              <div
                style={{
                  padding: '14px 16px',
                  borderRadius: 'var(--radius-sm, 8px)',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px dashed rgba(255, 255, 255, 0.08)',
                  textAlign: 'center',
                  color: 'var(--text-dim)',
                  fontSize: '0.78rem',
                  lineHeight: 1.4,
                }}
              >
                No tracks manually queued. Use <span style={{ color: '#a855f7', fontWeight: 600 }}>Play Next</span> or <span style={{ color: '#a855f7', fontWeight: 600 }}>Add to Queue</span> on any song to queue it up.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {explicitQueue.map((song, idx) => (
                  <div
                    key={song.id || song.songid || `explicit-${idx}`}
                    className={`queue-item queue-drag-item ${draggedIdx === idx ? 'is-dragging' : ''} ${dragOverIdx === idx ? 'drag-over' : ''}`}
                    draggable={true}
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/plain', String(idx));
                      setDraggedIdx(idx);
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOverIdx(idx);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (draggedIdx !== null && draggedIdx !== idx) {
                        moveQueueItem(draggedIdx, idx);
                      }
                      setDraggedIdx(null);
                      setDragOverIdx(null);
                    }}
                    onDragEnd={() => {
                      setDraggedIdx(null);
                      setDragOverIdx(null);
                    }}
                    onClick={() => playSong(song)}
                    style={{ position: 'relative', cursor: 'pointer' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 2, marginRight: 2 }} onClick={(e) => e.stopPropagation()}>
                      <GripVertical size={13} style={{ color: 'var(--text-dim)', opacity: 0.5, cursor: 'grab' }} />
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', width: 18, textAlign: 'center' }}>
                        {idx + 1}
                      </span>
                    </div>

                    <img
                      src={song.image_url}
                      alt={song.title}
                      style={{ width: 40, height: 40, borderRadius: 'var(--radius-sm, 6px)', objectFit: 'cover' }}
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&h=500&fit=crop';
                      }}
                    />

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0 }}>
                        {song.title}
                      </p>
                      <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: '2px 0 0 0' }}>
                        {song.singers}
                      </p>
                    </div>

                    <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginRight: 6 }}>
                      {formatTime(song.duration)}
                    </span>

                    {/* Up / Down Reorder buttons and Delete */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 2 }} onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => moveQueueItem(idx, idx - 1)}
                        title="Move up"
                        className="btn-icon"
                        style={{
                          width: 22,
                          height: 22,
                          color: idx === 0 ? 'rgba(255,255,255,0.1)' : 'var(--text-dim)',
                          cursor: idx === 0 ? 'default' : 'pointer',
                        }}
                      >
                        <ChevronUp size={13} />
                      </button>
                      <button
                        type="button"
                        disabled={idx === explicitQueue.length - 1}
                        onClick={() => moveQueueItem(idx, idx + 1)}
                        title="Move down"
                        className="btn-icon"
                        style={{
                          width: 22,
                          height: 22,
                          color: idx === explicitQueue.length - 1 ? 'rgba(255,255,255,0.1)' : 'var(--text-dim)',
                          cursor: idx === explicitQueue.length - 1 ? 'default' : 'pointer',
                        }}
                      >
                        <ChevronDown size={13} />
                      </button>
                      <button
                        type="button"
                        className="btn-icon"
                        onClick={() => removeFromQueue(idx, 'explicit')}
                        title="Remove from queue"
                        style={{ width: 26, height: 26, color: 'var(--text-dim)' }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = '#f43f5e')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-dim)')}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 3. SMART SHUFFLE QUEUE (Auto-generated recommendations) */}
          {isSmartShuffle ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Sparkles size={14} color="#818cf8" />
                  <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#818cf8', fontWeight: 700 }}>
                    Smart Shuffle Queue
                  </span>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      background: 'rgba(99, 102, 241, 0.15)',
                      color: '#a5b4fc',
                      padding: '1px 6px',
                      borderRadius: 4,
                      fontWeight: 600,
                    }}
                  >
                    Auto-generated
                  </span>
                </div>
              </div>

              <p style={{ fontSize: '0.76rem', color: 'var(--text-dim)', margin: '0 0 10px 0', lineHeight: 1.3 }}>
                Intelligently curated based on language, genre, and mood similarity
              </p>

              {isSmartQueueLoading && smartQueue.length === 0 ? (
                <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-dim)' }}>
                  <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 8px auto', display: 'block', color: 'var(--accent-primary, #6366f1)' }} />
                  <span style={{ fontSize: '0.82rem' }}>Generating smart queue...</span>
                </div>
              ) : smartQueue.length === 0 ? (
                <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text-dim)', background: 'rgba(255, 255, 255, 0.03)', borderRadius: 8 }}>
                  <Music size={24} style={{ opacity: 0.4, marginBottom: 6 }} />
                  <p style={{ fontSize: '0.82rem', margin: 0 }}>Smart Shuffle is ready. Play any song to generate recommendations.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {smartQueue.map((song, idx) => (
                    <div
                      key={song.id || song.songid || `smart-${idx}`}
                      className="queue-item"
                      onClick={() => playSong(song)}
                    >
                      <span style={{ fontSize: '0.82rem', color: 'var(--text-dim)', width: 22, textAlign: 'center' }}>
                        {idx + 1}
                      </span>

                      <img
                        src={song.image_url}
                        alt={song.title}
                        style={{ width: 40, height: 40, borderRadius: 'var(--radius-sm, 6px)', objectFit: 'cover' }}
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&h=500&fit=crop';
                        }}
                      />

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: '0.88rem', fontWeight: 500, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0 }}>
                          {song.title}
                        </p>
                        <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: '2px 0 0 0' }}>
                          {song.singers}
                        </p>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                          {formatTime(song.duration)}
                        </span>
                        <QueueButton song={song} size={14} title="Add to user queue" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            explicitQueue.length === 0 && (
              <div
                style={{
                  padding: '30px 20px',
                  textAlign: 'center',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px dashed rgba(255, 255, 255, 0.1)',
                  borderRadius: 10,
                  marginTop: 10,
                }}
              >
                <Sparkles size={28} color="var(--accent-primary, #6366f1)" style={{ marginBottom: 10 }} />
                <h4 style={{ fontSize: '0.98rem', fontWeight: 600, color: 'var(--text-main)', margin: '0 0 6px 0' }}>
                  Smart Shuffle is Off
                </h4>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '0 0 16px 0', lineHeight: 1.4 }}>
                  Turn on Smart Shuffle to automatically queue contextually similar songs based on language, genre, and mood.
                </p>
                <button
                  type="button"
                  onClick={toggleSmartShuffle}
                  className="btn-primary"
                  style={{
                    padding: '8px 18px',
                    fontSize: '0.84rem',
                    borderRadius: 'var(--radius-full, 9999px)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <Sparkles size={14} />
                  <span>Turn on Smart Shuffle</span>
                </button>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
