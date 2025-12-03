// src/pages/AudienceInput.jsx
import React, { useState } from "react";
import { useSocket } from "../socket/useSocket";
import EVENTS from "../socket/events";
import ConnectionStatus from "../components/system/ConnectionStatus";
import "../components/system/ConnectionStatus.css";
import guard from "../utils/guard";

// Future: ingestion hook for local echo or LiveRoom merge
// import usePulseIngestion from "../utils/usePulseIngestion";
// const { ingest } = usePulseIngestion();

export default function AudienceInput() {
  const [message, setMessage] = useState("");
  const [currentEmotion, setCurrentEmotion] = useState(null);
  const [sentMessages, setSentMessages] = useState([]);

  const { emit, connectionStatus } = useSocket({
    [EVENTS.AUDIENCE_MESSAGE_ACK]: (payload) =>
      guard(() => console.log("[Audience] ack:", payload), "AUDIENCE_MESSAGE_ACK"),
  });

  const handleSend = (evt) => {
    evt?.preventDefault();
    const trimmed = message.trim();
    if (!trimmed || !emit) return;

    const payload = {
      message: trimmed,
      timestamp: Date.now(),
      author: "audience",
    };

    emit(EVENTS.AUDIENCE_MESSAGE, payload);

    // ONLY store real text messages
    setSentMessages((prev) => [...prev, payload]);

    setMessage("");
  };

  const sendPulse = (emotion) => {
    if (!emit) return;
    if (emotion === currentEmotion) return;

    setCurrentEmotion(emotion);

    emit(EVENTS.AUDIENCE_PULSE, {
      emotion,
      timestamp: Date.now(),
      author: "audience",
    });

    // ❌ DO NOT append pulses to the message list
    // (This is the fix)
  };

  return (
    <div className="audience-input" style={{ padding: "1rem" }}>
      <ConnectionStatus status={connectionStatus} />
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
            {(m.message ?? m.text ?? "").trim()} — {m.timestamp}
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
