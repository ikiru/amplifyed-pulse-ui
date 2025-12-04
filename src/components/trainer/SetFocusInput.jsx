import React, { useState } from "react";
import { useSocket } from "../../socket/useSocket";

export default function SetFocusInput() {
  const [text, setText] = useState("");

  const { emit } = useSocket({});

  const applyFocus = () => {
    emit("trainer:setFocus", { focus: text });
    setText("");
  };

  return (
    <div>
      <label>Set Focus</label>
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Enter session focus..."
      />
      <button onClick={applyFocus}>Apply</button>
    </div>
  );
}
