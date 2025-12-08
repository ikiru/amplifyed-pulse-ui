import React, { useEffect } from "react";
import { useSocket } from "../socket/useSocket";
import { usePulseStream } from "../state/usePulseStream";

export default function TrainerView() {
  const { socket, emit } = useSocket({
    connect: (socketId) => {
      console.log("[Trainer] participant joined:", socketId);
      usePulseStream.getState().addParticipant(socketId);
    },
    disconnect: (socketId) => {
      console.log("[Trainer] participant left:", socketId);
      usePulseStream.getState().removeParticipant(socketId);
    },
  });

  const score = usePulseStream((s) => s.score);
  const scoreHistory = usePulseStream((s) => s.scoreHistory);
  const eventLog = usePulseStream((s) => s.eventLog);
  const participants = usePulseStream((s) => s.participants);
  const messages = []; // message system will be implemented later

  useEffect(() => {
    if (!socket) return;

    socket.on("audience:pulse", (payload) => {
      const { socketId, emotion } = payload;
      console.log("[Trainer] pulse received:", payload);

      usePulseStream
        .getState()
        .castVote(socketId, emotion);
    });

    socket.on("audience:message", (payload) => {
      console.log("[Trainer] message received", payload);
    });

    return () => {
      socket.off("audience:pulse");
      socket.off("audience:message");
    };
  }, [socket]);

  return (
    <div style={{ padding: "40px", maxWidth: "800px" }}>
      <h1>Trainer View</h1>

      <h2>Live Score</h2>
      <div style={{ fontSize: "32px", fontWeight: "bold" }}>{score}</div>

      <h3>Participants</h3>
      <p>{participants.size} active</p>

      <h3>Score History</h3>
      {scoreHistory.length === 0 && <p>(no pulses yet)</p>}
      {scoreHistory.map((entry, i) => (
        <div key={i}>
          {new Date(entry.timestamp).toLocaleTimeString()} → {entry.score}
        </div>
      ))}

      <h3>Event Log</h3>
      {eventLog.length === 0 && <p>(no events yet)</p>}
      {eventLog.slice(-10).map((ev, i) => (
        <div key={i}>
          [{new Date(ev.timestamp).toLocaleTimeString()}] {ev.event} —{" "}
          {ev.socketId ?? "-"}
          {ev.event === "vote" ? ` (${ev.emotion})` : ""}
        </div>
      ))}

      <br />

      <h2>Messages</h2>
      <p>(message display will be integrated later)</p>
    </div>
  );
}
