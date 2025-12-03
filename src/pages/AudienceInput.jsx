// src/pages/AudienceInput.jsx
import React, { useState } from "react";
import { useSocket } from "../socket/useSocket";

export default function AudienceInput() {
  const [message, setMessage] = useState("");
  const [sentMessages, setSentMessages] = useState([]);

  const socket = useSocket({
    "audience:message:ack": (payload) => {
      console.log("[Audience] ack:", payload);
    },
  });

  const handleSend = (evt) => {
    evt?.preventDefault();
    const trimmed = message.trim();
    if (!trimmed || !socket) return;

    const payload = {
      text: trimmed,
      timestamp: new Date().toISOString(),
      sender: "audience",
    };

    socket.emit("audience:message", payload);

    // ONLY store real text messages
    setSentMessages((prev) => [...prev, payload]);

    setMessage("");
  };

  const sendPulse = (emotion) => {
    if (!socket) return;

    const payload = {
      emotion,
      timestamp: new Date().toISOString(),
      sender: "audience",
    };

    // Emit the pulse normally
    socket.emit("audience:pulse", payload);

    // ❌ DO NOT append pulses to the message list
    // (This is the fix)
  };

  return (
    <div style={{ padding: "1rem" }}>
      <h1>Audience Input</h1>

      <div style={{ marginBottom: "1rem" }}>
        <PulseButton emotion="engaged" label="Engaged" onClick={sendPulse} />
        <PulseButton emotion="neutral" label="Neutral" onClick={sendPulse} />
        <PulseButton emotion="frustrated" label="Frustrated" onClick={sendPulse} />
      </div>

      <form onSubmit={handleSend} style={{ marginBottom: "1rem" }}>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Say something..."
          style={{ marginRight: "8px", minWidth: "220px" }}
        />
        <button type="submit">Send</button>
      </form>

      <h3>My Messages</h3>
      <ul>
        {sentMessages.map((m, idx) => (
          <li key={idx}>
            {m.text} — {m.timestamp}
          </li>
        ))}
      </ul>
    </div>
  );
}

function PulseButton({ emotion, label, onClick }) {
  return (
    <button
      type="button"
      onClick={() => onClick(emotion)}
      style={{
        marginRight: "0.5rem",
        padding: "0.5rem 1rem",
        borderRadius: "4px",
      }}
    >
      {label}
    </button>
  );
}
