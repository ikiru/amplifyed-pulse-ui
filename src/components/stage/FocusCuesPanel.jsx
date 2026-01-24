import React, { useState } from 'react';
import FocusCueItem from './FocusCueItem.jsx';

/**
 * FocusCuesPanel Component
 * 
 * Displays ordered list of Focus Cues with drag-and-drop reordering
 */
export default function FocusCuesPanel({
  focusCues,
  defaultFocusCueId,
  isReadOnly,
  onCreate,
  onEdit,
  onDelete,
  onReorder,
  onSetDefault,
}) {
  const [newCueText, setNewCueText] = useState('');
  const [draggedIndex, setDraggedIndex] = useState(null);

  const handleAddCue = () => {
    if (newCueText.trim()) {
      onCreate(newCueText.trim());
      setNewCueText('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddCue();
    }
  };

  const handleDragStart = (index) => {
    if (isReadOnly) return;
    setDraggedIndex(index);
  };

  const handleDragOver = (e, index) => {
    if (isReadOnly || draggedIndex === null) return;
    e.preventDefault();
  };

  const handleDrop = (e, dropIndex) => {
    if (isReadOnly || draggedIndex === null) return;
    e.preventDefault();

    if (draggedIndex !== dropIndex) {
      const reordered = [...focusCues];
      const [removed] = reordered.splice(draggedIndex, 1);
      reordered.splice(dropIndex, 0, removed);

      const orderedIds = reordered.map((cue) => cue.id);
      onReorder(orderedIds);
    }

    setDraggedIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  return (
    <div className="focus-cues-panel">
      <div className="panel-header">
        <h2>Focus Cues</h2>
        <p className="panel-description">
          Pre-authored focus statements for live facilitation
        </p>
      </div>

      <div className="focus-cues-list">
        {focusCues.length === 0 ? (
          <div className="empty-state">
            <p>No Focus Cues yet. Add one below.</p>
          </div>
        ) : (
          focusCues.map((cue, index) => (
            <div
              key={cue.id}
              draggable={!isReadOnly}
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              className={`focus-cue-wrapper ${draggedIndex === index ? 'dragging' : ''}`}
            >
              {!isReadOnly && (
                <div className="drag-handle" title="Drag to reorder">
                  ⋮⋮
                </div>
              )}
              <FocusCueItem
                cue={cue}
                isDefault={cue.id === defaultFocusCueId}
                isReadOnly={isReadOnly}
                onEdit={onEdit}
                onDelete={onDelete}
                onSetDefault={onSetDefault}
              />
            </div>
          ))
        )}
      </div>

      {!isReadOnly && (
        <div className="focus-cue-add">
          <input
            type="text"
            value={newCueText}
            onChange={(e) => setNewCueText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter focus statement..."
            className="focus-cue-input"
          />
          <button
            onClick={handleAddCue}
            disabled={!newCueText.trim()}
            className="focus-cue-add-btn"
          >
            Add Focus Cue
          </button>
        </div>
      )}
    </div>
  );
}
