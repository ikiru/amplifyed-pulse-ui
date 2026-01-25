import React from 'react';

/**
 * EntryStatePanel Component
 * 
 * Configuration for session entry state (participant defaults)
 */
export default function EntryStatePanel({
  entryState,
  focusCues, // Legacy: kept for backward compatibility
  cues, // Unified stack: primary source
  isReadOnly,
  onUpdate,
}) {
  const handleDefaultFocusChange = (e) => {
    onUpdate({ defaultFocusCueId: e.target.value });
  };

  // Get focus cues from unified stack or legacy array
  const focusCuesList = cues 
    ? cues.filter(c => c.type === 'focus').map(c => ({
        id: c.id,
        text: c.data.text,
      }))
    : focusCues || [];

  return (
    <div className="entry-state-panel">
      <div className="panel-header">
        <h2>Session Entry State</h2>
        <p className="panel-description">
          Default focus cue for participants when they join
        </p>
      </div>

      <div className="entry-state-form">
        <div className="form-group">
          <label htmlFor="default-focus">Default Focus Cue</label>
          <select
            id="default-focus"
            value={entryState.defaultFocusCueId || ''}
            onChange={handleDefaultFocusChange}
            disabled={isReadOnly}
            required
          >
            {focusCuesList.map((cue) => (
              <option key={cue.id} value={cue.id}>
                {cue.text}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
