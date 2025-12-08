// src/pages/TrainerView.jsx
import React from "react";
import { useSocket } from "../socket/useSocket";
import { usePulseStream } from "../state/usePulseStream";   // normalized server pulse history

// Decay + Feed removed in Phase 2 — unified pulse engine handles state

const scoreOf = (emotion) => {
  switch (emotion) {
    case "engaged":
      return 1;
    case "frustrated":
      return -1;
    default:
      return 0;
  }
};

export default function TrainerView() {
  const applyPulse = usePulseStream((state) => state.applyPulse);
  const recordEvent = usePulseStream((state) => state.recordEvent);
  const updateParticipant = usePulseStream((state) => state.updateParticipant);
  const pulseHistory = usePulseStream();

  // No background tickers. No periodic feeds.
  // All pulse changes are driven by real-time socket events only.
  // 1. Live socket connection
  const { connectionStatus } = useSocket({
    "audience:pulse": (payload) => {
      if (!payload) return;

      const { socketId, emotion } = payload;
      const timestamp = Date.now();
      const score = scoreOf(emotion);

      updateParticipant(socketId, emotion);
      applyPulse(socketId, emotion);
      recordEvent({
        type: "pulse",
        socketId,
        emotion,
        score,
        timestamp,
      });
    },
    "audience:message": (payload) => {
      console.log("[Trainer] message:", payload);
      // Later: forward into message panel store
    },
  });

  return (
    <div className="trainer-view">
      <h1>Trainer View</h1>

      {/* CONNECTION STATUS */}
      <div style={{ marginBottom: "8px", color: "#999" }}>
        Socket: {connectionStatus ?? "unknown"}
      </div>

      {/* PULSE STREAM DEBUG */}
      <div style={{ marginBottom: "12px" }}>
        <strong>Pulses:</strong>
        <pre style={{ fontSize: "0.8rem", background: "#111", color: "#0f0", padding: "8px" }}>
          {JSON.stringify(pulseHistory, null, 2)}
        </pre>
      </div>

      {/* PLACEHOLDERS FOR UPCOMING COMPONENTS */}
      <div className="region-left">Left Column</div>
      <div className="region-center">Center Column</div>
      <div className="region-right">Right Column</div>
    </div>
  );
}
