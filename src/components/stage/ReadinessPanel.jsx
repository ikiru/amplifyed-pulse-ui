import React from 'react';

/**
 * ReadinessPanel Component
 * 
 * Displays detailed readiness status and guidance.
 */
export default function ReadinessPanel({
  validation,
}) {
  const getStatusBadge = (status) => {
    const raw = status ? String(status).toLowerCase() : 'unvalidated';
    const normalized =
      raw === 'error' ? 'blocked' :
      (['ready', 'warning', 'blocked', 'unvalidated'].includes(raw) ? raw : 'warning');
    const label = normalized.toUpperCase();
    return <span className={`validation-badge ${normalized}`}>{label}</span>;
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
      </div>
    </div>
  );
}
