// src/pages/TrainerView.jsx
import React from "react";
import { useSocket } from "../socket/useSocket";
import { usePulseStream } from "../state/usePulseStream";   // normalized server pulse history

// Decay + Feed removed in Phase 2 — unified pulse engine handles state

export default function TrainerView() {
  const applyPulseUpdate = usePulseStream((state) => state.applyPulseUpdate);
  const recordEvent = usePulseStream((state) => state.recordEvent);
  const { votes, participants, eventLog } = usePulseStream();

  // No background tickers. No periodic feeds.
  // All pulse changes are driven by real-time socket events only.
  // 1. Live socket connection
  const { connectionStatus } = useSocket({
    "pulse:update": (payload) => {
      if (!payload) return;

      applyPulseUpdate(payload);
      recordEvent({
        type: "pulse:update",
        payload,
        timestamp: Date.now(),
      });
    },
    "audience:message": (payload) => {
      console.log("[Trainer] message:", payload);
      // Later: forward into message panel store
    },
  });

  const score = votes.engaged - votes.frustrated;

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
          {JSON.stringify({ score, votes, participants, eventLog }, null, 2)}
        </pre>
      </div>

      {/* PLACEHOLDERS FOR UPCOMING COMPONENTS */}
      <div className="region-left">Left Column</div>
      <div className="region-center">Center Column</div>
      <div className="region-right">Right Column</div>
    </div>
  );
}
