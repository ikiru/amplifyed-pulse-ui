import React from 'react';

/**
 * ReadinessPanel Component
 * 
 * Displays system readiness status and requirement toggles
 */
export default function ReadinessPanel({
  validation,
  requirements,
  mediaCues, // Legacy: kept for backward compatibility
  cues, // Unified stack: primary source
  isReadOnly,
  onRequirementToggle,
  onValidateRequest,
}) {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/4231279e-6952-4b85-bc1a-061d94f40485',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ReadinessPanel.jsx:render',message:'Rendering ReadinessPanel',data:{validation, requirements, mediaCues},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'4'})}).catch(()=>{});
  // #endregion
  const getStatusBadge = (status) => {
    const statusClass = `status-badge ${status}`;
    const statusText = status?.toUpperCase() || 'UNKNOWN';
    return <span className={statusClass}>{statusText}</span>;
  };

  const getStatusDetails = (subsystem) => {
    const status = validation?.[subsystem];
    
    // Show guidance when unvalidated
    if (!status || !status.status || status.status === 'unvalidated') {
      const subsystemName = subsystem === 'executor' ? 'Stage Executor' : subsystem === 'slideControl' ? 'slide control' : 'media';
      
      return (
        <div className="status-details">
          <div className="status-guidance">
            <p>Not yet validated. Click "Validate All" to check {subsystemName} status.</p>
          </div>
        </div>
      );
    }

    // Show actionable guidance based on status
    const getActionableGuidance = (subsystem, statusValue, reasons = []) => {
      if (statusValue === 'blocked' || statusValue === 'error') {
        if (subsystem === 'executor') {
          return (
            <div>
              <p><strong>Stage Executor Issue:</strong></p>
              <p>The Stage Engine is reporting a problem. Ensure the server is running correctly.</p>
            </div>
          );
        } else if (subsystem === 'slideControl') {
          return (
            <div>
              <p><strong>Step-by-step instructions:</strong></p>
              <div>
                <ol style={{ marginLeft: '20px', marginTop: '8px' }}>
                  <li>Find and start the <strong>slide control agent</strong> application on your computer (it may be in your Applications folder, or look for an icon in your menu bar at the top of your screen)</li>
                  <li>If you don't see the agent running, check if it needs to be installed first</li>
                  <li>Once the agent is running, wait 5-10 seconds for it to connect</li>
                  <li>If the agent asks for permissions, go to <strong>System Settings → Privacy & Security → Accessibility</strong> and make sure the agent is listed and its switch is turned ON</li>
                  <li>Come back here and click <strong>"Validate All"</strong> again</li>
                </ol>
              </div>
            </div>
          );
        }
      } else if (statusValue === 'warning') {
         if (subsystem === 'slideControl') {
          return (
            <div>
              <p><strong>You can proceed without slide control, but if you need it:</strong></p>
              <div>
                <ol style={{ marginLeft: '20px', marginTop: '8px' }}>
                  <li>Start the <strong>slide control agent</strong> application</li>
                  <li>Wait a few seconds for it to connect</li>
                  <li>If needed, grant accessibility permissions in System Settings</li>
                  <li>Click <strong>"Validate All"</strong> here to check again</li>
                </ol>
              </div>
            </div>
          );
        }
      }
      return null;
    };

    const guidance = getActionableGuidance(subsystem, status.status, status.reasons || []);

    return (
      <div className="status-details">
        {status.reasons && status.reasons.length > 0 && (
          <ul className="status-reasons">
            {status.reasons.map((reason, idx) => (
              <li key={idx}>{reason}</li>
            ))}
          </ul>
        )}
        {guidance && (
          <div className="status-guidance">
            {typeof guidance === 'string' ? (
              <p><strong>How to fix:</strong> {guidance}</p>
            ) : (
              <div>{guidance}</div>
            )}
          </div>
        )}
        {status.lastChecked && (
          <div className="status-timestamp">
            Last checked: {new Date(status.lastChecked).toLocaleTimeString()}
          </div>
        )}
      </div>
    );
  };

  const getMediaSummary = () => {
    // Get media cues from unified stack or legacy array
    const mediaCuesList = cues
      ? cues.filter(c => c.type === 'media')
      : mediaCues || [];

    if (!mediaCuesList || mediaCuesList.length === 0) {
      return { ready: 0, warning: 0, blocked: 0 };
    }

    const summary = { ready: 0, warning: 0, blocked: 0 };
    mediaCuesList.forEach((cue) => {
      const status = cue.type === 'media' 
        ? (cue.data.validation?.status || 'unvalidated')
        : (cue.validation?.status || 'unvalidated');
      if (status === 'ready') summary.ready++;
      else if (status === 'warning') summary.warning++;
      else if (status === 'blocked') summary.blocked++;
    });

    return summary;
  };

  const mediaSummary = getMediaSummary();

  return (
    <div className="readiness-panel">
      <div className="panel-header">
        <h2>System Readiness</h2>
        <p className="panel-description">
          Validation status for required systems
        </p>
      </div>

      <div className="readiness-status">
        <div className="readiness-item">
          <div className="readiness-item-header">
            <span className="readiness-item-label">Stage Executor</span>
            {getStatusBadge(validation?.executor?.status || 'unvalidated')}
          </div>
          {getStatusDetails('executor')}
        </div>

        <div className="readiness-item">
          <div className="readiness-item-header">
            <span className="readiness-item-label">Slide Control</span>
            {getStatusBadge(validation?.slideControl?.status || 'unvalidated')}
          </div>
          {getStatusDetails('slideControl')}
        </div>

        <div className="readiness-item">
          <div className="readiness-item-header">
            <span className="readiness-item-label">Media Cues</span>
            <span className="media-summary">
              {mediaSummary.ready} ready, {mediaSummary.warning} warning,{' '}
              {mediaSummary.blocked} blocked
            </span>
          </div>
          {((!cues || cues.filter(c => c.type === 'media').length === 0) && (!mediaCues || mediaCues.length === 0)) && (
            <div className="status-details">
              <div className="status-guidance">
                <p>No Media Cues to validate. Add Media Cues in the left panel to validate their URLs.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="requirements-section">
        <h3>Requirements</h3>
        <div className="requirement-toggles">
          <label>
            <input
              type="checkbox"
              checked={true}
              disabled={true}
            />
            Stage Executor (Required)
          </label>
          <label>
            <input
              type="checkbox"
              checked={requirements?.slideControlRequired || false}
              onChange={(e) =>
                onRequirementToggle({ slideControlRequired: e.target.checked })
              }
              disabled={isReadOnly}
            />
            Slide Control Required
          </label>
        </div>
      </div>

      {!isReadOnly && (
        <div className="readiness-actions">
          <button
            onClick={() => onValidateRequest('all')}
            className="validate-all-btn"
          >
            Validate All
          </button>
        </div>
      )}
    </div>
  );
}
