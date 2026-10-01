import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, X, Sparkles } from 'lucide-react';

export default function SearchBar({ size = 'large', placeholder = 'Search songs, artists, albums...' }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const currentQuery = searchParams.get('q') || '';
  const [searchTerm, setSearchTerm] = useState(currentQuery);

  useEffect(() => {
    setSearchTerm(currentQuery);
  }, [currentQuery]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  const handleClear = () => {
    setSearchTerm('');
  };

  const isLarge = size === 'large';

  return (
    <form onSubmit={handleSubmit} className="search-container" style={{ maxWidth: isLarge ? '680px' : '100%' }}>
      <div
        className="search-input-wrapper"
        style={{
          padding: isLarge ? '12px 22px' : '7px 16px',
          background: isLarge ? 'rgba(255, 255, 255, 0.07)' : 'rgba(255, 255, 255, 0.05)',
          borderRadius: isLarge ? 'var(--radius-full)' : 'var(--radius-full)',
        }}
      >
        <Search
          size={isLarge ? 22 : 18}
          className="search-icon"
          style={{ color: isLarge ? '#a5b4fc' : 'var(--text-dim)' }}
        />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={placeholder}
          className="search-input"
          style={{
            fontSize: isLarge ? '1.05rem' : '0.92rem',
          }}
        />

        {searchTerm && (
          <button type="button" onClick={handleClear} className="search-clear-btn" title="Clear">
            <X size={16} />
          </button>
        )}

        {isLarge && (
          <button
            type="submit"
            className="btn-primary"
            style={{ padding: '8px 20px', marginLeft: '10px', fontSize: '0.88rem' }}
          >
            <span>Search</span>
          </button>
        )}
      </div>
    </form>
  );
}
