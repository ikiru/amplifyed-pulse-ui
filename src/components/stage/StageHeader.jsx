import React from 'react';
import { Link } from 'react-router-dom';

/**
 * StageHeader Component
 * 
 * Displays session status, readiness, and system validation status.
 * 
 * @param {Object} props
 * @param {string} props.sessionState - Session state: 'DRAFT' | 'STAGED' | 'LIVE'
 * @param {string} props.readinessState - Readiness state: 'DRAFT' | 'STAGED'
 * @param {Object} props.validationSummary - Validation summary object (executor/slideControl/media)
 * @param {Object} props.requirements - Requirements object (e.g., slideControlRequired)
 * @param {boolean} props.isReadOnly - True when session is LIVE
 * @param {Function} props.onValidateAll - Trigger validation request for all subsystems
 * @param {Function} props.onToggleSlideControlRequired - Toggle slide control requirement
 */
export default function StageHeader({
  sessionState,
  readinessState,
  validationSummary,
  requirements,
  isReadOnly,
  onValidateAll,
  onToggleSlideControlRequired,
}) {
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

  const normalizeSubsystemStatus = (status) => {
    if (!status) return 'unvalidated';
    const normalized = String(status).toLowerCase();
    if (['ready', 'warning', 'blocked', 'unvalidated'].includes(normalized)) {
      return normalized;
    }
    // Allow older/unknown values to display as warning-ish
    return 'warning';
  };

  const executorStatus = normalizeSubsystemStatus(validationSummary?.executor?.status);
  const slideControlStatus = normalizeSubsystemStatus(validationSummary?.slideControl?.status);

  return (
    <div className="stage-header">
      <div className="stage-header-content">
        <div className="stage-header-left">
          <h1>Stage</h1>
          <div className="stage-status">
            <span className={getStatusBadgeClass(sessionState)}>
              {sessionState || 'DRAFT'}
            </span>
            <span className={`readiness-indicator ${readinessState === 'STAGED' ? 'ready' : ''}`}>
              {getReadinessText()}
            </span>
            <div className="stage-subsystem-status" aria-label="System validation status">
              <span className="subsystem-item">
                <span className="subsystem-label">Executor</span>
                <span className={`validation-badge ${executorStatus}`}>{executorStatus.toUpperCase()}</span>
              </span>
              <span className="subsystem-item">
                <span className="subsystem-label">Slide</span>
                <span className={`validation-badge ${slideControlStatus}`}>{slideControlStatus.toUpperCase()}</span>
              </span>
            </div>
          </div>
        </div>

        <div className="stage-header-actions">
          <label className="header-toggle">
            <input
              type="checkbox"
              checked={!!requirements?.slideControlRequired}
              onChange={(e) => onToggleSlideControlRequired?.(e.target.checked)}
              disabled={!!isReadOnly}
            />
            Slide Control Required
          </label>

          <button
            type="button"
            className="btn-secondary header-validate-btn"
            onClick={() => onValidateAll?.()}
            disabled={!!isReadOnly || !onValidateAll}
            title={isReadOnly ? 'Stage is read-only while LIVE' : 'Validate executor, slide control, and media'}
          >
            Validate All
          </button>

          <Link to="/trainer" className="stage-nav-button">
            Trainer View
          </Link>
        </div>
      </div>
      {(sessionState === 'LIVE' || isReadOnly) && (
        <div className="read-only-banner">
          <p><strong>Session is live. Stage is read-only.</strong></p>
        </div>
      )}
    </div>
  );
}
