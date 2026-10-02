import React from 'react';
import { formatTime } from '../utils/formatTime';

export default function ProgressBar({ currentTime = 0, duration = 0, onSeek }) {
  const percent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleChange = (e) => {
    const newTime = parseFloat(e.target.value);
    if (onSeek) {
      onSeek(newTime);
    }
  };

  return (
    <div className="progress-bar-wrap">
      <span className="time-label">{formatTime(currentTime)}</span>
      <input
        type="range"
        min={0}
        max={duration || 100}
        step={0.1}
        value={currentTime || 0}
        onChange={handleChange}
        className="seek-slider"
        style={{
          background: `linear-gradient(to right, #6366f1 0%, #a855f7 ${percent}%, rgba(255, 255, 255, 0.15) ${percent}%, rgba(255, 255, 255, 0.15) 100%)`,
        }}
        aria-label="Seek track position"
      />
      <span className="time-label">{formatTime(duration)}</span>
    </div>
  );
}
