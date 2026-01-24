import React, { useState, useEffect, useRef } from 'react';

/**
 * MediaCueForm Component
 * 
 * Form for creating/editing Media Cues
 * Supports: YouTube, PowerPoint, Google Slides
 */
export default function MediaCueForm({ cue, onSave, onCancel }) {
  const [label, setLabel] = useState(cue?.label || '');
  const [sourceType, setSourceType] = useState(cue?.source?.type || 'youtube');
  const [url, setUrl] = useState(cue?.source?.url || '');
  const [filePath, setFilePath] = useState(cue?.source?.filePath || '');
  const [audioMode, setAudioMode] = useState(
    cue?.playback?.audioMode || 'videoOnly'
  );
  const [startAtSec, setStartAtSec] = useState(
    cue?.playback?.startAtSec?.toString() || ''
  );
  const [endAtSec, setEndAtSec] = useState(
    cue?.playback?.endAtSec?.toString() || ''
  );
  
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (cue) {
      setLabel(cue.label || '');
      setSourceType(cue.source?.type || 'youtube');
      setUrl(cue.source?.url || '');
      setFilePath(cue.source?.filePath || '');
      setAudioMode(cue.playback?.audioMode || 'videoOnly');
      setStartAtSec(cue.playback?.startAtSec?.toString() || '');
      setEndAtSec(cue.playback?.endAtSec?.toString() || '');
    }
  }, [cue]);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Store the file path/name
      // Note: Browser security limits access to full path, so we store the filename
      // In production, you might want to upload the file to the server
      setFilePath(file.name);
    }
    e.target.value = '';
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const source = 
      sourceType === 'powerpoint' 
        ? { type: 'powerpoint', filePath: filePath.trim() }
        : sourceType === 'googleslides'
        ? { type: 'googleslides', url: url.trim() }
        : { type: 'youtube', url: url.trim() };

    const cueData = {
      label: label.trim() || 'Untitled Media',
      source,
      playback: sourceType === 'youtube' ? {
        audioMode,
        startAtSec: startAtSec ? parseInt(startAtSec, 10) : undefined,
        endAtSec: endAtSec ? parseInt(endAtSec, 10) : undefined,
      } : {
        audioMode: 'videoOnly', // Default for slides
      },
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
        <label htmlFor="media-source-type">Source Type</label>
        <select
          id="media-source-type"
          value={sourceType}
          onChange={(e) => setSourceType(e.target.value)}
        >
          <option value="youtube">YouTube</option>
          <option value="powerpoint">PowerPoint (.pptx)</option>
          <option value="googleslides">Google Slides</option>
        </select>
      </div>

      {sourceType === 'youtube' && (
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
      )}

      {sourceType === 'googleslides' && (
        <div className="form-group">
          <label htmlFor="media-url">Google Slides URL</label>
          <input
            id="media-url"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://docs.google.com/presentation/d/..."
            required
          />
        </div>
      )}

      {sourceType === 'powerpoint' && (
        <div className="form-group">
          <label htmlFor="media-file">PowerPoint File</label>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input
              id="media-file"
              type="text"
              value={filePath}
              onChange={(e) => setFilePath(e.target.value)}
              placeholder="Enter file path or click Browse..."
              required
              style={{ flex: 1 }}
            />
            <input
              ref={fileInputRef}
              type="file"
              accept=".pptx,.ppt"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="btn-secondary"
              style={{ padding: '8px 16px' }}
            >
              Browse...
            </button>
          </div>
          <p style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
            The Stage Engine will load and present this PowerPoint file in its most accurate format.
          </p>
        </div>
      )}

      {sourceType === 'youtube' && (
        <>
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
        </>
      )}

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
