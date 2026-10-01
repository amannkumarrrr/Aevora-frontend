import React, { useEffect } from 'react';
import { X, Mail, Heart, Sparkles } from 'lucide-react';

export default function SettingsModal({ isOpen, onClose }) {
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
            <span>About</span>
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
