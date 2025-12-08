import React, { useEffect, useState } from "react";
import { useSocket } from "../socket/useSocket";

export default function TrainerView() {
  const { socket } = useSocket();

  const [pulses, setPulses] = useState([]);
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    if (!socket) return;

    socket.on("audience:pulse", (payload) => {
      console.log("[Trainer] pulse received", payload);
      setPulses((prev) => [...prev, payload]);
    });

    socket.on("audience:message", (payload) => {
      console.log("[Trainer] message received", payload);
      setMessages((prev) => [...prev, payload]);
    });

    return () => {
      socket.off("audience:pulse");
      socket.off("audience:message");
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
