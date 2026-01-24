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

  const handleFocusVisibleChange = (e) => {
    onUpdate({ focusVisibleOnJoin: e.target.checked });
  };

  const handleChatOpenChange = (e) => {
    onUpdate({ chatOpenOnJoin: e.target.checked });
  };

  const handleWelcomeMessageChange = (e) => {
    onUpdate({ welcomeMessage: e.target.value || undefined });
  };

  return (
    <div className="entry-state-panel">
      <div className="panel-header">
        <h2>Session Entry State</h2>
        <p className="panel-description">
          Default settings for participants when they join
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

        <div className="form-group">
          <label>
            <input
              type="checkbox"
              checked={entryState.focusVisibleOnJoin !== false}
              onChange={handleFocusVisibleChange}
              disabled={isReadOnly}
            />
            Focus visible on join
          </label>
        </div>

        <div className="form-group">
          <label>
            <input
              type="checkbox"
              checked={entryState.chatOpenOnJoin !== false}
              onChange={handleChatOpenChange}
              disabled={isReadOnly}
            />
            Chat open on join
          </label>
        </div>

        <div className="form-group">
          <label htmlFor="welcome-message">Welcome Message (optional)</label>
          <textarea
            id="welcome-message"
            value={entryState.welcomeMessage || ''}
            onChange={handleWelcomeMessageChange}
            disabled={isReadOnly}
            placeholder="Optional message shown to participants on join..."
            rows={3}
          />
        </div>
      </div>
    </div>
  );
}
