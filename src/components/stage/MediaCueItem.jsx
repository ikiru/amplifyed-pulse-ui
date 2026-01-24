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

  const truncateText = (text) => {
    if (!text) return '';
    if (text.length > 50) {
      return text.substring(0, 47) + '...';
    }
    return text;
  };

  const getSourceDisplay = () => {
    const source = cue.source;
    if (!source) return '';
    
    if (source.type === 'powerpoint') {
      return source.filePath || '';
    } else if (source.type === 'googleslides' || source.type === 'youtube') {
      return source.url || '';
    }
    return '';
  };

  const getSourceTypeLabel = () => {
    const source = cue.source;
    if (!source) return '';
    
    if (source.type === 'powerpoint') return 'PowerPoint';
    if (source.type === 'googleslides') return 'Google Slides';
    if (source.type === 'youtube') return 'YouTube';
    return '';
  };

  const sourceDisplay = getSourceDisplay();
  const sourceTypeLabel = getSourceTypeLabel();

  return (
    <div className="media-cue-item">
      <div className="media-cue-header">
        <div className="media-cue-label">{cue.label}</div>
        <span className={getValidationBadgeClass()}>{getValidationText()}</span>
      </div>

      <div className="media-cue-details">
        {sourceTypeLabel && (
          <div style={{ fontSize: '11px', color: '#999', marginBottom: '4px', textTransform: 'uppercase' }}>
            {sourceTypeLabel}
          </div>
        )}
        <div className="media-cue-url" title={sourceDisplay}>
          {truncateText(sourceDisplay)}
        </div>
        <div className="media-cue-meta">
          {cue.source?.type === 'youtube' && (
            <span>Audio: {cue.playback?.audioMode || 'videoOnly'}</span>
          )}
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
