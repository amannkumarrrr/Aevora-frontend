import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { MusicPlayerProvider, useMusicPlayer } from './context/MusicPlayerContext';
import AmbientBackground from './components/AmbientBackground';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import MusicPlayer from './components/MusicPlayer';
import LyricsModal from './components/LyricsModal';
import SettingsModal from './components/SettingsModal';
import Home from './pages/Home';
import SearchResults from './pages/SearchResults';
import Album from './pages/Album';
import Playlist from './pages/Playlist';
import LikedSongs from './pages/LikedSongs';

function AppContent() {
  const { currentSong } = useMusicPlayer();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const hasPlayer = Boolean(currentSong);

  return (
    <>
      {/* Subtle Ambient Background Layer (Fixed, behind all UI, z-index 0) */}
      <AmbientBackground />

      {/* Existing Echo Music UI Layout (z-index 1, completely clear & readable) */}
      <div className={`echo-app-layout ${hasPlayer ? 'has-player' : ''}`}>
        {/* Left Vertical Icon Rail Sidebar / Mobile Bottom Nav */}
        <Sidebar onSettingsClick={() => setIsSettingsOpen(true)} />

        <div className="echo-main-wrapper">
          {/* Top Navbar with Branding, Search, and Filter Pills */}
          <Navbar />

          {/* Main Content Area */}
          <main className="echo-content-area">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/search" element={<SearchResults />} />
              <Route path="/liked" element={<LikedSongs />} />
              <Route path="/album/:id?" element={<Album />} />
              <Route path="/playlist/:id?" element={<Playlist />} />
            </Routes>
          </main>
        </div>

        {/* Persistent Player and Modal Layers */}
        <MusicPlayer />
        <LyricsModal />
        <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      </div>
    </>
  );
}

export default function App() {
  return (
    <Router>
      <MusicPlayerProvider>
        <AppContent />
      </MusicPlayerProvider>
    </Router>
  );
}

