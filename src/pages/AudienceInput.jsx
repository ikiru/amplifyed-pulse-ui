import React, { useState } from "react";
import { useSocket } from "../socket/useSocket";

export default function AudienceInput() {
  const socket = useSocket();
  const [text, setText] = useState("");

  const sendMessage = () => {
    if (!text.trim()) return;
    socket.emit("audience:message", {
      text,
      timestamp: Date.now(),
    });
    setText("");
  };

  const sendPulse = (emotion) => {
    socket.emit("audience:pulse", { emotion });
  };

  return (
    <div style={{ padding: "40px" }}>
      <h1>Audience Input</h1>

      <div>
        <button onClick={() => sendPulse("engaged")}>😊 Engaged</button>
        <button onClick={() => sendPulse("neutral")}>😐 Neutral</button>
        <button onClick={() => sendPulse("frustrated")}>😠 Frustrated</button>
      </div>

      <br />

      <div>
        <input
          placeholder="Say something…"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
}
