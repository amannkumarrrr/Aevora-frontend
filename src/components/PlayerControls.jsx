import React from 'react';
import { Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Repeat1 } from 'lucide-react';

export default function PlayerControls({
  isPlaying,
  onTogglePlay,
  onNext,
  onPrevious,
  isShuffled,
  onToggleShuffle,
  repeatMode,
  onToggleRepeat,
}) {
  return (
    <div className="player-controls">
      {/* Shuffle button */}
      <button
        type="button"
        onClick={onToggleShuffle}
        className={`control-btn ${isShuffled ? 'active' : ''}`}
        title={isShuffled ? 'Shuffle: On' : 'Shuffle: Off'}
      >
        <Shuffle size={18} />
      </button>

      {/* Previous button */}
      <button
        type="button"
        onClick={onPrevious}
        className="control-btn"
        title="Previous (or restart)"
      >
        <SkipBack size={21} fill="currentColor" />
      </button>

      {/* Play / Pause button */}
      <button
        type="button"
        onClick={onTogglePlay}
        className="play-pause-btn"
        title={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? (
          <Pause size={20} fill="#0a0b10" />
        ) : (
          <Play size={20} fill="#0a0b10" style={{ marginLeft: 2 }} />
        )}
      </button>

      {/* Next button */}
      <button
        type="button"
        onClick={onNext}
        className="control-btn"
        title="Next song"
      >
        <SkipForward size={21} fill="currentColor" />
      </button>

      {/* Repeat button */}
      <button
        type="button"
        onClick={onToggleRepeat}
        className={`control-btn ${repeatMode !== 'off' ? 'active' : ''}`}
        title={`Repeat: ${repeatMode}`}
      >
        {repeatMode === 'one' ? <Repeat1 size={19} /> : <Repeat size={18} />}
      </button>
    </div>
  );
}
