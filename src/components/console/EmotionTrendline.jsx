import React from "react";

// Legacy socket hook removed
export default function EmotionTrendline({ emotionState }) {
  if (!emotionState) return null;

  const { stateMap = {}, ts } = emotionState;
  const formatDate = ts ? new Date(ts).toLocaleTimeString() : "waiting";

  return (
    <div style={{ padding: 12, border: "1px solid #444", borderRadius: 4 }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span>Engaged</span>
        <strong>{stateMap.engaged ?? 0}</strong>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span>Neutral</span>
        <strong>{stateMap.neutral ?? 0}</strong>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span>Frustrated</span>
        <strong>{stateMap.frustrated ?? 0}</strong>
      </div>
      <small style={{ display: "block", marginTop: 8, color: "#888" }}>
        Last update: {formatDate}
      </small>
    </div>
  );
}
