import React, { useEffect } from 'react';
import { X, Mail, Heart, Sparkles, Sliders } from 'lucide-react';
import { useMusicPlayer } from '../context/MusicPlayerContext';

export default function SettingsModal({ isOpen, onClose }) {
  const { crossfadeDuration, setCrossfadeDuration } = useMusicPlayer();

  // Close with Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop echo-settings-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-label="Settings and About">
      <div className="echo-settings-card" onClick={(e) => e.stopPropagation()}>
        {/* Header with Close Button */}
        <div className="echo-settings-header">
          <div className="echo-settings-header-title">
            <Sparkles size={16} className="echo-settings-sparkle-icon" />
            <span>Settings & About</span>
          </div>
          <button
            type="button"
            className="echo-settings-close-btn"
            onClick={onClose}
            aria-label="Close settings"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="echo-settings-body">
          {/* Brand Heading */}
          <div className="echo-settings-brand-wrap">
            <h2 className="echo-settings-app-title">Aevora Music</h2>
            <div className="echo-settings-author-badge">
              Made by <span className="author-name">Aman Kumar</span>
            </div>
          </div>

          <div className="echo-settings-divider" />

          {/* Playback Settings / Crossfade */}
          <div className="echo-settings-section" style={{ margin: '8px 0 16px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Sliders size={16} color="var(--accent-primary, #6366f1)" />
                <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)' }}>Crossfade</span>
              </div>
              <span style={{ fontSize: '0.78rem', color: crossfadeDuration > 0 ? '#10b981' : 'var(--text-dim)', fontWeight: 600, background: 'rgba(255, 255, 255, 0.05)', padding: '2px 8px', borderRadius: 'var(--radius-full)' }}>
                {crossfadeDuration > 0 ? `${crossfadeDuration}s` : 'Off'}
              </span>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 10, lineHeight: 1.4 }}>
              Smoothly transition between songs with dual audio fading
            </p>

            <select
              value={crossfadeDuration}
              onChange={(e) => setCrossfadeDuration(Number(e.target.value))}
              className="echo-settings-select"
              aria-label="Select crossfade duration"
              style={{
                width: '100%',
                background: 'rgba(255, 255, 255, 0.06)',
                color: 'var(--text-main)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: 'var(--radius-sm, 8px)',
                padding: '10px 14px',
                fontSize: '0.88rem',
                fontWeight: 500,
                outline: 'none',
                cursor: 'pointer',
                transition: 'border-color 0.2s ease',
              }}
            >
              <option value={0} style={{ background: '#18181b', color: '#fff' }}>Off</option>
              <option value={2} style={{ background: '#18181b', color: '#fff' }}>2 seconds</option>
              <option value={4} style={{ background: '#18181b', color: '#fff' }}>4 seconds</option>
              <option value={6} style={{ background: '#18181b', color: '#fff' }}>6 seconds</option>
              <option value={8} style={{ background: '#18181b', color: '#fff' }}>8 seconds</option>
              <option value={10} style={{ background: '#18181b', color: '#fff' }}>10 seconds</option>
              <option value={12} style={{ background: '#18181b', color: '#fff' }}>12 seconds</option>
            </select>
          </div>

          <div className="echo-settings-divider" />

          {/* Description */}
          <div className="echo-settings-text-block">
            <p className="echo-settings-desc">
              This app is made by <strong>Aman Kumar</strong>.
            </p>
            <p className="echo-settings-contact-prompt">
              For any issues, feedback, suggestions, or technical problems, please contact:
            </p>
          </div>

          {/* Clickable Email Card */}
          <a
            href="mailto:yh6828265@gmail.com"
            className="echo-settings-email-btn"
            title="Send email to Aman Kumar"
          >
            <div className="echo-settings-email-icon-wrap">
              <Mail size={18} />
            </div>
            <span className="echo-settings-email-text">yh6828265@gmail.com</span>
          </a>

          <div className="echo-settings-divider" />

          {/* Thank you message */}
          <div className="echo-settings-footer-note">
            <p>
              Thank you for using <span className="brand-accent">Aevora Music</span> <Heart size={14} className="heart-inline" fill="#f43f5e" color="#f43f5e" />
            </p>
          </div>

          {/* Close/Back Button */}
          <button
            type="button"
            className="echo-settings-done-btn"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
