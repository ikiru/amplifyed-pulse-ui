import React, { useState } from "react";
// useSocket removed — using SocketContext instead
import { useSocketContext } from "../socket";

export default function AudienceInput() {
  const [message, setMessage] = useState("");
  const { emit } = useSocketContext();

  const sendPulse = (pulse) => {
    emit("audience:pulse", { pulse }); // Clean, pulse-only contract
  };

  const handleMessage = (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    emit("audience:message", {
      text: message.trim(),
      timestamp: Date.now(),
    });
    setMessage("");
  };

  return (
    <div>
      <h1>Audience Input</h1>
      <div>
        <button onClick={() => sendPulse("engaged")}>😀 Engaged</button>
        <button onClick={() => sendPulse("neutral")}>😐 Neutral</button>
        <button onClick={() => sendPulse("frustrated")}>😠 Frustrated</button>
      </div>

      <form onSubmit={handleMessage} style={{ marginTop: 16 }}>
        <input
          placeholder="Say something…"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}
