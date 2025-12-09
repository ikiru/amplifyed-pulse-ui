import React from "react";
// Legacy socket hook removed

export default function EmotionTrendline({ pulseState }) {
  if (!pulseState) return <div>No pulse data yet.</div>;

  const { votes = {}, lastVoteAt } = pulseState;
  const formatDate = lastVoteAt
    ? new Date(lastVoteAt).toLocaleTimeString()
    : "waiting";

  return (
    <div style={{ padding: 12, border: "1px solid #444", borderRadius: 4 }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span>Engaged</span>
        <strong>{votes.engaged ?? 0}</strong>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span>Neutral</span>
        <strong>{votes.neutral ?? 0}</strong>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span>Frustrated</span>
        <strong>{votes.frustrated ?? 0}</strong>
      </div>
      <small style={{ display: "block", marginTop: 8, color: "#888" }}>
        Last update: {formatDate}
      </small>
    </div>
  );
}
