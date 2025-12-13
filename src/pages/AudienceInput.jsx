import React, { useState } from "react";
import { useSocketContext } from "../socket/SocketContext.jsx";

export default function AudienceInput() {
  const [message, setMessage] = useState("");
  const { emit } = useSocketContext();

  // Correct pulse sender
  const sendPulse = (pulse) => {
    console.log("[AUDIENCE] pulse:", pulse);
    emit("audience:pulse", { pulse });
  };

  // Message sender (no pulse here!)
  const handleMessage = (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    emit("message:audience", {
      content: {
        type: "text",
        text: message.trim(),
      },
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
