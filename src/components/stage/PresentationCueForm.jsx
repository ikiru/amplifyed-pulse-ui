import React, { useState, useEffect, useRef } from 'react';

/**
 * PresentationCueForm Component
 * 
 * Form for creating/editing Presentation Cues (PowerPoint, Google Slides)
 * Streamlined for StageView - capture happens in TrainerView
 */
export default function PresentationCueForm({ cue, onSave, onCancel }) {
  const [label, setLabel] = useState(cue?.label || '');
  const [sourceType, setSourceType] = useState(cue?.source?.type || 'googleslides');
  const [url, setUrl] = useState(cue?.source?.url || '');
  const [filePath, setFilePath] = useState(cue?.source?.filePath || '');
  
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (cue) {
      setLabel(cue.label || '');
      setSourceType(cue.source?.type || 'googleslides');
      setUrl(cue.source?.url || '');
      setFilePath(cue.source?.filePath || '');
    }
  }, [cue]);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setFilePath(file.name);
    }
    e.target.value = '';
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Build source object based on type
    let source;
    if (sourceType === 'googleslides') {
      if (!url.trim()) {
        alert('Please enter a Google Slides URL.');
        return;
      }
      source = { 
        type: 'googleslides',
        url: url.trim()
      };
    } else if (sourceType === 'powerpoint') {
      if (url.trim()) {
        source = { 
          type: 'powerpoint',
          url: url.trim()
        };
      } else if (filePath.trim()) {
        source = { 
          type: 'powerpoint',
          filePath: filePath.trim()
        };
      } else {
        alert('Please enter a PowerPoint URL (Office Online) or file path.');
        return;
      }
    }

    const cueData = {
      label: label.trim() || 'Untitled Presentation',
      source,
      playback: {
        audioMode: 'videoOnly', // Default for slides
      },
    };

    onSave(cueData);
  };

  return (
    <form className="media-cue-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="presentation-label">Label</label>
        <input
          id="presentation-label"
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Enter presentation label..."
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="presentation-source-type">Source Type</label>
        <select
          id="presentation-source-type"
          value={sourceType}
          onChange={(e) => setSourceType(e.target.value)}
        >
          <option value="googleslides">Google Slides (URL)</option>
          <option value="powerpoint">PowerPoint (URL or File)</option>
        </select>
      </div>

      {sourceType === 'googleslides' && (
        <div className="form-group">
          <label htmlFor="presentation-url">Google Slides URL</label>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input
              id="presentation-url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://docs.google.com/presentation/d/..."
              required
              style={{ flex: 1 }}
            />
            <button
              type="button"
              onClick={async () => {
                try {
                  const clipboardText = await navigator.clipboard.readText();
                  if (clipboardText.includes('docs.google.com/presentation')) {
                    setUrl(clipboardText);
                    return;
                  }
                } catch (err) {
                  // Clipboard read failed
                }
                
                const userUrl = prompt(
                  'Please paste the Google Slides URL:',
                  url || 'https://docs.google.com/presentation/d/...'
                );
                if (userUrl) {
                  setUrl(userUrl);
                }
              }}
              className="btn-secondary"
              style={{ padding: '8px 16px', whiteSpace: 'nowrap' }}
              title="Paste URL from clipboard"
            >
              Paste URL
            </button>
          </div>
          <p style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
            Enter the Google Slides URL. You'll capture the presentation in TrainerView when you're ready to go live.
          </p>
        </div>
      )}

      {sourceType === 'powerpoint' && (
        <>
          <div className="form-group">
            <label htmlFor="presentation-url">PowerPoint URL (Office Online)</label>
            <input
              id="presentation-url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://onedrive.live.com/... or https://office.com/..."
            />
          </div>
          <div className="form-group">
            <label htmlFor="presentation-file">PowerPoint File Path</label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                id="presentation-file"
                type="text"
                value={filePath}
                onChange={(e) => setFilePath(e.target.value)}
                placeholder="Enter file path or click Browse..."
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
          </div>
          <p style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
            Enter either a PowerPoint URL (Office Online) or a local file path. You'll capture the presentation in TrainerView when you're ready to go live.
          </p>
        </>
      )}

      <div className="form-actions">
        <button type="submit" className="btn-primary">
          {cue ? 'Update' : 'Create'} Presentation
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
