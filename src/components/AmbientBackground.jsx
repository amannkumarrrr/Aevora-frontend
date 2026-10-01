import React, { useState, useEffect } from 'react';
import { useMusicPlayer } from '../context/MusicPlayerContext';
import { extractDominantColors } from '../utils/colorExtractor';

/**
 * AmbientBackground - Dedicated background layer positioned BEHIND all application content.
 * Features:
 * - position: fixed, inset: 0, pointer-events: none, z-index: 0
 * - Subtle, soft, heavily blurred ambient color glow derived from current song artwork
 * - Smooth 0.8s transition between songs
 * - Leaves all UI cards, text, and controls completely bright, crisp, and readable
 */
export default function AmbientBackground() {
  const { currentSong } = useMusicPlayer();
  const [palette, setPalette] = useState(null);

  useEffect(() => {
    let isCurrent = true;
    if (currentSong?.image_url) {
      extractDominantColors(currentSong.image_url).then((colors) => {
        if (isCurrent) {
          setPalette(colors);
        }
      });
    } else {
      setPalette(null);
    }

    return () => {
      isCurrent = false;
    };
  }, [currentSong?.image_url]);

  return (
    <div className="ambient-background" aria-hidden="true">
      <div
        className="ambient-glow-orb"
        style={{
          background: palette
            ? `radial-gradient(circle at 50% 20%, rgba(${palette.r}, ${palette.g}, ${palette.b}, 0.16) 0%, rgba(${palette.r}, ${palette.g}, ${palette.b}, 0.04) 50%, transparent 75%)`
            : 'transparent',
          opacity: palette ? 1 : 0,
        }}
      />
    </div>
  );
}
