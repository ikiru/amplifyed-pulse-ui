// src/pages/AudienceInput.jsx
import React, { useEffect, useState } from "react";
import { useSocket } from "../socket/useSocket";
import ConnectionStatus from "../components/system/ConnectionStatus";
import "../components/system/ConnectionStatus.css";

// Future: ingestion hook for local echo or LiveRoom merge
// import usePulseIngestion from "../utils/usePulseIngestion";
// const { ingest } = usePulseIngestion();

export default function AudienceInput() {
  const [message, setMessage] = useState("");
  const [sentMessages, setSentMessages] = useState([]);
  const [lastEmotion, setLastEmotion] = useState(null);

  const { emit, socket, connectionStatus } = useSocket();

  useEffect(() => {
    if (!socket) return undefined;

    const handleMessageNew = (msg) => {
      console.log("[AUDIENCE] message:new", msg);
      setSentMessages((prev) => [...prev, msg]);
    };

    const handleFocusUpdate = (focus) => {
      console.log("[AUDIENCE] focus:update", focus);
    };

    socket.on("message:new", handleMessageNew);
    socket.on("focus:update", handleFocusUpdate);

    return () => {
      socket.off("message:new", handleMessageNew);
      socket.off("focus:update", handleFocusUpdate);
    };
  }, [socket]);

  const handleSend = (evt) => {
    evt?.preventDefault();
    const trimmed = message.trim();
    if (!trimmed || !emit) return;

    const payload = {
      message: trimmed,
      timestamp: Date.now(),
      author: "audience",
    };

    emit("audience:message", payload);

    setMessage("");
  };

  const emotionToValue = (emotion) => {
    switch (emotion) {
      case "engaged":
        return 1;
      case "neutral":
        return 0;
      case "frustrated":
        return -1;
      default:
        return 0;
    }
  };

  const sendDeltaPulse = (newEmotion) => {
    if (!emit) return;
    const oldValue = emotionToValue(lastEmotion);
    const newValue = emotionToValue(newEmotion);
    const delta = newValue - oldValue;

    if (delta === 0) {
      console.log("[AUDIENCE] No delta — ignoring duplicate pulse.");
      return;
    }

    console.log("[AUDIENCE] Sending delta pulse:", {
      newEmotion,
      oldValue,
      newValue,
      delta,
    });

    emit("audience:pulse", {
      emotion: newEmotion,
    }); // send only emotion

    setLastEmotion(newEmotion);
  };

  return (
    <div className="audience-input" style={{ padding: "1rem" }}>
      <ConnectionStatus status={connectionStatus} />
      <h1>Audience Input</h1>

      <div style={{ marginBottom: "1rem" }}>
        <PulseButton emotion="engaged" label="Engaged" onClick={sendDeltaPulse} />
        <PulseButton emotion="neutral" label="Neutral" onClick={sendDeltaPulse} />
        <PulseButton emotion="frustrated" label="Frustrated" onClick={sendDeltaPulse} />
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
