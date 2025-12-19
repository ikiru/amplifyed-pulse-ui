import { useEffect, useState } from "react";
import { useSocket } from "../socket/SocketContext.jsx";
import "./AudienceInput.css"; // optional, if you split styles later

const voteState = new Map(); // sessionId -> Map(messageId -> { voters })

function ensureStateEntry(sessionId, messageId) {
  if (!voteState.has(sessionId)) {
    voteState.set(sessionId, new Map());
  }

  const sessionMap = voteState.get(sessionId);

  if (!sessionMap.has(messageId)) {
    sessionMap.set(messageId, {
      voters: new Map(),
    });
  }

  return sessionMap.get(messageId);
}

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

function adaptMessage(message) {
  const envelope = message?.envelope;
  if (!envelope) return null;

  return {
    messageId: envelope.messageId,
    parentMessageId: envelope.parentMessageId,
    text: message.payload?.content?.text ?? "",
    envelope,
    payload: message.payload,
  };
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
  voteTotals,
  voteTotalsMap,
}) {
  const isReplyOpen = replyToId === node.messageId;
  return (
    <div
      className="thread-item"
      data-depth={String(Math.min(depth, 3))}
    >
      <div className="thread-message">
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
              voteTotals={voteTotalsMap?.[child.messageId]}
              voteTotalsMap={voteTotalsMap}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function AudienceInput() {
  const { emit, onEvent, offEvent } = useSocket();
  const [selectedPulse, setSelectedPulse] = useState("neutral");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [replyToId, setReplyToId] = useState(null);
  const [voteTotals, setVoteTotals] = useState({});
  const [replyDrafts, setReplyDrafts] = useState({});

  useEffect(() => {
    const handleMessageBroadcast = (message) => {
      setMessages((prev) => {
        const envelope = message?.envelope;
        if (!envelope?.messageId) return prev;

        const exists = prev.some((m) => m.messageId === envelope.messageId);
        if (exists) return prev;

        const adapted = adaptMessage(message);
        if (!adapted) return prev;

                return [...prev, adapted];
              });
            };

            onEvent("message:audience", handleMessageBroadcast);

            return () => {
              offEvent("message:audience", handleMessageBroadcast);
            };
          }, [onEvent, offEvent]);

  useEffect(() => {
    const handleVoteUpdate = ({ messageId, totals }) => {
      if (!messageId || !totals) return;

      setVoteTotals((prev) => ({
        ...prev,
        [messageId]: totals,
      }));
    };

    onEvent("message.vote.update", handleVoteUpdate);

    return () => {
      offEvent("message.vote.update", handleVoteUpdate);
    };
  }, [onEvent, offEvent]);

  const handlePulse = (pulse) => {
    setSelectedPulse(pulse);
    emit("audience:pulse", { pulse });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;

    emit("message:audience", {
      content: { type: "text", text: trimmed },
      parentMessageId: null,
    });

    setInput("");
  };

  const handleSubmitReply = (parentMessageId) => {
    const trimmed = (replyDrafts[parentMessageId] || "").trim();
    if (!trimmed) return;

    emit("message:audience", {
      content: { type: "text", text: trimmed },
      parentMessageId,
    });

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
              voteTotals={voteTotals[root.messageId]}
              voteTotalsMap={voteTotals}
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
