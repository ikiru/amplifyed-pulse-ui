import React from "react";
import { usePulseHistory } from "../../utils/usePulseHistory.js";

const COLORS = {
  engaged: "#4CAF50",
  neutral: "#B0BEC5",
  confused: "#FFB300",
  frustrated: "#E53935",
};

const LEVELS = {
  engaged: 0.75,
  neutral: 0.55,
  confused: 0.35,
  frustrated: 0.15,
};

export default function Trendline() {
  const history = usePulseHistory((state) => state.history);

  if (!history?.length) {
    return (
      <div style={{ marginTop: 20 }}>
        <i>No emotional history yet…</i>
      </div>
    );
  }

  const MAX_POINTS = 40;
  const visible = history.slice(-MAX_POINTS);

  const WIDTH = 600;
  const HEIGHT = 120;
  const maxIndex = Math.max(visible.length - 1, 1);

  const getPath = (emotion) => {
    const pts = visible.map((entry, index) => {
      const x = (index / maxIndex) * WIDTH;
      const base = (LEVELS[emotion] ?? 0) * HEIGHT;
      const mod = entry.emotion === emotion ? entry.value || 0 : 0;
      const y = HEIGHT - (base + mod * 30);
      return `${x},${y}`;
    });
    return pts.join(" ");
  };

  return (
    <div style={{ marginTop: 20 }}>
      <h3>Emotional Trendline</h3>
      <svg
        width={WIDTH}
        height={HEIGHT}
        style={{
          border: "1px solid #E0E0E0",
          background: "#FAFAFA",
          borderRadius: 6,
        }}
      >
        {Object.keys(COLORS).map((emotion) => (
          <polyline
            key={emotion}
            fill="none"
            stroke={COLORS[emotion]}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={getPath(emotion)}
            opacity="0.9"
          />
        ))}
      </svg>
    </div>
  );
}
