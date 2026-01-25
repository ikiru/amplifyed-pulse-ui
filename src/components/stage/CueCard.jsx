import React, { useState } from 'react';

/**
 * CueCard Component
 * 
 * Unified component for displaying both focus and media cues
 * Shows type indicator, content preview, position, and actions
 */
export default function CueCard({
  cue,
  position,
  currentPosition,
  isReadOnly,
  isDefault,
  onEdit,
  onUpdate,
  onDelete,
  onSetDefault,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const focusText = cue?.data?.text ?? cue?.text ?? '';
  const [editText, setEditText] = useState(cue.type === 'focus' ? focusText : '');

  const isExecuted = currentPosition >= 0 && position <= currentPosition;
  const canEdit = !isReadOnly && (
    cue.type === 'focus' 
      ? !isExecuted  // Focus: editable if unexecuted
      : cue.data.validation?.status === 'unvalidated'  // Media: editable only if unvalidated
  );
  const canDelete = !isReadOnly && !isExecuted && !isDefault;

  const handleSave = () => {
    if (cue.type === 'focus' && editText.trim() && editText !== focusText) {
      onUpdate?.(cue.id, { text: editText.trim() });
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditText(cue.type === 'focus' ? focusText : '');
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const getValidationBadgeClass = () => {
    if (cue.type !== 'media' && cue.type !== 'presentation') return '';
    const status = cue.data.validation?.status || 'unvalidated';
    return `validation-badge ${status}`;
  };

  const getValidationText = () => {
    if (cue.type !== 'media' && cue.type !== 'presentation') return '';
    const status = cue.data.validation?.status || 'unvalidated';
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
    if (cue.type !== 'media' && cue.type !== 'presentation') return '';
    const source = cue.data.source;
    if (!source) return '';
    
    if (source.type === 'powerpoint') {
      return source.filePath || '';
    } else if (source.type === 'googleslides' || source.type === 'youtube') {
      return source.url || '';
    }
    return '';
  };

  const getSourceTypeLabel = () => {
    if (cue.type !== 'media' && cue.type !== 'presentation') return '';
    const source = cue.data.source;
    if (!source) return '';
    
    if (source.type === 'powerpoint') return 'PowerPoint';
    if (source.type === 'googleslides') return 'Google Slides';
    if (source.type === 'youtube') return 'YouTube';
    return '';
  };

  return (
    <div className={`cue-card cue-card-${cue.type} ${isExecuted ? 'is-executed' : ''} ${isDefault ? 'is-default' : ''}`}>
      <div className="cue-card-header">
        <div className="cue-position">#{position + 1}</div>
        <span className={`cue-type-badge cue-type-${cue.type}`}>
          {cue.type === 'focus' ? 'Focus' : cue.type === 'presentation' ? 'Presentation' : 'Media'}
        </span>
        {(cue.type === 'media' || cue.type === 'presentation') && (
          <span className={getValidationBadgeClass()}>{getValidationText()}</span>
        )}
        {isExecuted && <span className="executed-badge">Executed</span>}
      </div>

      <div className="cue-card-content">
        {cue.type === 'focus' ? (
          <>
            {isEditing && canEdit ? (
              <input
                type="text"
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                onBlur={handleSave}
                onKeyDown={handleKeyDown}
                className="cue-edit-input"
                autoFocus
              />
            ) : (
              <div
                className="cue-text"
                onClick={() => canEdit && setIsEditing(true)}
                title={canEdit ? 'Click to edit' : ''}
              >
                {focusText}
                {isDefault && <span className="default-badge">Default</span>}
              </div>
            )}
          </>
        ) : (
          <>
            <div className="cue-label">{cue.data.label}</div>
            {getSourceTypeLabel() && (
              <div className="cue-source-type">{getSourceTypeLabel()}</div>
            )}
            <div className="cue-source-url" title={getSourceDisplay()}>
              {truncateText(getSourceDisplay())}
            </div>
            {cue.type === 'media' && cue.data.source?.type === 'youtube' && (
              <div className="cue-meta">
                Audio: {cue.data.playback?.audioMode || 'videoOnly'}
              </div>
            )}
            {cue.data.validation?.reasons && cue.data.validation.reasons.length > 0 && (
              <div className="cue-warnings">
                <ul>
                  {cue.data.validation.reasons.map((reason, idx) => (
                    <li key={idx}>{reason}</li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </div>

      {!isReadOnly && (
        <div className="cue-card-actions">
          {cue.type === 'focus' && !isDefault && (
            <button
              onClick={() => onSetDefault && onSetDefault(cue.id)}
              className="cue-action-btn"
              title="Set as default"
              disabled={isExecuted}
            >
              Set Default
            </button>
          )}
          {canEdit && cue.type !== 'focus' && (
            <button
              onClick={() => {
                onEdit && onEdit(cue.id);
              }}
              className="cue-action-btn"
              title="Edit"
            >
              Edit
            </button>
          )}
          {canDelete && (
            <button
              onClick={() => onDelete && onDelete(cue.id)}
              className="cue-action-btn delete"
              title="Delete"
            >
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  );
}
