// src/pages/AudienceView.jsx
import React, { useState } from "react";
import useSocket from "../socket/useSocket";
import AudienceInput from "../audience/AudienceInput";
import MessageList from "../shared/MessageList";

export default function AudienceView() {
  const [messages, setMessages] = useState([]);

  const socket = useSocket({
    onAudienceMessage: (payload) =>
      setMessages((m) => [...m, payload.message]),
  });

  const sendMessage = (text) => {
    socket.sendAudienceMessage({ text, timestamp: Date.now() });
  };

  const sendSignal = (type, metadata) => {
    socket.sendAudienceSignal({ signalType: type, metadata });
  };

  return (
    <section className="audience-view page">
      <div className="scroll-area">
        <MessageList messages={messages} />
      </div>

      <AudienceInput
        onSend={sendMessage}
        onSignal={sendSignal}
      />
    </section>
  );
}
