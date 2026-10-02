import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { searchSongs } from '../services/musicApi';
import SongList from '../components/SongList';
import SearchBar from '../components/SearchBar';
import { Search, Music } from 'lucide-react';

export default function SearchResults() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const performSearch = async (searchTerm) => {
    if (!searchTerm || !searchTerm.trim()) {
      setSongs([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const results = await searchSongs(searchTerm.trim());
      setSongs(results);
    } catch (err) {
      console.error('Search failed:', err);
      setError('Music service is currently unavailable. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    performSearch(query);
  }, [query]);

  return (
    <div className="search-results-page">
      <div style={{ marginBottom: 28, maxWidth: '640px' }}>
        <SearchBar size="compact" placeholder="Search another song..." />
      </div>

      <div className="echo-section-header" style={{ marginTop: 0 }}>
        <h1 className="echo-section-title" style={{ fontSize: '1.45rem', display: 'flex', alignItems: 'center', gap: 10 }}>
          <Search size={22} />
          <span>Results for "{query}"</span>
        </h1>
        {songs.length > 0 && (
          <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>
            Found {songs.length} tracks
          </span>
        )}
      </div>

      <SongList
        songs={songs}
        isLoading={loading}
        error={error}
        onRetry={() => performSearch(query)}
        emptyMessage={`No songs found matching "${query}".`}
        isSearchResult={true}
      />
    </div>
  );
}
