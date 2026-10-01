import React, { useState } from 'react';
import { useMusicPlayer } from '../context/MusicPlayerContext';
import PlayerControls from './PlayerControls';
import ProgressBar from './ProgressBar';
import VolumeControl from './VolumeControl';
import { FileText, ListMusic, Maximize2, AlertCircle, Heart } from 'lucide-react';
import QueueModal from './QueueModal';
import NowPlayingView from './NowPlayingView';

export default function MusicPlayer() {
  const {
    currentSong,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    isShuffled,
    repeatMode,
    playerError,
    isSongLiked,
    toggleLike,
    togglePlay,
    playNext,
    playPrevious,
    seek,
    setVolumeLevel,
    toggleMute,
    toggleShuffle,
    toggleRepeat,
    openLyrics,
  } = useMusicPlayer();

  const [queueModalOpen, setQueueModalOpen] = useState(false);
  const [isNowPlayingOpen, setIsNowPlayingOpen] = useState(false);

  // If no song is loaded, keep player hidden
  if (!currentSong) return null;

  const percent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <>
      {/* Persistent Bottom Bar Player */}
      <footer className="echo-bottom-bar" role="region" aria-label="Music Player">
        {/* Pinned Top Progress Line for Mobile */}
        <div
          className="echo-bar-top-progress"
          style={{ width: `${percent}%` }}
          aria-hidden="true"
        />

        {/* Left Section: Thumbnail & Title + Desktop Like Button */}
        <div className="echo-bar-left-wrapper">
          <div
            className="echo-bar-left"
            onClick={() => setIsNowPlayingOpen(true)}
            title="Click to open full player & lyrics"
          >
            <div className="echo-bar-thumb-wrap">
              <img
                src={currentSong.image_url}
                alt={currentSong.title}
                className="echo-bar-thumb"
                onError={(e) => {
                  e.target.src = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&h=500&fit=crop';
                }}
              />
            </div>

            <div className="echo-bar-info">
              <div className="echo-bar-title-wrap">
                <span className="echo-bar-title">{currentSong.title}</span>
                {playerError && (
                  <span title={playerError} style={{ color: '#f43f5e', display: 'flex' }}>
                    <AlertCircle size={14} />
                  </span>
                )}
              </div>
              <span className="echo-bar-artist">{currentSong.singers}</span>
            </div>
          </div>

          {/* Desktop Like Button */}
          <button
            type="button"
            className="echo-bar-icon-btn echo-bar-like-btn echo-desktop-like"
            onClick={(e) => {
              e.stopPropagation();
              toggleLike(currentSong);
            }}
            title={isSongLiked(currentSong) ? 'Remove from Liked Songs' : 'Save to Liked Songs'}
          >
            <Heart
              size={18}
              fill={isSongLiked(currentSong) ? '#f43f5e' : 'none'}
              color={isSongLiked(currentSong) ? '#f43f5e' : 'currentColor'}
            />
          </button>
        </div>

        {/* Center Section: Desktop Controls & Progress */}
        <div className="echo-bar-center">
          <PlayerControls
            isPlaying={isPlaying}
            onTogglePlay={togglePlay}
            onNext={playNext}
            onPrevious={playPrevious}
            isShuffled={isShuffled}
            onToggleShuffle={toggleShuffle}
            repeatMode={repeatMode}
            onToggleRepeat={toggleRepeat}
          />
          <ProgressBar currentTime={currentTime} duration={duration} onSeek={seek} />
        </div>

        {/* Right Section: Desktop Lyrics, Queue, Volume, Fullscreen Expand */}
        <div className="echo-bar-right">
          <button
            type="button"
            onClick={() => setIsNowPlayingOpen(true)}
            className="echo-bar-icon-btn"
            title="Lyrics & Immersive View"
          >
            <FileText size={18} />
          </button>

          <button
            type="button"
            onClick={() => setQueueModalOpen(true)}
            className="echo-bar-icon-btn"
            title="View Queue"
          >
            <ListMusic size={19} />
          </button>

          <VolumeControl
            volume={volume}
            isMuted={isMuted}
            onVolumeChange={setVolumeLevel}
            onToggleMute={toggleMute}
          />

          <button
            type="button"
            onClick={() => setIsNowPlayingOpen(true)}
            className="echo-bar-icon-btn"
            title="Expand Fullscreen"
          >
            <Maximize2 size={17} />
          </button>
        </div>

        {/* Mobile Quick Controls (Play/Pause, Next, Like) */}
        <div className="echo-mobile-bar-controls">
          <button
            type="button"
            className="echo-mobile-ctrl-btn echo-mobile-like"
            onClick={(e) => {
              e.stopPropagation();
              toggleLike(currentSong);
            }}
            title={isSongLiked(currentSong) ? 'Remove from Liked Songs' : 'Save to Liked Songs'}
          >
            <Heart
              size={18}
              fill={isSongLiked(currentSong) ? '#f43f5e' : 'none'}
              color={isSongLiked(currentSong) ? '#f43f5e' : 'rgba(255,255,255,0.7)'}
            />
          </button>

          <button
            type="button"
            className="echo-mobile-ctrl-btn echo-mobile-play"
            onClick={(e) => {
              e.stopPropagation();
              togglePlay();
            }}
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <span className="echo-mob-pause">❚❚</span> : <span className="echo-mob-play">▶</span>}
          </button>

          <button
            type="button"
            className="echo-mobile-ctrl-btn echo-mobile-next"
            onClick={(e) => {
              e.stopPropagation();
              playNext();
            }}
            title="Next song"
          >
            <span className="echo-mob-next">⏭</span>
          </button>
        </div>
      </footer>

      {/* Immersive Now Playing View matching Screenshot 1 */}
      <NowPlayingView
        isOpen={isNowPlayingOpen}
        onClose={() => setIsNowPlayingOpen(false)}
      />

      {/* Queue Modal */}
      <QueueModal isOpen={queueModalOpen} onClose={() => setQueueModalOpen(false)} />
    </>
  );
}

