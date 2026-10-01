import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { getPlaylist } from '../services/musicApi';
import SongList from '../components/SongList';
import { ListMusic } from 'lucide-react';

export default function Playlist() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const query = id || searchParams.get('query') || '';
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadPlaylist() {
      if (!query) return;
      setLoading(true);
      setError(null);
      try {
        const data = await getPlaylist(query);
        setSongs(Array.isArray(data) ? data : (data.songs || []));
      } catch (err) {
        console.error('Failed to load playlist:', err);
        setError('Failed to load playlist tracks.');
      } finally {
        setLoading(false);
      }
    }
    loadPlaylist();
  }, [query]);

  return (
    <div className="playlist-page">
      <div className="section-header">
        <h1 className="section-title">
          <ListMusic size={24} color="var(--accent-primary)" />
          <span>Playlist</span>
        </h1>
      </div>
      <SongList songs={songs} isLoading={loading} error={error} emptyMessage="No tracks in this playlist." />
    </div>
  );
}
