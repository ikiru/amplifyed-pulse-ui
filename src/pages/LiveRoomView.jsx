// src/pages/LiveRoomView.jsx
import React, { useState } from "react";
import useSocket from "../socket/useSocket";
import MessageList from "../shared/MessageList";

export default function LiveRoomView() {
  const [messages, setMessages] = useState([]);
  const [pulse, setPulse] = useState(null);

  useSocket({
    onAudienceMessage: (payload) =>
      setMessages((m) => [...m, payload.message]),

    onPulseUpdate: (payload) =>
      setPulse(payload.values),
  });

  return (
    <main className="live-room page">
      <div className="scroll-area">
        <MessageList messages={messages} />
      </div>

      {/* Temporary pulse placeholder */}
      {pulse && (
        <div className="pad">
          <div style={{ color: "#0af" }}>Pulse updated...</div>
        </div>
      )}
    </main>
  );
}
