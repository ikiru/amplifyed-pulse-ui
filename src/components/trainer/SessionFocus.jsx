// src/components/trainer/SessionFocus.jsx
import React from "react";
import "./SessionFocus.css";

export default function SessionFocus({ focus }) {
  const hasFocus = focus?.trim();

  if (!hasFocus) {
    return (
      <div className="session-focus-frame">
        <div className="session-focus-label">Session Focus</div>
        <div className="session-focus-empty">
          <i>No focus set</i>
        </div>
      </div>
    );
  }

  return (
    <div className="session-focus-frame">
      <div className="session-focus-label">Session Focus</div>
      <div className="session-focus-text">{hasFocus}</div>
    </div>
  );
}
