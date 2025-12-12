import React, { useEffect, useState } from "react";
import { useSocketContext } from "../socket/SocketContext.jsx";

export default function TrainerView() {
  const { onEvent, offEvent, connectionStatus } = useSocketContext();
  const [pulseState, setPulseState] = useState(null);

  // ============================================
  // Trainer + Moment debug state (Phase 2.3.8A)
  // ============================================
  const [trainerSignal, setTrainerSignal] = useState(null);
  const [momentEnvelope, setMomentEnvelope] = useState(null);

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

  // ============================================
  // TrainerSignal listener
  // ============================================
  useEffect(() => {
    const handler = (payload) => {
      setTrainerSignal(payload);
    };
    onEvent("trainer:signal", handler);
    return () => offEvent("trainer:signal", handler);
  }, [onEvent, offEvent]);

  // ============================================
  // MomentEnvelope listener
  // ============================================
  useEffect(() => {
    const handler = (payload) => {
      setMomentEnvelope(payload);
    };
    onEvent("moment:update", handler);
    return () => offEvent("moment:update", handler);
  }, [onEvent, offEvent]);

  return (
    <div>
      <h1>Trainer View</h1>
      <p>Socket: {connectionStatus}</p>

      {/* ========================= */}
      {/*  Live Pulse Feed Section  */}
      {/* ========================= */}
      <h2>Live Pulse Feed</h2>
      <pre
        style={{
          background: "black",
          color: "lime",
          padding: 16,
          maxHeight: 200,
          overflowY: "auto",
        }}
      >
        {pulseState ? JSON.stringify(pulseState, null, 2) : "No data yet"}
      </pre>

      <h2>Pulse Vote Summary</h2>

      {/* Last update timestamp (from moment envelope) */}
      <p style={{ fontSize: "0.9rem", color: "#666", marginTop: "-8px" }}>
        Last pulse update:{" "}
        {momentEnvelope && momentEnvelope.timestamp
          ? (() => {
              const ts = new Date(momentEnvelope.timestamp);
              const time = ts.toLocaleTimeString([], {
                hour: "numeric",
                minute: "2-digit",
                second: "2-digit",
              });
              const date = ts.toLocaleDateString();
              return `${time} • ${date}`;
            })()
          : "waiting"}
      </p>
      {(() => {
        if (!pulseState || !pulseState.votes) {
          return <p>No pulse data yet.</p>;
        }

        const votes = Object.values(pulseState.votes);
        const engaged = votes.filter(v => v === "engaged").length;
        const neutral = votes.filter(v => v === "neutral").length;
        const frustrated = votes.filter(v => v === "frustrated").length;

        return (
          <pre
            style={{
              background: "#111",
              color: "white",
              padding: "10px",
              marginBottom: "20px",
              lineHeight: "1.4",
            }}
          >
            {`Engaged:     ${engaged}
Neutral:     ${neutral}
Frustrated:  ${frustrated}`}
          </pre>
        );
      })()}

      <hr style={{ margin: "30px 0" }} />
      <h2>Trainer Pipeline Debug:</h2>
      <pre
        style={{
          background: "black",
          color: "orange",
          padding: 16,
          maxHeight: 200,
          overflowY: "auto",
        }}
      >
        {trainerSignal
          ? JSON.stringify(trainerSignal, null, 2)
          : "No trainer signal yet"}
      </pre>

      <h2>Moment Envelope Debug:</h2>
      <pre
        style={{
          background: "black",
          color: "cyan",
          padding: 16,
          maxHeight: 200,
          overflowY: "auto",
        }}
      >
        {momentEnvelope
          ? JSON.stringify(momentEnvelope, null, 2)
          : "No moment envelope yet"}
      </pre>
    </div>
  );
}
