// src/pages/TrainerView.jsx
import React, { useEffect, useState } from "react";
import useSocket from "../socket/useSocket";

export default function TrainerView() {
  // -----------------------------
  // STATE
  // -----------------------------
  const [levels, setLevels] = useState({
    engaged: 0,
    neutral: 0,
    frustrated: 0,
  });

  const [pulseHistory, setPulseHistory] = useState({
    engaged: 0,
    neutral: 0,
    frustrated: 0,
  });

  const [messages, setMessages] = useState([]);

  // -----------------------------
  // SOCKET SUBSCRIPTIONS
  // -----------------------------
  const socket = useSocket({
    // 🔥 Normalized emotional pulse event
    "pulse:update": (payload) => {
      if (!payload) return;

      const emotion = payload.emotion;
      const value = payload.value ?? 0;

      // Update current emotional levels
      setLevels((prev) => ({
        ...prev,
        [emotion]: value,
      }));

      // Update counts
      setPulseHistory((prev) => ({
        ...prev,
        [emotion]: prev[emotion] + 1,
      }));
    },

    // 🔥 Normalized message event
    "message:update": (payload) => {
      if (!payload?.text) return;

      setMessages((prev) => [
        ...prev,
        {
          text: payload.text,
          time: new Date().toISOString(),
        },
      ]);
    },
  });

  // -----------------------------
  // RENDER
  // -----------------------------
  return (
    <div style={{ padding: "20px" }}>
      <a href="/audience">TrainerAudience Input</a>

      <h1>Trainer View</h1>

      <h2>Emotional Levels</h2>
      <p>Engaged: {levels.engaged.toFixed(2)}</p>
      <p>Neutral: {levels.neutral.toFixed(2)}</p>
      <p>Frustrated: {levels.frustrated.toFixed(2)}</p>

      <h2>Pulse History</h2>
      <p>Engaged Count: {pulseHistory.engaged}</p>
      <p>Neutral Count: {pulseHistory.neutral}</p>
      <p>Frustrated Count: {pulseHistory.frustrated}</p>

      <h2>Messages</h2>
      <ul>
        {messages.map((m, i) => (
          <li key={i}>
            {m.text} — {m.time}
          </li>
        ))}
      </ul>
    </div>
  );
}
