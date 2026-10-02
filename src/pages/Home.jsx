import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMusicPlayer } from '../context/MusicPlayerContext';
import { ChevronLeft, ChevronRight, Play, Pause, Trash2, Clock, Sparkles, Flame, Heart } from 'lucide-react';
import SongCard, { QueueButton } from '../components/SongCard';
import {
  getCuratedQuickPicks,
  getHindiHits,
  getPunjabiHits,
  getMadeForYouRecommendations,
  extractTopArtists,
} from '../services/recommendationService';

export default function Home() {
  const navigate = useNavigate();
  const {
    currentSong,
    isPlaying,
    playSong,
    togglePlay,
    likedSongs,
    recentlyPlayed,
    clearRecentlyPlayed,
    isSongLiked,
    toggleLike,
    registerAvailableSongs,
  } = useMusicPlayer();

  const [quickPicks, setQuickPicks] = useState([]);
  const [hindiHits, setHindiHits] = useState([]);
  const [punjabiHits, setPunjabiHits] = useState([]);
  const [madeForYou, setMadeForYou] = useState([]);
  const [loading, setLoading] = useState(true);

  const quickPicksScrollRef = useRef(null);
  const hindiScrollRef = useRef(null);
  const punjabiScrollRef = useRef(null);
  const madeForYouScrollRef = useRef(null);
  const recentlyPlayedScrollRef = useRef(null);

  // Up to 7 recently played songs (making up to 8 cards total with Liked Songs)
  const recentSlice = (recentlyPlayed || []).slice(0, 7);

  // Load curated and personalized recommendations
  useEffect(() => {
    let isMounted = true;

    async function loadRecommendations() {
      setLoading(true);
      const seenKeys = new Set();

      try {
        // 1. Fetch Quick Picks (curated blend of recognizable Hindi & Punjabi)
        const qp = await getCuratedQuickPicks(recentlyPlayed, seenKeys);
        if (isMounted) setQuickPicks(qp);

        // 2. Fetch Hindi Hits (strictly recognizable Hindi artists)
        const hh = await getHindiHits(seenKeys);
        if (isMounted) setHindiHits(hh);

        // 3. Fetch Punjabi Hits (strictly recognizable Punjabi artists)
        const ph = await getPunjabiHits(seenKeys);
        if (isMounted) setPunjabiHits(ph);

        // 4. If user has listening history, fetch Made For You
        if (recentlyPlayed.length > 0) {
          const mfy = await getMadeForYouRecommendations(recentlyPlayed, seenKeys);
          if (isMounted) setMadeForYou(mfy);
        }

        if (isMounted) {
          registerAvailableSongs([...qp, ...hh, ...ph]);
        }
      } catch (err) {
        console.warn('Failed to load recommendations:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadRecommendations();

    return () => {
      isMounted = false;
    };
  }, [recentlyPlayed.length, registerAvailableSongs]); // Refresh recommendations if listening history changes

  const scrollContainer = (ref, direction) => {
    if (ref.current) {
      const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
      // On mobile (<= 768px), each slide is 1 full viewport width (4 items vertically)
      // On desktop, scroll standard column step
      const scrollAmount = isMobile
        ? (direction === 'left' ? -ref.current.clientWidth : ref.current.clientWidth)
        : (direction === 'left' ? -380 : 380);
      ref.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Helper to chunk songs into 4-row columns
  const chunkSongs = (songList) => {
    const columns = [];
    for (let i = 0; i < songList.length; i += 4) {
      columns.push(songList.slice(i, i + 4));
    }
    return columns;
  };

  // Skeleton loader for 4-row columns
  const renderSkeletonColumns = () => (
    <div className="echo-quick-picks-columns">
      {Array.from({ length: 4 }).map((_, colIdx) => (
        <div key={colIdx} className="echo-picks-col">
          {Array.from({ length: 4 }).map((_, rowIdx) => (
            <div key={rowIdx} className="echo-pick-item">
              <div className="skeleton" style={{ width: 48, height: 48, borderRadius: 6, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="skeleton" style={{ height: 14, width: '70%', marginBottom: 6 }} />
                <div className="skeleton" style={{ height: 12, width: '45%' }} />
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );

  // Reusable 4-row song column renderer using unified SongCard
  const renderSongColumns = (songList, scrollRef) => {
    const chunked = chunkSongs(songList);
    return (
      <div className="echo-quick-picks-columns" ref={scrollRef}>
        {chunked.map((column, colIdx) => (
          <div key={colIdx} className="echo-picks-col">
            {column.map((song, rowIdx) => {
              const globalIdx = colIdx * 4 + rowIdx;
              return (
                <SongCard
                  key={song.id || song.songid || globalIdx}
                  song={song}
                  songList={songList}
                  index={globalIdx}
                  variant="pick"
                />
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  const topArtists = extractTopArtists(recentlyPlayed, 2);

  return (
    <div className="echo-home">
      {/* SECTION 1: Quick-Access (Liked Songs + Recently Played) */}
      <section className="echo-section" style={{ marginTop: 4 }}>
        <div className="echo-quick-access-grid">
          {/* Card 1: Liked Songs */}
          <div
            className="echo-quick-card"
            onClick={() => navigate('/liked')}
            title="Open Liked Songs"
          >
            <div className="echo-quick-thumb-wrap">
              <div className="echo-quick-liked-icon">
                <Heart size={26} fill="#ffffff" color="#ffffff" />
              </div>
            </div>
            <div className="echo-quick-info">
              <h3 className="echo-quick-title">Liked Songs</h3>
              <p className="echo-quick-artist">
                {likedSongs.length} song{likedSongs.length === 1 ? '' : 's'}
              </p>
            </div>
            {likedSongs.length > 0 && (
              <button
                type="button"
                className="echo-quick-play-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  playSong(likedSongs[0], likedSongs, 0);
                }}
                title="Play Liked Songs"
                aria-label="Play Liked Songs"
              >
                <Play size={16} fill="#000" color="#000" style={{ marginLeft: 2 }} />
              </button>
            )}
          </div>

          {/* Cards 2+: Dynamically Generated User's Recently Played Songs */}
          {recentSlice.map((song, idx) => {
            const isCurrent = currentSong && (currentSong.id === song.id || currentSong.songid === song.songid);
            const isThisPlaying = isCurrent && isPlaying;

            return (
              <div
                key={song.id || song.songid || idx}
                className={`echo-quick-card ${isCurrent ? 'is-active' : ''}`}
                onClick={() => {
                  if (isCurrent) {
                    togglePlay();
                  } else {
                    playSong(song, recentlyPlayed, idx);
                  }
                }}
                title={`Play ${song.title} by ${song.singers}`}
              >
                <div className="echo-quick-thumb-wrap">
                  <img
                    src={song.image_url}
                    alt={song.title}
                    className="echo-quick-thumb"
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&h=500&fit=crop';
                    }}
                  />
                </div>
                <div className="echo-quick-info">
                  <h3 className="echo-quick-title">{song.title}</h3>
                  <p className="echo-quick-artist">{song.singers}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginRight: 10 }}>
                  <QueueButton song={song} size={15} style={{ marginRight: 2 }} />
                  <button
                    type="button"
                    className="echo-quick-play-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isCurrent) {
                        togglePlay();
                      } else {
                        playSong(song, recentlyPlayed, idx);
                      }
                    }}
                    title={isThisPlaying ? 'Pause' : 'Play'}
                    aria-label={isThisPlaying ? 'Pause' : 'Play'}
                  >
                    {isThisPlaying ? (
                      <Pause size={16} fill="#000" color="#000" />
                    ) : (
                      <Play size={16} fill="#000" color="#000" style={{ marginLeft: 2 }} />
                    )}
                  </button>
                </div>
              </div>
            );
          })}

          {/* If no recently played songs yet, show subtle empty guidance notice */}
          {recentSlice.length === 0 && (
            <div className="echo-quick-empty-notice">
              Play some music to see your recent tracks here.
            </div>
          )}
        </div>
      </section>

      {/* SECTION 2: Quick picks (Curated, recognizable Hindi & Punjabi) */}
      <section className="echo-section">
        <div className="echo-section-header">
          <h2 className="echo-section-title">Quick picks</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {quickPicks.length > 0 && (
              <button
                type="button"
                className="echo-play-all-btn"
                onClick={() => playSong(quickPicks[0], quickPicks, 0)}
              >
                <Play size={14} fill="currentColor" />
                <span>Play all</span>
              </button>
            )}

            <div className="echo-carousel-controls">
              <button
                type="button"
                className="echo-arrow-btn"
                onClick={() => scrollContainer(quickPicksScrollRef, 'left')}
                title="Previous"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                type="button"
                className="echo-arrow-btn"
                onClick={() => scrollContainer(quickPicksScrollRef, 'right')}
                title="Next"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </div>

        {loading && quickPicks.length === 0
          ? renderSkeletonColumns()
          : renderSongColumns(quickPicks, quickPicksScrollRef)}
      </section>

      {/* SECTION 3: Made For You (Personalized if user has listening history) */}
      {madeForYou.length > 0 && (
        <section className="echo-section">
          <div className="echo-section-header">
            <div>
              <h2 className="echo-section-title">Made For You</h2>
              {topArtists.length > 0 && (
                <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: 2 }}>
                  Based on your affinity for {topArtists.join(' & ')}
                </p>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button
                type="button"
                className="echo-play-all-btn"
                onClick={() => playSong(madeForYou[0], madeForYou, 0)}
              >
                <Play size={14} fill="currentColor" />
                <span>Play all</span>
              </button>

              <div className="echo-carousel-controls">
                <button
                  type="button"
                  className="echo-arrow-btn"
                  onClick={() => scrollContainer(madeForYouScrollRef, 'left')}
                  title="Previous"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  type="button"
                  className="echo-arrow-btn"
                  onClick={() => scrollContainer(madeForYouScrollRef, 'right')}
                  title="Next"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          </div>

          {renderSongColumns(madeForYou, madeForYouScrollRef)}
        </section>
      )}

      {/* SECTION 4: Hindi Hits */}
      {hindiHits.length > 0 && (
        <section className="echo-section">
          <div className="echo-section-header">
            <h2 className="echo-section-title">Hindi Hits</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button
                type="button"
                className="echo-play-all-btn"
                onClick={() => playSong(hindiHits[0], hindiHits, 0)}
              >
                <Play size={14} fill="currentColor" />
                <span>Play all</span>
              </button>

              <div className="echo-carousel-controls">
                <button
                  type="button"
                  className="echo-arrow-btn"
                  onClick={() => scrollContainer(hindiScrollRef, 'left')}
                  title="Previous"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  type="button"
                  className="echo-arrow-btn"
                  onClick={() => scrollContainer(hindiScrollRef, 'right')}
                  title="Next"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          </div>

          {renderSongColumns(hindiHits, hindiScrollRef)}
        </section>
      )}

      {/* SECTION 5: Punjabi Hits */}
      {punjabiHits.length > 0 && (
        <section className="echo-section">
          <div className="echo-section-header">
            <h2 className="echo-section-title">Punjabi Hits</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button
                type="button"
                className="echo-play-all-btn"
                onClick={() => playSong(punjabiHits[0], punjabiHits, 0)}
              >
                <Play size={14} fill="currentColor" />
                <span>Play all</span>
              </button>

              <div className="echo-carousel-controls">
                <button
                  type="button"
                  className="echo-arrow-btn"
                  onClick={() => scrollContainer(punjabiScrollRef, 'left')}
                  title="Previous"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  type="button"
                  className="echo-arrow-btn"
                  onClick={() => scrollContainer(punjabiScrollRef, 'right')}
                  title="Next"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          </div>

          {renderSongColumns(punjabiHits, punjabiScrollRef)}
        </section>
      )}

      {/* SECTION 6: Recently Played */}
      {recentlyPlayed.length > 0 && (
        <section id="recently-played" className="echo-section" style={{ marginTop: 20 }}>
          <div className="echo-section-header">
            <h2 className="echo-section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Clock size={20} />
              <span>Recently Played</span>
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                type="button"
                className="echo-arrow-btn"
                onClick={() => scrollContainer(recentlyPlayedScrollRef, 'left')}
                title="Previous"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                type="button"
                className="echo-arrow-btn"
                onClick={() => scrollContainer(recentlyPlayedScrollRef, 'right')}
                title="Next"
              >
                <ChevronRight size={20} />
              </button>
              <button
                type="button"
                onClick={clearRecentlyPlayed}
                className="echo-arrow-btn"
                title="Clear history"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>

          {renderSongColumns(recentlyPlayed, recentlyPlayedScrollRef)}
        </section>
      )}
    </div>
  );
}
