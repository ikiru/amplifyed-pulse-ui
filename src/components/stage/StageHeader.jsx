import React from 'react';
import { Link } from 'react-router-dom';

/**
 * StageHeader Component
 * 
 * Displays session status and readiness indicator with navigation to TrainerView
 * 
 * @param {Object} props
 * @param {string} props.sessionState - Session state: 'DRAFT' | 'STAGED' | 'LIVE'
 * @param {string} props.readinessState - Readiness state: 'DRAFT' | 'STAGED'
 * @param {Object} props.validationSummary - Validation summary object
 */
export default function StageHeader({ sessionState, readinessState, validationSummary }) {
  const getStatusBadgeClass = (state) => {
    switch (state) {
      case 'LIVE':
        return 'status-badge live';
      case 'STAGED':
        return 'status-badge staged';
      case 'DRAFT':
      default:
        return 'status-badge draft';
    }
  };

  const getReadinessText = () => {
    if (readinessState === 'STAGED') {
      return 'Ready to Go Live';
    }
    return 'Not Ready';
  };

  return (
    <div className="stage-header">
      <div className="stage-header-content">
        <h1>Stage</h1>
        <div className="stage-status">
          <span className={getStatusBadgeClass(sessionState)}>
            {sessionState || 'DRAFT'}
          </span>
          <span className={`readiness-indicator ${readinessState === 'STAGED' ? 'ready' : ''}`}>
            {getReadinessText()}
          </span>
        </div>
        <Link to="/trainer" className="stage-nav-button">
          Go to Trainer View
        </Link>
      </div>
      {sessionState === 'LIVE' && (
        <div className="read-only-banner">
          <p><strong>Session is live. Stage is read-only.</strong></p>
        </div>
      )}
    </div>
  );
}
