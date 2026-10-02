import React, { useState } from 'react';
import { ListPlus, Check } from 'lucide-react';
import { useMusicPlayer } from '../context/MusicPlayerContext';

/**
 * Universal, reusable Add-To-Queue button component for any song card or row in Aevora Music.
 * Handles:
 * - Event propagation stopping (never triggers song playback)
 * - Explicit queue insertion via useMusicPlayer().addToQueue
 * - Duplicate prevention with feedback
 * - Local 1.5s checkmark success animation
 * - Desktop hover fade/scale & mobile touch accessibility
 */
export default function QueueButton({
  song,
  className = '',
  size = 14,
  style = {},
  title = 'Add to queue',
}) {
  const { addToQueue } = useMusicPlayer();
  const [isSuccess, setIsSuccess] = useState(false);

  const handleClick = (e) => {
    e.stopPropagation();
    if (!song) return;
    const added = addToQueue(song);
    if (added) {
      setIsSuccess(true);
      setTimeout(() => setIsSuccess(false), 1500);
    }
  };

  return (
    <button
      type="button"
      className={`card-action-btn song-card-queue-btn ${isSuccess ? 'is-active-added' : ''} ${className}`}
      onClick={handleClick}
      title={isSuccess ? 'Added to queue!' : title}
      aria-label={`Add ${song?.title || 'song'} to queue`}
      style={{
        background: 'none',
        border: 'none',
        color: isSuccess ? '#10b981' : 'var(--text-dim)',
        cursor: 'pointer',
        padding: 4,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'transform 0.15s ease, color 0.15s ease',
        ...style,
      }}
    >
      {isSuccess ? <Check size={size} color="#10b981" /> : <ListPlus size={size} />}
    </button>
  );
}
