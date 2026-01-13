import React from "react";

/**
 * SessionHeader
 * 
 * Displays session information and insights toggle button.
 * 
 * @param {object} props
 * @param {string} props.connectionStatus - Socket connection status
 * @param {string} props.sessionIdLabel - Session ID label
 * @param {boolean} props.showInsights - Whether insights panel is visible
 * @param {function} props.onToggleInsights - Handler for insights toggle
 */
export function SessionHeader({
  connectionStatus,
  sessionIdLabel,
  showInsights,
  onToggleInsights,
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
      <button className="trainer-session-toggle" onClick={onToggleInsights}>
        Insights
      </button>
    </header>
  );
}
