// src/pages/ReflectionView.jsx
import React, { useState } from "react";
import useSocket from "../socket/useSocket";
import MessageList from "../shared/MessageList";

export default function ReflectionView() {
  const [messages, setMessages] = useState([]);

  useSocket({
    "trainer:message": (payload) =>
      setMessages((m) => [...m, payload.message]),

    "audience:message": (payload) =>
      setMessages((m) => [...m, payload.message]),
  });

  return (
    <section className="reflection-view page">
      <div className="scroll-area">
        <MessageList messages={messages} />
      </div>
    </section>
  );
}
