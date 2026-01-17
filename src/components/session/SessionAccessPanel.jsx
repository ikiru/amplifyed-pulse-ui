import React, { useState } from 'react';
import { QRCodeDisplay } from './QRCodeDisplay.jsx';

/**
 * SessionAccessPanel Component
 * 
 * Displays session access code for trainers.
 * Matches wireframe A.2.1 from SESSION_CONTRACT.md
 * 
 * Note: Participant count is displayed in the PULSE window, not here.
 * 
 * @param {Object} props
 * @param {string} props.accessCode - Session access code (e.g., "ABCD-1234")
 * @param {boolean} [props.showQr=true] - Whether to render the QR code (useful for LiveView; optional for TrainerView)
 */
export function SessionAccessPanel({ accessCode, showQr = true }) {
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

        {/* QR Code (optional) */}
        {showQr ? <QRCodeDisplay accessCode={accessCode} /> : null}
      </div>
    </div>
  );
}
