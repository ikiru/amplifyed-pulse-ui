// Emotional Trendline (ET-3.1)
// ------------------------------------------------------
// This component renders a minimal SVG line representing
// the smoothed emotional momentum of the room based on
// message-derived emotional scores.
//
// No axes, no labels, no layout changes — calm and trainer-friendly.
// ------------------------------------------------------

import React from "react";
import { useEmotionalEngine } from "../../state/useEmotionalEngine";

export default function EmotionalTrendline() {
  const history = useEmotionalEngine((state) => state.history);

  if (!history || history.length < 2) {
    return (
      <div style={{ fontSize: "0.8rem", opacity: 0.6 }}>
        Emotional data initializing…
      </div>
    );
  }

  // Fixed SVG dimensions
  const width = 600;
  const height = 120;

  // Convert emotional history into SVG polyline points
  const points = history.map((pt, i) => {
    const x = (i / (history.length - 1)) * width;
    const y = height - pt.v * height; // invert so higher emotion is visually higher
    return `${x},${y}`;
  });

  return (
    <svg
      width={width}
      height={height}
      style={{
        display: "block",
        marginTop: "8px",
        marginBottom: "8px"
      }}
    >
      <polyline
        points={points.join(" ")}
        fill="none"
        stroke="#888"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}
