import React from 'react';
import { Volume2, Volume1, VolumeX } from 'lucide-react';

export default function VolumeControl({ volume = 0.8, isMuted = false, onVolumeChange, onToggleMute }) {
  const currentVol = isMuted ? 0 : volume;

  const getVolumeIcon = () => {
    if (isMuted || currentVol === 0) return <VolumeX size={19} />;
    if (currentVol < 0.5) return <Volume1 size={19} />;
    return <Volume2 size={19} />;
  };

  return (
    <div className="volume-wrapper">
      <button
        type="button"
        onClick={onToggleMute}
        className="control-btn"
        title={isMuted ? 'Unmute' : 'Mute'}
        style={{ padding: '4px' }}
      >
        {getVolumeIcon()}
      </button>

      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={currentVol}
        onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
        className="volume-slider"
        style={{
          background: `linear-gradient(to right, #6366f1 0%, #a855f7 ${currentVol * 100}%, rgba(255, 255, 255, 0.15) ${currentVol * 100}%, rgba(255, 255, 255, 0.15) 100%)`,
        }}
        aria-label="Adjust volume"
      />
    </div>
  );
}
