import { useEffect, useState } from "react";
import { useSocket } from "../socket/SocketContext.jsx";
import { adaptMessage } from "./messageHelpers.js";
import { buildMessageTree } from "../utils/messageUtils.js";
import { ThreadItem } from "../components/messages/ThreadItem.jsx";
import { MessageInputBar } from "../components/messages/MessageInputBar.jsx";
import "./AudienceInput.css";

const pulseOptions = [
  { value: "frustrated", label: "Frustrated" },
  { value: "neutral", label: "Neutral" },
  { value: "engaged", label: "Engaged" },
];

export default function AudienceInput() {
  const { emit, onEvent, offEvent, socket } = useSocket();
  const [selectedPulse, setSelectedPulse] = useState("neutral");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [replyToId, setReplyToId] = useState(null);
  const [voteTotals, setVoteTotals] = useState({});
  const [replyDrafts, setReplyDrafts] = useState({});
  const [selectedVotes, setSelectedVotes] = useState({});

  useEffect(() => {
    const handleMessageStateUpdate = ({ messages }) => {
      if (!Array.isArray(messages)) return;

      const adapted = messages
        .map(adaptMessage)
        .filter(Boolean);

      setMessages(adapted);
    };

    onEvent("message.state.update", handleMessageStateUpdate);

    return () => {
      offEvent("message.state.update", handleMessageStateUpdate);
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

  // Incremental audience broadcasts are disabled;
  // rendering relies exclusively on `message.state.update`.
  const handlePulse = (pulse) => {
    console.log("[AUDIENCE_INPUT][FOCUS_CLICK]", {
      messageDraft: input,
      selectedFocus: pulse,
      timestamp: Date.now(),
    });
    setSelectedPulse(pulse);
    emit("audience:pulse", { pulse });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;

    const payload = {
      text: trimmed,
      focus: null,
      parentMessageId: null,
    };
    console.log("[AUDIENCE_INPUT][EMIT_MESSAGE]", {
      payload,
    });
    emit("message:audience", payload);

    setInput("");
  };

  const handleSubmitReply = (parentMessageId) => {
    const trimmed = (replyDrafts[parentMessageId] || "").trim();
    if (!trimmed) return;

    const payload = {
      text: trimmed,
      focus: null,
      parentMessageId,
    };
    console.log("[AUDIENCE_INPUT][EMIT_MESSAGE]", {
      payload,
    });
    emit("message:audience", payload);

    setReplyDrafts((prev) => {
      const next = { ...prev };
      delete next[parentMessageId];
      return next;
    });
    setReplyToId(null);
  };

  const emitVoteIntent = (messageId, voteType) => {
    if (!messageId || !voteType) return;

    setSelectedVotes((prev) => ({
      ...prev,
      [messageId]: voteType,
    }));

    emit("message:vote:intent", {
      messageId,
      voteType,
    });
  };

  const emitConfusionSignal = (rootMessageId) => {
    emit("confusion:signal", {
      rootMessageId,
      scoreDelta: 1,
      contributorDelta: 1,
      source: "self_report",
      participantId: socket?.id,
      ts: Date.now(),
    });
  };

  const emitOffFocusSignal = (messageId) => {
    if (!messageId) return;

    emit("self-report:signal", {
      type: "off_focus",
      messageId,
      sessionId: socket?.sessionId ?? "session:default",
      ts: Date.now(),
    });
  };

  const sessionIdLabel = socket?.sessionId ?? "session:default";
  const roots = buildMessageTree(messages);

  return (
    <div className="audience-input-page">
      <p className="session-label">Session: {sessionIdLabel}</p>
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
              emitVoteIntent={emitVoteIntent}
              onConfusionSignal={emitConfusionSignal}
              onOffFocusSignal={emitOffFocusSignal}
              showVoteTotals={false}
              voteSelectionMap={selectedVotes}
            />
          ))
        )}
      </div>

      {/* Message Input — Sticky Bottom */}
      <MessageInputBar
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onSubmit={handleSubmit}
        placeholder="Type a message..."
      />
    </div>
  );
}


//. mofifeied
