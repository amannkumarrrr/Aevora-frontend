import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const FILTER_PILLS = [
  'Podcasts',
  'Work out',
  'Feel good',
  'Energise',
  'Romance',
  'Relax',
  'Party',
  'Commute',
  'Sad',
  'Focus',
  'Sleep',
];

export default function Navbar() {
  const navigate = useNavigate();

  const handlePillClick = (pill) => {
    navigate(`/search?q=${encodeURIComponent(pill)}`);
  };

  return (
    <header className="echo-navbar">
      <div className="echo-top-row">
        {/* Centered Aevora Music Branding */}
        <Link to="/" className="echo-brand" aria-label="Aevora Music Home">
          <span className="echo-brand-title">Aevora Music</span>
        </Link>
      </div>

      {/* Filter Pills Row matching Screenshot 2 */}
      <div className="echo-filter-row">
        {FILTER_PILLS.map((pill) => (
          <button
            key={pill}
            type="button"
            className="echo-filter-pill"
            onClick={() => handlePillClick(pill)}
          >
            {pill}
          </button>
        ))}
      </div>
    </header>
  );
}
