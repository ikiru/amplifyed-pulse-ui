import { useState } from "react";
import { useSocket } from "../socket/SocketContext.jsx";
import "./AudienceInput.css"; // optional, if you split styles later

const pulseOptions = [
  { value: "frustrated", label: "Frustrated" },
  { value: "neutral", label: "Neutral" },
  { value: "engaged", label: "Engaged" },
];

export default function AudienceInput() {
  const { emit } = useSocket();
  const [selectedPulse, setSelectedPulse] = useState("neutral");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [replyToIndex, setReplyToIndex] = useState(null);
  const [replyInput, setReplyInput] = useState("");

  const handlePulse = (pulse) => {
    setSelectedPulse(pulse);
    emit("audience:pulse", { pulse });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;

    emit("message:audience", {
      content: {
        type: "text",
        text: trimmed,
      },
    });

    setMessages((prev) => [...prev, { text: trimmed }]);
    setInput("");
  };

  return (
    <div className="audience-input-page">
      {/* Pulse Buttons — Sticky Top */}
      <div className="pulse-bar">
        {pulseOptions.map((pulse) => (
          <button
            key={pulse.value}
            onClick={() => handlePulse(pulse.value)}
            className={`pulse-button ${
              selectedPulse === pulse.value ? "active" : ""
            }`}
          >
            {pulse.label}
          </button>
        ))}
      </div>

      {/* Message Stream — Scrollable */}
      <div className="message-stream">
        {messages.length === 0 ? (
          <div className="message-empty">No messages yet</div>
        ) : (
          messages.map((msg, idx) => (
            <div key={idx} className="thread-item" data-depth="0">
              <div className="thread-message">
                <div className="thread-text">{msg.text}</div>

                <div className="thread-actions">
                  <button
                    type="button"
                    className="thread-reply-button"
                    onClick={() =>
                      setReplyToIndex(replyToIndex === idx ? null : idx)
                    }
                  >
                    Reply
                  </button>
                </div>
              </div>

              {replyToIndex === idx && (
                <div className="thread-replies">
                  <form
                    className="message-input-bar"
                    onSubmit={(e) => e.preventDefault()}
                  >
                    <input
                      type="text"
                      placeholder="Write a reply…"
                      value={replyInput}
                      onChange={(e) => setReplyInput(e.target.value)}
                    />
                    <button type="submit">Reply</button>
                  </form>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Message Input — Sticky Bottom */}
      <form className="message-input-bar" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Type a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}
