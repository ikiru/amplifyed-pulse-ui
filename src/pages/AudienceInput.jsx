import { useEffect, useState } from "react";
import { useSocket } from "../socket/SocketContext.jsx";
import "./AudienceInput.css"; // optional, if you split styles later

function buildMessageTree(messages) {
  const map = {};
  const roots = [];

  messages.forEach((msg) => {
    map[msg.messageId] = { ...msg, replies: [] };
  });

  messages.forEach((msg) => {
    if (msg.parentMessageId && map[msg.parentMessageId]) {
      map[msg.parentMessageId].replies.push(map[msg.messageId]);
    } else {
      roots.push(map[msg.messageId]);
    }
  });

  return roots;
}

const pulseOptions = [
  { value: "frustrated", label: "Frustrated" },
  { value: "neutral", label: "Neutral" },
  { value: "engaged", label: "Engaged" },
];

function ThreadItem({
  node,
  depth,
  replyToId,
  setReplyToId,
  replyDrafts,
  setReplyDrafts,
  handleSubmitReply,
  emitVote,
}) {
  const isReplyOpen = replyToId === node.messageId;
  const voteScore =
    typeof node.voteScore === "number" ? node.voteScore : 0;

  return (
    <div
      className="thread-item"
      data-depth={String(Math.min(depth, 3))}
    >
      <div className="thread-message">
        <div className="thread-vote-controls">
          <button
            type="button"
            aria-label="Upvote"
            onClick={() => emitVote?.(node.messageId, "up")}
          >
            ↑
          </button>
          <span className="thread-vote-score">{voteScore}</span>
          <button
            type="button"
            aria-label="Downvote"
            onClick={() => emitVote?.(node.messageId, "down")}
          >
            ↓
          </button>
        </div>
        <div className="thread-text">{node.text}</div>

        <div className="thread-actions">
          <button
            type="button"
            className="thread-reply-button"
            onClick={() =>
              setReplyToId(isReplyOpen ? null : node.messageId)
            }
          >
            Reply
          </button>
        </div>
      </div>

      {isReplyOpen && (
        <div className="thread-replies">
          <form
            className="message-input-bar"
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmitReply(node.messageId);
            }}
          >
            <input
              type="text"
              placeholder="Write a reply…"
              value={replyDrafts[node.messageId] || ""}
              onChange={(e) =>
                setReplyDrafts((prev) => ({
                  ...prev,
                  [node.messageId]: e.target.value,
                }))
              }
            />
            <button type="submit">Reply</button>
          </form>
        </div>
      )}

      {node.replies?.length > 0 && (
        <div className="thread-replies">
          {node.replies.map((child) => (
            <ThreadItem
              key={child.messageId}
              node={child}
              depth={depth + 1}
              replyToId={replyToId}
              setReplyToId={setReplyToId}
              replyDrafts={replyDrafts}
              setReplyDrafts={setReplyDrafts}
              handleSubmitReply={handleSubmitReply}
              emitVote={emitVote}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// AudienceView only — vote wiring (arrows)
export default function AudienceInput() {
  const { emit, onEvent, offEvent } = useSocket();
  const [selectedPulse, setSelectedPulse] = useState("neutral");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [replyToId, setReplyToId] = useState(null);
  const [replyDrafts, setReplyDrafts] = useState({});

  useEffect(() => {
    const handleVoteUpdate = ({ messageId, score }) => {
      setMessages((prev) =>
        prev.map((message) =>
          message.messageId === messageId
            ? { ...message, voteScore: score }
            : message
        )
      );
    };

    onEvent("message.vote.update", handleVoteUpdate);

    return () => {
      offEvent("message.vote.update", handleVoteUpdate);
    };
  }, [onEvent, offEvent]);

  const emitVote = (messageId, direction) => {
    if (!messageId) return;
    emit("interaction", {
      type: "message.vote",
      messageId,
      direction, // "up" | "down"
    });
  };

  const handlePulse = (pulse) => {
    setSelectedPulse(pulse);
    emit("audience:pulse", { pulse });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;

    const messageId = crypto.randomUUID();

    emit("message:audience", {
      content: { type: "text", text: trimmed },
      parentMessageId: null,
    });

    setMessages((prev) => [
      ...prev,
      {
        messageId,
        text: trimmed,
        parentMessageId: null,
        voteScore: 0,
      },
    ]);
    setInput("");
  };

  const handleSubmitReply = (parentMessageId) => {
    const trimmed = (replyDrafts[parentMessageId] || "").trim();
    if (!trimmed) return;

    const replyMessageId = crypto.randomUUID();

    emit("message:audience", {
      content: { type: "text", text: trimmed },
      parentMessageId,
    });

    setMessages((prev) => [
      ...prev,
      {
        messageId: replyMessageId,
        text: trimmed,
        parentMessageId,
        voteScore: 0,
      },
    ]);

    setReplyDrafts((prev) => {
      const next = { ...prev };
      delete next[parentMessageId];
      return next;
    });
    setReplyToId(null);
  };

  const roots = buildMessageTree(messages);

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
          roots.map((root) => (
            <ThreadItem
              key={root.messageId}
              node={root}
              depth={0}
              replyToId={replyToId}
              setReplyToId={setReplyToId}
              replyDrafts={replyDrafts}
              setReplyDrafts={setReplyDrafts}
              handleSubmitReply={handleSubmitReply}
              emitVote={emitVote}
            />
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


//. mofifeied