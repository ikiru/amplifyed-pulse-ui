// src/components/trainer/MessageStream.jsx
import React, { useEffect, useRef } from "react";
import "./MessageStream.css";

export default function MessageStream({ messages = [] }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="message-stream-container">
      {messages.map((msg, idx) => {
        const text = msg.text ?? msg.message ?? msg.msg ?? msg.content ?? "";
        const author = msg.author ?? msg.sender ?? msg.from ?? "unknown";
        return (
          <div key={idx} className="message-bubble">
            <div className="message-author">{author}</div>
            <div className="message-text">{text}</div>
            <div className="message-timestamp">
              {new Date(msg.timestamp).toLocaleTimeString([], {
                hour: "numeric",
                minute: "2-digit",
              })}
            </div>
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}
