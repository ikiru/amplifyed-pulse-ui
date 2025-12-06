import React from "react";
import "./PulseTimeline.css";

export default function PulseTimeline({ pulses }) {
  // Ensure always an array
  const list = Array.isArray(pulses) ? pulses : [];

  if (!Array.isArray(pulses)) {
    console.warn("PulseTimeline received non-array pulses:", pulses);
  }

  return (
    <div className="pulse-timeline">
      {list.length === 0 && (
        <div className="pulse-timeline-empty">No pulses yet</div>
      )}

      {list.map((p, idx) => {
        const value = typeof p.delta === "number" ? p.delta : 0;
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
              opacity: 0.4 + Math.abs(value) * 0.6,
            }}
          />
        );
      })}
    </div>
  );
}
