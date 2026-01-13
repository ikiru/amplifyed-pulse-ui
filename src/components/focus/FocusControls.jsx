import React from "react";

/**
 * FocusControls
 * 
 * Provides input and buttons for setting/clearing focus.
 * Displayed in the right column of TrainerView.
 * 
 * @param {object} props
 * @param {string} props.focusInput - Current focus input value
 * @param {function} props.setFocusInput - Setter for focus input
 * @param {function} props.handleSetFocus - Handler for setting focus
 * @param {function} props.handleClearFocus - Handler for clearing focus
 */
export function FocusControls({
  focusInput,
  setFocusInput,
  handleSetFocus,
  handleClearFocus,
}) {
  return (
    <section className="trainer-focus-controls">
      <h3 className="trainer-section-heading">Focus Controls</h3>
      <p className="trainer-text-muted trainer-focus-help">
        Current focus is visible above the messages panel.
      </p>

      <input
        type="text"
        placeholder=""
        value={focusInput}
        onChange={(event) => setFocusInput(event.target.value)}
        className="trainer-focus-input"
      />

      <div className="trainer-focus-actions">
        <button className="trainer-focus-button" onClick={handleSetFocus}>
          Set Focus
        </button>
        <button
          className="trainer-focus-button trainer-focus-button--secondary"
          onClick={handleClearFocus}
        >
          Clear Focus
        </button>
      </div>
    </section>
  );
}
