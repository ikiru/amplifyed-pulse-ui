import React, { useState } from 'react';
import MediaCueItem from './MediaCueItem.jsx';
import MediaCueForm from './MediaCueForm.jsx';

/**
 * MediaCuesPanel Component
 * 
 * Displays list of Media Cues with validation badges
 */
export default function MediaCuesPanel({
  mediaCues,
  validation,
  isReadOnly,
  onCreate,
  onEdit,
  onDelete,
  onValidate,
}) {
  const [showForm, setShowForm] = useState(false);
  const [editingCue, setEditingCue] = useState(null);

  const handleCreate = (cueData) => {
    onCreate(cueData);
    setShowForm(false);
  };

  const handleEdit = (cueId) => {
    const cue = mediaCues.find((c) => c.id === cueId);
    if (cue) {
      setEditingCue(cue);
      setShowForm(true);
    }
  };

  const handleSaveEdit = (cueData) => {
    if (editingCue) {
      onEdit(editingCue.id, cueData);
      setEditingCue(null);
      setShowForm(false);
    }
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingCue(null);
  };

  return (
    <div className="media-cues-panel">
      <div className="panel-header">
        <h2>Media Cues</h2>
        <p className="panel-description">
          Pre-authored media instructions for live execution
        </p>
      </div>

      {showForm ? (
        <div className="media-cue-form-container">
          <MediaCueForm
            cue={editingCue}
            onSave={editingCue ? handleSaveEdit : handleCreate}
            onCancel={handleCancelForm}
          />
        </div>
      ) : (
        <>
          <div className="media-cues-list">
            {mediaCues.length === 0 ? (
              <div className="empty-state">
                <p>No Media Cues yet. Add one below.</p>
              </div>
            ) : (
              mediaCues.map((cue) => {
                // Merge validation state from validation.media[cueId] into the cue
                const cueWithValidation = {
                  ...cue,
                  validation: validation?.media?.[cue.id] || cue.validation,
                };
                
                return (
                  <MediaCueItem
                    key={cue.id}
                    cue={cueWithValidation}
                    isReadOnly={isReadOnly}
                    onEdit={handleEdit}
                    onDelete={onDelete}
                    onValidate={onValidate}
                  />
                );
              })
            )}
          </div>

          {!isReadOnly && (
            <div className="media-cue-add">
              <button
                onClick={() => setShowForm(true)}
                className="media-cue-add-btn"
              >
                + Add Media Cue
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
