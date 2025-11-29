import React, { useEffect, useState } from "react";
import { useSocket } from "../socket/useSocket";

export default function TrainerView() {
  const socket = useSocket();

  const [pulses, setPulses] = useState([]);
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    if (!socket) return undefined;

    const cleanups = [
      socket.listen("pulse:update", (payload) => {
        setPulses((p) => [...p, payload]);
      }),
      socket.listen("message:update", (payload) => {
        setMessages((m) => [...m, payload]);
      }),
    ];

    return () => {
      cleanups.forEach((cleanup) => cleanup && cleanup());
    };
  }, [socket]);

  return (
    <div style={{ padding: "40px" }}>
      <h1>Trainer View</h1>

      <h2>Pulses</h2>
      {pulses.length === 0 && <p>(none yet)</p>}
      {pulses.map((p, i) => (
        <div key={i}>
          Emotion: {p.emotion} | Value: {p.value} | Time: {p.timestamp}
        </div>
      ))}

      <br />

      <h2>Messages</h2>
      {messages.length === 0 && <p>(none yet)</p>}
      {messages.map((msg, i) => (
        <div key={i}>
          {msg.text} — {msg.timestamp}
        </div>
      ))}
    </div>
  );
}
