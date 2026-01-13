import React from "react";

/**
 * FocusDisplay
 * 
 * Displays the current focus text set by the trainer.
 * Shown in the center column above messages.
 * 
 * @param {object} props
 * @param {string|null} props.focus - Current focus text
 */
export function FocusDisplay({ focus }) {
  return (
    <section className="trainer-panel-card trainer-focus-panel">
      <h3 className="trainer-section-heading">Focus</h3>
      <p className="trainer-text-muted">{focus ?? "No focus set"}</p>
    </section>
  );
}
