import React, { useState } from 'react';
import MediaCueForm from './MediaCueForm.jsx';
import PresentationCueForm from './PresentationCueForm.jsx';

/**
 * CueTypeForm Component
 * 
 * Type-specific form for creating/editing cues
 * Routes to appropriate form based on cue type
 */
export default function CueTypeForm({ type, cue, onSave, onCancel }) {
  const [focusText, setFocusText] = useState(cue?.data?.text || '');

  if (type === 'media') {
    // Reuse existing MediaCueForm for media cues (YouTube only)
    return (
      <MediaCueForm
        cue={cue ? {
          label: cue.data.label,
          source: cue.data.source,
          playback: cue.data.playback,
          binding: cue.data.binding,
          validation: cue.data.validation,
        } : null}
        onSave={(cueData) => {
          onSave({
            label: cueData.label,
            source: cueData.source,
            playback: cueData.playback,
            binding: cueData.binding,
          });
        }}
        onCancel={onCancel}
      />
    );
  }

  if (type === 'presentation') {
    // Use PresentationCueForm for presentation cues (PowerPoint, Google Slides)
    return (
      <PresentationCueForm
        cue={cue ? {
          label: cue.data.label,
          source: cue.data.source,
          playback: cue.data.playback,
        } : null}
        onSave={(cueData) => {
          onSave({
            label: cueData.label,
            source: cueData.source,
            playback: cueData.playback,
          });
        }}
        onCancel={onCancel}
      />
    );
  }

  // Focus cue form
  const handleSubmit = (e) => {
    e.preventDefault();
    if (focusText.trim()) {
      onSave({
        text: focusText.trim(),
        isDefault: false,
      });
    }
  };

  return (
    <form className="cue-type-form focus-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="focus-text">Focus Statement</label>
        <textarea
          id="focus-text"
          value={focusText}
          onChange={(e) => setFocusText(e.target.value)}
          placeholder="Enter focus statement..."
          rows={3}
          required
        />
      </div>

      <div className="form-actions">
        <button type="submit" className="btn-primary">
          {cue ? 'Update' : 'Create'} Focus Cue
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="btn-secondary">
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
