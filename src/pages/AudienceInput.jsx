import { useState } from "react";
import { useSocket } from "../socket/SocketContext.jsx";
import "./AudienceInput.css"; // optional, if you split styles later

export default function AudienceInput() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  // NOTE: UI placeholder — replace with real stream hookup later
  const { emit } = useSocket();

  const sendPulse = (pulse) => {
    emit("audience:pulse", { pulse });
  };

  // TEMP: append own messages locally for UX sanity
  const handleMessage = (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    emit("message:audience", {
      content: {
        type: "text",
        text: message.trim(),
      },
    });

    setMessages((prev) => [...prev, message.trim()]);
    setMessage("");
  };

  return (
    <div className="audience-input">
      {/* Pulse buttons */}
      <div className="pulse-row">
        <button onClick={() => sendPulse("frustrated")}>Frustrated</button>
        <button onClick={() => sendPulse("neutral")}>Neutral</button>
        <button onClick={() => sendPulse("engaged")}>Engaged</button>
      </div>

      {/* Message list */}
      <div className="message-list">
        {messages.length === 0 && (
          <div className="message-placeholder">No messages yet</div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className="message-item">
            {msg}
          </div>
        ))}
      </div>

      {/* Message input */}
      <form className="message-input" onSubmit={handleMessage}>
        <input
          type="text"
          placeholder="Type a message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}
