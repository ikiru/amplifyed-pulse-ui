import React from 'react';

/**
 * EntryStatePanel Component
 * 
 * Configuration for session entry state (participant defaults)
 */
export default function EntryStatePanel({
  entryState,
  focusCues,
  isReadOnly,
  onUpdate,
}) {
  const handleDefaultFocusChange = (e) => {
    onUpdate({ defaultFocusCueId: e.target.value });
  };

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
            {focusCues.map((cue) => (
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
