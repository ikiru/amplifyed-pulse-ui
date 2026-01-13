import React, { useState } from 'react';

/**
 * SessionEntry Component
 * 
 * Entry form for joining a session via access code.
 * Matches wireframe A.1.1 from SESSION_CONTRACT.md
 * 
 * @param {Object} props
 * @param {Function} props.onJoin - Callback when join button is clicked
 * @param {boolean} props.isJoining - Loading state
 * @param {string} props.error - Error message to display
 * @param {Function} props.onClearError - Callback to clear error
 */
export function SessionEntry({ onJoin, isJoining = false, error = null, onClearError }) {
  const [code, setCode] = useState('');

  /**
   * Format code input with automatic hyphen insertion
   * Converts to uppercase and adds hyphen after 4th character
   */
  const handleCodeChange = (e) => {
    let value = e.target.value.toUpperCase();
    
    // Remove any existing hyphens
    value = value.replace(/-/g, '');
    
    // Only allow letters and numbers
    value = value.replace(/[^A-Z0-9]/g, '');
    
    // Limit to 8 characters (4 letters + 4 numbers)
    value = value.substring(0, 8);
    
    // Add hyphen after 4th character
    if (value.length > 4) {
      value = value.substring(0, 4) + '-' + value.substring(4);
    }
    
    setCode(value);
    
    // Clear error when user starts typing
    if (error && onClearError) {
      onClearError();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!code || code.length < 9) {
      return;
    }
    
    onJoin(code);
  };

  const isCodeValid = code.length === 9; // XXXX-XXXX format

  return (
    <div className="session-entry-container">
      <div className="session-entry-content">
        <h1 className="session-entry-title">AMPLIFYED PULSE</h1>
        <h2 className="session-entry-subtitle">Join a Live Session</h2>

        <form onSubmit={handleSubmit} className="session-entry-form">
          <div className="session-entry-field">
            <label htmlFor="session-code" className="session-entry-label">
              Enter Session Code
            </label>
            <input
              id="session-code"
              type="text"
              className="session-entry-input"
              value={code}
              onChange={handleCodeChange}
              placeholder="ABCD-1234"
              disabled={isJoining}
              autoComplete="off"
              autoFocus
              maxLength={9}
            />
          </div>

          {error && (
            <div className="session-entry-error" role="alert">
              ⚠️ {error}
            </div>
          )}

          {isJoining && (
            <div className="session-entry-loading">
              ⏳ Joining session...
            </div>
          )}

          <button
            type="submit"
            className="session-entry-button"
            disabled={!isCodeValid || isJoining}
          >
            Join Session
          </button>
        </form>

        <div className="session-entry-help">
          <p>Ask your facilitator for the session code</p>
        </div>
      </div>
    </div>
  );
}
