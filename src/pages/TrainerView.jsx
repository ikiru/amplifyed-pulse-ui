import React, { useEffect, useState } from "react";
// useSocket removed — using SocketContext instead
import { useSocketContext } from "../socket";
import EmotionTrendline from "../components/console/EmotionTrendline.jsx";

export default function TrainerView() {
  const { onEvent, offEvent, connectionStatus } = useSocketContext();
  const [pulseState, setPulseState] = useState(null);

  // ================================
  // pulse:update listener
  // ================================
  useEffect(() => {
    const handler = (payload) => {
      setPulseState(payload);
    };

    onEvent("pulse:update", handler);
    return () => offEvent("pulse:update", handler);
  }, [onEvent, offEvent]);

  return (
    <div>
      <h1>Trainer View</h1>
      <p>Socket: {connectionStatus}</p>

      <h2>Pulses:</h2>
      <pre style={{ background: "black", color: "lime", padding: 16 }}>
        {pulseState ? JSON.stringify(pulseState, null, 2) : "No data yet"}
      </pre>

      <EmotionTrendline pulseState={pulseState} />
    </div>
  );
}
