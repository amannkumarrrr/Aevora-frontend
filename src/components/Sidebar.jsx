import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home as HomeIcon, Search, Heart, Settings } from 'lucide-react';

export default function Sidebar({ onSearchClick, onSettingsClick }) {
  const location = useLocation();
  const isHome = location.pathname === '/';
  const isSearch = location.pathname.startsWith('/search');
  const isLiked = location.pathname === '/liked';

  return (
    <aside className="echo-sidebar" aria-label="Main Navigation">
      <Link
        to="/"
        className={`echo-nav-btn ${isHome ? 'active' : ''}`}
        title="Home"
      >
        <HomeIcon size={20} className="echo-nav-icon" />
        <span className="echo-nav-label">Home</span>
      </Link>

      <Link
        to="/search"
        className={`echo-nav-btn ${isSearch ? 'active' : ''}`}
        onClick={onSearchClick}
        title="Search"
      >
        <Search size={20} className="echo-nav-icon" />
        <span className="echo-nav-label">Search</span>
      </Link>

      <Link
        to="/liked"
        className={`echo-nav-btn ${isLiked ? 'active' : ''}`}
        title="Liked Songs"
      >
        <Heart size={20} className="echo-nav-icon" />
        <span className="echo-nav-label">Liked</span>
      </Link>

      <button
        type="button"
        className="echo-nav-btn echo-nav-settings"
        title="Settings"
        onClick={onSettingsClick}
      >
        <Settings size={20} className="echo-nav-icon" />
        <span className="echo-nav-label">Settings</span>
      </button>
    </aside>
  );
}

