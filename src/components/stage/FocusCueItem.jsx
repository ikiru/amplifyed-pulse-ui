import React, { useState } from 'react';

/**
 * FocusCueItem Component
 * 
 * Individual Focus Cue display with edit/delete controls
 */
export default function FocusCueItem({
  cue,
  isDefault,
  isReadOnly,
  onEdit,
  onDelete,
  onSetDefault,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(cue.text);

  const handleSave = () => {
    if (editText.trim() && editText !== cue.text) {
      onEdit(cue.id, editText.trim());
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditText(cue.text);
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

  return (
    <div className={`focus-cue-item ${isDefault ? 'is-default' : ''}`}>
      <div className="focus-cue-content">
        {isEditing && !isReadOnly ? (
          <input
            type="text"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            className="focus-cue-edit-input"
            autoFocus
          />
        ) : (
          <div
            className="focus-cue-text"
            onClick={() => !isReadOnly && setIsEditing(true)}
            title={isReadOnly ? '' : 'Click to edit'}
          >
            {cue.text}
            {isDefault && <span className="default-badge">Default</span>}
          </div>
        )}
      </div>

      {!isReadOnly && (
        <div className="focus-cue-actions">
          {!isDefault && (
            <button
              onClick={() => onSetDefault(cue.id)}
              className="focus-cue-action-btn"
              title="Set as default"
            >
              Set Default
            </button>
          )}
          <button
            onClick={() => onDelete(cue.id)}
            className="focus-cue-action-btn delete"
            title="Delete"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
