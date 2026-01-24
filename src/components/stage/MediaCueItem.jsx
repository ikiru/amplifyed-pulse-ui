import React from 'react';

/**
 * MediaCueItem Component
 * 
 * Individual Media Cue display with validation status
 */
export default function MediaCueItem({ cue, isReadOnly, onEdit, onDelete, onValidate }) {
  const getValidationBadgeClass = () => {
    const status = cue.validation?.status || 'unvalidated';
    return `validation-badge ${status}`;
  };

  const getValidationText = () => {
    const status = cue.validation?.status || 'unvalidated';
    return status.toUpperCase();
  };

  const truncateUrl = (url) => {
    if (!url) return '';
    if (url.length > 50) {
      return url.substring(0, 47) + '...';
    }
    return url;
  };

  return (
    <div className="media-cue-item">
      <div className="media-cue-header">
        <div className="media-cue-label">{cue.label}</div>
        <span className={getValidationBadgeClass()}>{getValidationText()}</span>
      </div>

      <div className="media-cue-details">
        <div className="media-cue-url" title={cue.source?.url}>
          {truncateUrl(cue.source?.url)}
        </div>
        <div className="media-cue-meta">
          <span>Audio: {cue.playback?.audioMode || 'videoOnly'}</span>
        </div>
      </div>

      {cue.validation?.reasons && cue.validation.reasons.length > 0 && (
        <div className="media-cue-warnings">
          <ul>
            {cue.validation.reasons.map((reason, idx) => (
              <li key={idx}>{reason}</li>
            ))}
          </ul>
        </div>
      )}

      {!isReadOnly && (
        <div className="media-cue-actions">
          <button
            onClick={() => onValidate && onValidate(cue.id)}
            className="media-cue-action-btn validate"
            title="Validate Now"
          >
            Validate Now
          </button>
          <button
            onClick={() => onEdit(cue.id)}
            className="media-cue-action-btn"
            title="Edit"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(cue.id)}
            className="media-cue-action-btn delete"
            title="Delete"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
