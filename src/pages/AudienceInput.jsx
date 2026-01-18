import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { useSocket } from "../socket/SocketContext.jsx";
import { useSessionJoin } from "../hooks/useSessionJoin.js";
import { SessionEntry } from "../components/session/SessionEntry.jsx";
import { adaptMessage } from "./messageHelpers.js";
import { buildMessageTree } from "../utils/messageUtils.js";
import { MessageThreadRow } from "../components/threads/MessageThreadRow.jsx";
import { MessageInputBar } from "../components/messages/MessageInputBar.jsx";
import { assignThreadColors } from "../utils/threadUtils.js";
import { summarizeThreadConfusion } from "../utils/confusionUtils.js";
import { computeActivityPulseUpdates, summarizeThread } from "../utils/threadToolsUtils.js";
import "./AudienceInput.css";

const pulseOptions = [
  { value: "frustrated", label: "Frustrated" },
  { value: "neutral", label: "Neutral" },
  { value: "engaged", label: "Engaged" },
];

export default function AudienceInput() {
  const { emit, onEvent, offEvent, socket } = useSocket();
  const [searchParams] = useSearchParams();
  
  // Extract code from URL params (from QR code scan)
  const initialCode = searchParams.get('code');
  
  // Session join state
  const { isJoined, isJoining, error, joinSession, clearError } = useSessionJoin({
    emit,
    socket,
    onEvent,
    offEvent,
  });

  const [selectedPulse, setSelectedPulse] = useState("neutral");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [replyToId, setReplyToId] = useState(null);
  const [voteTotals, setVoteTotals] = useState({});
  const [replyDrafts, setReplyDrafts] = useState({});
  const [selectedVotes, setSelectedVotes] = useState({});
  const [activityNowMs, setActivityNowMs] = useState(() => Date.now());
  const [lastActivityAtByRootId, setLastActivityAtByRootId] = useState({});
  const prevLatestTsByRootIdRef = useRef({});

  useEffect(() => {
    const id = setInterval(() => setActivityNowMs(Date.now()), 250);
    return () => clearInterval(id);
  }, []);

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
  const handlePulse = useCallback((pulse) => {
    console.log("[AUDIENCE_INPUT][FOCUS_CLICK]", {
      messageDraft: input,
      selectedFocus: pulse,
      timestamp: Date.now(),
    });
    setSelectedPulse(pulse);
    emit("audience:pulse", { pulse });
  }, [input, emit]);

  const handleSubmit = useCallback((event) => {
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
  }, [input, emit]);

  const handleSubmitReply = useCallback((parentMessageId) => {
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
  }, [replyDrafts, emit]);

  const emitVoteIntent = useCallback((messageId, voteType) => {
    if (!messageId || !voteType) return;

    setSelectedVotes((prev) => ({
      ...prev,
      [messageId]: voteType,
    }));

    emit("message:vote:intent", {
      messageId,
      voteType,
    });
  }, [emit]);

  const emitConfusionSignal = useCallback((rootMessageId) => {
    emit("confusion:signal", {
      rootMessageId,
      scoreDelta: 1,
      contributorDelta: 1,
      source: "self_report",
      participantId: socket?.id,
      ts: Date.now(),
    });
  }, [emit, socket]);

  const emitConfusionClear = useCallback(
    (rootMessageId) => {
      if (!rootMessageId) return;
      emit("confusion:clear", {
        rootMessageId,
        ts: Date.now(),
      });
    },
    [emit]
  );

  const emitOffFocusSignal = useCallback((messageId) => {
    if (!messageId) return;

    emit("self-report:signal", {
      type: "off_focus",
      messageId,
      sessionId: socket?.sessionId ?? "session:default",
      ts: Date.now(),
    });
  }, [emit, socket]);

  const sessionIdLabel = socket?.sessionId ?? "session:default";
  const roots = useMemo(() => buildMessageTree(messages), [messages]);
  const rootColorAssignments = useMemo(() => assignThreadColors(roots), [roots]);
  const threadSummaries = useMemo(() => roots.map((root) => summarizeThread(root)), [roots]);
  const threadConfusions = useMemo(() => {
    return roots.map((root) => ({
      root,
      confusion: summarizeThreadConfusion(root, null),
      threadColor: rootColorAssignments.get(root.messageId),
    }));
  }, [roots, rootColorAssignments]);

  // Track ephemeral per-thread activity pulses (AudienceInput-local).
  useEffect(() => {
    const { nextPrevLatestTsByRootId, activityAtUpdates } =
      computeActivityPulseUpdates(
        prevLatestTsByRootIdRef.current,
        threadSummaries,
        Date.now()
      );
    prevLatestTsByRootIdRef.current = nextPrevLatestTsByRootId;
    if (Object.keys(activityAtUpdates).length > 0) {
      setLastActivityAtByRootId((prev) => ({ ...prev, ...activityAtUpdates }));
    }
  }, [threadSummaries]);

  // Show entry form if not joined
  if (!isJoined) {
    return (
      <SessionEntry
        onJoin={joinSession}
        isJoining={isJoining}
        error={error}
        onClearError={clearError}
        initialCode={initialCode}
      />
    );
  }

  // Show full interface when joined
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
          threadConfusions.map(({ root, confusion, threadColor }) => (
            <MessageThreadRow
              key={root.messageId}
              root={root}
              threadColor={threadColor}
              confusion={confusion}
              confusionByRootId={null}
              voteTotals={voteTotals[root.messageId]}
              voteTotalsMap={voteTotals}
              replyToId={replyToId}
              setReplyToId={setReplyToId}
              replyDrafts={replyDrafts}
              setReplyDrafts={setReplyDrafts}
              handleReplySubmit={handleSubmitReply}
              actorRole="audience"
              emitVoteIntent={emitVoteIntent}
              onConfusionSignal={emitConfusionSignal}
              onClearConfusionSignal={emitConfusionClear}
              onOffFocusSignal={emitOffFocusSignal}
              voteSelectionMap={selectedVotes}
              defaultCollapsed={true}
              activityPulse={
                typeof lastActivityAtByRootId[root.messageId] === "number" &&
                activityNowMs - lastActivityAtByRootId[root.messageId] <= 900
              }
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
