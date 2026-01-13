import React, { useState } from 'react';

/**
 * SessionAccessPanel Component
 * 
 * Displays session access code and participant count for trainers.
 * Matches wireframe A.2.1 from SESSION_CONTRACT.md
 * 
 * @param {Object} props
 * @param {string} props.accessCode - Session access code (e.g., "ABCD-1234")
 * @param {number} props.participantCount - Number of active participants
 */
export function SessionAccessPanel({ accessCode, participantCount = 0 }) {
  const [copySuccess, setCopySuccess] = useState(false);

  /**
   * Copy access code to clipboard
   */
  const handleCopyCode = async () => {
    if (!accessCode) {
      return;
    }

    try {
      await navigator.clipboard.writeText(accessCode);
      setCopySuccess(true);
      
      // Reset success message after 2 seconds
      setTimeout(() => {
        setCopySuccess(false);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy access code:', err);
    }
  };

  return (
    <div className="session-access-panel">
      <div className="session-access-content">
        {/* Session Code Display */}
        <div className="session-code-section">
          <p className="session-code-label">Session Code</p>
          <div className="session-code-display">
            {accessCode || '—'}
          </div>
          <p className="session-code-help">
            Share this code with your audience to join the session
          </p>
        </div>

        {/* Copy Button */}
        <button
          className="session-copy-button"
          onClick={handleCopyCode}
          disabled={!accessCode}
          title="Copy session code to clipboard"
        >
          {copySuccess ? '✓ Copied!' : 'Copy Code'}
        </button>

        {/* Participant Count */}
        <div className="session-participant-count">
          <span className="participant-icon">👥</span>
          <span className="participant-number">{participantCount}</span>
          <span className="participant-label">
            {participantCount === 1 ? 'participant' : 'participants'}
          </span>
        </div>

        {/* QR Code Placeholder (Future Implementation) */}
        <div className="session-qr-placeholder">
          <div className="qr-placeholder-box">
            <span className="qr-placeholder-text">QR Code</span>
            <span className="qr-placeholder-subtitle">(Coming Soon)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
