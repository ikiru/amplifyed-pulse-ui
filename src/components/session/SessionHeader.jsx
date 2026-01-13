import React from "react";

/**
 * SessionHeader
 * 
 * Displays session information.
 * 
 * @param {object} props
 * @param {string} props.connectionStatus - Socket connection status
 * @param {string} props.sessionIdLabel - Session ID label
 */
export function SessionHeader({
  connectionStatus,
  sessionIdLabel,
}) {
  return (
    <header className="trainer-session-header">
      <div className="trainer-session-copy">
        <h1 className="trainer-session-title">Session View</h1>
        <p className="trainer-session-status">Socket: {connectionStatus}</p>
        <p className="session-label trainer-session-meta">
          Session: {sessionIdLabel}
        </p>
      </div>
    </header>
  );
}
