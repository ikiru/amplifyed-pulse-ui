import React, { useState } from "react";
import { useSocket } from "../socket/useSocket";

export default function AudienceInput() {
  const [text, setText] = useState("");

  // Your socket emitter
  const { emit } = useSocket({
    "audience:message:ack": (payload) => console.log("ack", payload)
  });

  const sendPulse = (emotion) => {
    console.log("[AudienceInput] Sending pulse:", emotion);
    emit("audience:pulse", { emotion });
  };

  const sendMessage = () => {
    if (!text.trim()) return;
    emit("audience:message", {
      text,
      timestamp: Date.now(),
    });
    setText("");
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
