// DebugTools.jsx — Phase 4 Socket-Aware Inspector
import React, { useState } from "react";
import useSocket from "../socket/useSocket";

export default function DebugTools() {
  const [log, setLog] = useState([]);

  const push = (label, payload) =>
    setLog((l) => [...l, { ts: Date.now(), label, payload }]);

  // Subscribe to ALL socket events defined in Patch 11
  useSocket({
    onTrainerMessage: (p) => push("trainer:message", p),
    onAudienceMessage: (p) => push("audience:message", p),
    onEngineMove: (p) => push("engine:move", p),
    onPulseUpdate: (p) => push("pulse:update", p),
    onFocusChange: (p) => push("focus:change", p),
  });

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Debug Tools</h1>
      <p>Live socket inspector — Phase 4 engine/socket reintegration mode.</p>

      <div
        style={{
          background: "#111",
          padding: "1rem",
          marginTop: "1rem",
          borderRadius: "0.5rem",
          color: "#0f0",
          fontFamily: "monospace",
          maxHeight: "60vh",
          overflowY: "auto",
        }}
      >
        {log.map((entry, idx) => (
          <pre key={idx} style={{ marginBottom: "1rem" }}>
            {JSON.stringify(entry, null, 2)}
          </pre>
        ))}
      </div>
    </div>
  );
}


