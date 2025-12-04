// src/components/console/PulseTimeline.jsx
import React from "react";
import "./PulseTimeline.css";

export default function PulseTimeline({ pulses }) {
  // Provide a fallback array so the component never short-circuits
  const list = pulses ?? [];

  // DEBUG GUARD: stop component from exploding
  if (!Array.isArray(pulses)) {
    console.warn("PulseTimeline received non-array pulses:", pulses);
  }

  return (
    <div className="pulse-timeline">
      {list.length === 0 && (
        <div className="pulse-timeline-empty">No pulses yet</div>
      )}

      {list.map((p, idx) => {
        const value = typeof p.value === "number" ? p.value : 0;
        const emotion = p.emotion || "neutral";

        return (
          <div
            key={idx}
            className="pulse-block"
            style={{
              backgroundColor:
                emotion === "engaged"
                  ? "#4CAF50"
                  : emotion === "neutral"
                  ? "#CCCCCC"
                  : "#E57373",
              opacity: 0.4 + value * 0.6,
            }}
          />
        );
      })}
    </div>
  );
}
