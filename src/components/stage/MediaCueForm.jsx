import React, { useState, useEffect } from 'react';

/**
 * MediaCueForm Component
 * 
 * Form for creating/editing Media Cues
 */
export default function MediaCueForm({ cue, onSave, onCancel }) {
  const [label, setLabel] = useState(cue?.label || '');
  const [url, setUrl] = useState(cue?.source?.url || '');
  const [audioMode, setAudioMode] = useState(
    cue?.playback?.audioMode || 'videoOnly'
  );
  const [startAtSec, setStartAtSec] = useState(
    cue?.playback?.startAtSec?.toString() || ''
  );
  const [endAtSec, setEndAtSec] = useState(
    cue?.playback?.endAtSec?.toString() || ''
  );
  const [sceneId, setSceneId] = useState(cue?.binding?.sceneId || '');
  const [inputName, setInputName] = useState(cue?.binding?.inputName || '');

  useEffect(() => {
    if (cue) {
      setLabel(cue.label || '');
      setUrl(cue.source?.url || '');
      setAudioMode(cue.playback?.audioMode || 'videoOnly');
      setStartAtSec(cue.playback?.startAtSec?.toString() || '');
      setEndAtSec(cue.playback?.endAtSec?.toString() || '');
      setSceneId(cue.binding?.sceneId || '');
      setInputName(cue.binding?.inputName || '');
    }
  }, [cue]);

  const handleSubmit = (e) => {
    e.preventDefault();

    const cueData = {
      label: label.trim() || 'Untitled Media',
      source: {
        type: 'youtube',
        url: url.trim(),
      },
      playback: {
        audioMode,
        startAtSec: startAtSec ? parseInt(startAtSec, 10) : undefined,
        endAtSec: endAtSec ? parseInt(endAtSec, 10) : undefined,
      },
      binding: sceneId || inputName
        ? {
            executor: 'default',
            sceneId: sceneId || undefined,
            inputName: inputName || undefined,
          }
        : undefined,
    };

    onSave(cueData);
  };

  return (
    <form className="media-cue-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="media-label">Label</label>
        <input
          id="media-label"
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Enter media label..."
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="media-url">YouTube URL</label>
        <input
          id="media-url"
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://youtube.com/watch?v=..."
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="media-audio-mode">Audio Mode</label>
        <select
          id="media-audio-mode"
          value={audioMode}
          onChange={(e) => setAudioMode(e.target.value)}
        >
          <option value="videoOnly">Video Only</option>
          <option value="videoAndAudio">Video and Audio</option>
        </select>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="media-start">Start At (seconds, optional)</label>
          <input
            id="media-start"
            type="number"
            value={startAtSec}
            onChange={(e) => setStartAtSec(e.target.value)}
            placeholder="0"
            min="0"
          />
        </div>

        <div className="form-group">
          <label htmlFor="media-end">End At (seconds, optional)</label>
          <input
            id="media-end"
            type="number"
            value={endAtSec}
            onChange={(e) => setEndAtSec(e.target.value)}
            placeholder="0"
            min="0"
          />
        </div>
      </div>

      <div className="form-section">
        <h3>Executor Binding (Optional)</h3>
        <p className="form-hint">Advanced: Bind to specific scenes/inputs in external executors (if used).</p>
        <div className="form-group">
          <label htmlFor="media-scene-id">Scene ID</label>
          <input
            id="media-scene-id"
            type="text"
            value={sceneId}
            onChange={(e) => setSceneId(e.target.value)}
            placeholder="Scene name"
          />
        </div>

        <div className="form-group">
          <label htmlFor="media-input-name">Input Name</label>
          <input
            id="media-input-name"
            type="text"
            value={inputName}
            onChange={(e) => setInputName(e.target.value)}
            placeholder="Source name"
          />
        </div>
      </div>

      <div className="form-actions">
        <button type="submit" className="btn-primary">
          {cue ? 'Update' : 'Create'} Media Cue
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
