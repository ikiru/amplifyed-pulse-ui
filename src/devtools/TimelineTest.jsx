// src/pages/TimelineTest.jsx
import React, { useState } from "react";
// Legacy timeline renderer disabled for Phase 4 stability
// import PulseTimeline from "../console/PulseTimeline";

export default function TimelineTest() {
  const [points, setPoints] = useState([
    { level: 0.2, color: "red", emotion: "test", timestamp: 1 },
    { level: 0.8, color: "blue", emotion: "test", timestamp: 2 },
  ]);

  return (
    <div style={{ padding: "2rem" }}>
      <h2>PULSE TIMELINE TEST</h2>
      {/* PulseTimeline temporarily disabled */}
      {/* <PulseTimeline data={points} /> */}
    </div>
  );
}
