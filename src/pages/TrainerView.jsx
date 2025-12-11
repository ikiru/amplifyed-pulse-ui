import React, { useEffect, useState } from "react";
// useSocket removed — using SocketContext instead
import { useSocketContext } from "../socket";

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

      <h2>Pulses:</h2>
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

      {/* ======================================= */}
      {/* Pulse Tallies (Modern Pulse Pipeline)   */}
      {/* ======================================= */}
      <h2>Pulse Tallies:</h2>
      {(() => {
        if (!pulseState || !pulseState.votes) {
          return <p>No pulse data yet.</p>;
        }

        const votes = Object.values(pulseState.votes);
        const engaged = votes.filter(v => v === "engaged").length;
        const neutral = votes.filter(v => v === "neutral").length;
        const frustrated = votes.filter(v => v === "frustrated").length;

        return (
          <table
            style={{
              width: "250px",
              borderCollapse: "collapse",
              marginBottom: "20px",
            }}
          >
            <tbody>
              <tr>
                <td>Engaged</td>
                <td>{engaged}</td>
              </tr>
              <tr>
                <td>Neutral</td>
                <td>{neutral}</td>
              </tr>
              <tr>
                <td>Frustrated</td>
                <td>{frustrated}</td>
              </tr>
            </tbody>
          </table>
        );
      })()}

      {/* ======================================= */}
      {/* Trainer Pipeline Debug (Trainer-only)   */}
      {/* Now BELOW pulse summary                 */}
      {/* ======================================= */}
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
