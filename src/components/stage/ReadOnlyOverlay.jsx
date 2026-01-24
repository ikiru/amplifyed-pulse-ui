import React from 'react';
import { Link } from 'react-router-dom';

/**
 * ReadOnlyOverlay Component
 * 
 * Semi-transparent overlay shown when session is LIVE
 */
export default function ReadOnlyOverlay({ isVisible, sessionId }) {
  if (!isVisible) {
    return null;
  }

  return (
    <div className="read-only-overlay">
      <div className="read-only-overlay-content">
        <h2>Session is Live</h2>
        <p>Staging state is read-only. All changes must be made before going live.</p>
        <Link to="/trainer" className="read-only-overlay-link">
          Go to TrainerView
        </Link>
      </div>
    </div>
  );
}
