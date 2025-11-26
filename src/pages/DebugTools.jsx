// DebugTools.jsx — Phase 4 Socket-Aware Inspector
import React, { useState } from "react";
import useSocket from "../socket/useSocket";

export default function DebugTools() {
  const [log, setLog] = useState([]);

  const push = (label, payload) =>
    setLog((l) => [...l, { ts: Date.now(), label, payload }]);

  useSocket({
    "trainer:message": (p) => push("trainer:message", p),
    "audience:message": (p) => push("audience:message", p),
    "engine:move": (p) => push("engine:move", p),
    "pulse:update": (p) => push("pulse:update", p),
    "focus:change": (p) => push("focus:change", p),
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


