import React, { useState } from "react";
import { useSocket } from "../../socket/useSocket";
import useMessageStream from "../../state/useMessageStream";

export default function TrainerComposer() {
  const [text, setText] = useState("");
  const { emit } = useSocket({});
  const addMessage = useMessageStream((s) => s.addMessage);

  const send = () => {
    if (!text.trim()) return;

    const msg = {
      id: Date.now(),
      message: text.trim(),
      author: "trainer",
      role: "trainer",
      timestamp: Date.now(),
    };

    // Send to server
    emit("trainer:message", msg);

    // Add locally
    addMessage(msg);

    setText("");
  };

  return (
    <div className="trainer-composer">
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type message…"
      />
      <button onClick={send}>Send</button>
    </div>
  );
}
