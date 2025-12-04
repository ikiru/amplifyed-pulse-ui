// MessageStream.jsx
import React from "react";
import "./MessageStream.css";

export default function MessageStream({ messages = [] }) {
  if (!Array.isArray(messages) || messages.length === 0) {
    return (
      <div className="message-stream empty">
        <p>No messages yet</p>
      </div>
    );
  }

  return (
    <div className="message-stream">
      {messages.map((m) => (
        <div key={m.id} className="message-bubble">
          <div className="message-text">{m.message}</div>
          <div className="message-meta">
            <span>{new Date(m.timestamp).toLocaleTimeString()}</span>
            <span className="author-tag">{m.author}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
