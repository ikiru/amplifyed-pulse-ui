// src/components/trainer/SetFocusInput.jsx
import React, { useState } from "react";
import useSocket from "../../socket/useSocket";
import useSessionFocus from "../../state/useSessionFocus";

export default function SetFocusInput() {
  const [value, setValue] = useState("");
  const { emit } = useSocket();
  const setFocus = useSessionFocus((s) => s.setFocus);

  const handleApply = (evt) => {
    evt?.preventDefault();
    const trimmed = value.trim();
    if (!trimmed || !emit) return;

    // This is the critical part: send `id`
    emit("trainer:setfocus", { id: trimmed });

    // Update local store so SessionFocus reflects it immediately
    setFocus(trimmed);

    setValue("");
  };

  return (
    <form onSubmit={handleApply} style={{ marginTop: "1rem" }}>
      <label style={{ display: "block", marginBottom: "0.25rem" }}>
        Set Focus
      </label>
      <div>
        <input
          type="text"
          placeholder="Enter session focus..."
          value={value}
          onChange={(e) => setValue(e.target.value)}
          style={{ marginRight: "0.5rem", minWidth: "200px" }}
        />
        <button type="submit">Apply</button>
      </div>
    </form>
  );
}
