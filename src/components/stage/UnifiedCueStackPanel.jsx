import React, { useState } from 'react';
import CueCard from './CueCard.jsx';
import CueTypeForm from './CueTypeForm.jsx';

/**
 * UnifiedCueStackPanel Component
 * 
 * Single unified panel for managing all cues (focus and media) in a unified stack
 * Replaces separate FocusCuesPanel and MediaCuesPanel
 */
export default function UnifiedCueStackPanel({
  cues = [],
  currentPosition = -1,
  defaultFocusCueId,
  validation = {},
  isReadOnly,
  onCreate,
  onEdit,
  onDelete,
  onReorder,
  onSetDefault,
}) {
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState(null);
  const [editingCue, setEditingCue] = useState(null);
  const [draggedIndex, setDraggedIndex] = useState(null);

  // Sort cues by position
  const sortedCues = [...cues].sort((a, b) => a.position - b.position);

  const handleAddCue = (type) => {
    setFormType(type);
    setEditingCue(null);
    setShowForm(true);
  };

  const handleCreate = (cueData) => {
    if (formType === 'focus') {
      onCreate('focus', { text: cueData.text, isDefault: cueData.isDefault || false });
    } else if (formType === 'media') {
      onCreate('media', {
        label: cueData.label,
        source: cueData.source,
        playback: cueData.playback,
        binding: cueData.binding,
      });
    } else if (formType === 'presentation') {
      onCreate('presentation', {
        label: cueData.label,
        source: cueData.source,
        playback: cueData.playback,
      });
    }
    setShowForm(false);
    setFormType(null);
  };

  const handleEdit = (cueId) => {
    const cue = cues.find(c => c.id === cueId);
    if (cue) {
      setFormType(cue.type);
      setEditingCue(cue);
      setShowForm(true);
    }
  };

  const handleSaveEdit = (cueData) => {
    if (editingCue) {
      onEdit(editingCue.id, cueData);
      setEditingCue(null);
      setShowForm(false);
      setFormType(null);
    }
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingCue(null);
    setFormType(null);
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
      const reordered = [...sortedCues];
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
    <div className="unified-cue-stack-panel">
      <div className="panel-header">
        <h2>Unified Cue Stack</h2>
        <p className="panel-description">
          Manage all cues in a single ordered sequence
        </p>
        {currentPosition >= 0 && (
          <div className="position-indicator">
            Current Position: {currentPosition + 1} / {sortedCues.length}
          </div>
        )}
      </div>

      {showForm ? (
        <div className="cue-form-container">
          <CueTypeForm
            type={formType}
            cue={editingCue}
            onSave={editingCue ? handleSaveEdit : handleCreate}
            onCancel={handleCancelForm}
          />
        </div>
      ) : (
        <>
          <div className="cue-stack-list">
            {sortedCues.length === 0 ? (
              <div className="empty-state">
                <p>No cues yet. Add one below.</p>
              </div>
            ) : (
              sortedCues.map((cue, index) => (
                <div
                  key={cue.id}
                  draggable={!isReadOnly && currentPosition < 0}
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`cue-wrapper ${draggedIndex === index ? 'dragging' : ''} ${currentPosition >= 0 && cue.position <= currentPosition ? 'executed' : ''}`}
                >
                  {!isReadOnly && currentPosition < 0 && (
                    <div className="drag-handle" title="Drag to reorder">
                      ⋮⋮
                    </div>
                  )}
                  <CueCard
                    cue={cue}
                    position={cue.position}
                    currentPosition={currentPosition}
                    isReadOnly={isReadOnly}
                    isDefault={cue.type === 'focus' && cue.id === defaultFocusCueId}
                    onEdit={handleEdit}
                    onDelete={onDelete}
                    onSetDefault={onSetDefault}
                  />
                </div>
              ))
            )}
          </div>

          {!isReadOnly && (
            <div className="cue-add-controls">
              <div className="cue-type-selector">
                <button
                  onClick={() => handleAddCue('focus')}
                  className="btn-secondary"
                  type="button"
                >
                  + Add Focus Cue
                </button>
                <button
                  onClick={() => handleAddCue('media')}
                  className="btn-secondary"
                  type="button"
                >
                  + Add Media Cue
                </button>
                <button
                  onClick={() => handleAddCue('presentation')}
                  className="btn-secondary"
                  type="button"
                >
                  + Add Presentation
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
