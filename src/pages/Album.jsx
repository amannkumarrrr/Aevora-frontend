import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { getAlbum } from '../services/musicApi';
import SongList from '../components/SongList';
import { Disc3 } from 'lucide-react';

export default function Album() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const query = id || searchParams.get('query') || '';
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadAlbum() {
      if (!query) return;
      setLoading(true);
      setError(null);
      try {
        const data = await getAlbum(query);
        setSongs(Array.isArray(data) ? data : (data.songs || []));
      } catch (err) {
        console.error('Failed to load album:', err);
        setError('Failed to load album details.');
      } finally {
        setLoading(false);
      }
    }
    loadAlbum();
  }, [query]);

  return (
    <div className="album-page">
      <div className="section-header">
        <h1 className="section-title">
          <Disc3 size={24} color="var(--accent-secondary)" />
          <span>Album</span>
        </h1>
      </div>
      <SongList songs={songs} isLoading={loading} error={error} emptyMessage="No tracks in this album." />
    </div>
  );
}
