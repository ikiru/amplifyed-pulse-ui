import React from "react";

// PulseTimeline manages its own socket internally
import PulseTimeline from "./PulseTimeline";

// Pure canvas — no socket needed
import InsightLine from "./InsightLine";

function FutureSignalSlot({ label }) {
  return (
    <div
      style={{
        height: "80px",
        border: "1px dashed rgba(255,255,255,0.15)",
        borderRadius: "8px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "0.8rem",
        opacity: 0.6,
      }}
    >
      {label} (coming soon)
    </div>
  );
}

export default function SignalDeck() {
  return (
    <div
      style={{
        display: "grid",
        gap: "1rem",
        padding: "1rem",
        gridTemplateRows: "auto auto auto auto auto",
      }}
    >
      {/* 1) Timeline */}
      <PulseTimeline />

      {/* 2) Insight canvas */}
      <InsightLine />

      {/* 3) Future signals */}
      <FutureSignalSlot label="Dominance Signal" />
      <FutureSignalSlot label="Nudge Signal" />
      <FutureSignalSlot label="Confusion Signal" />
      <FutureSignalSlot label="Barrier Signal" />
    </div>
  );
}

