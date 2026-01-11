import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSocket } from "../socket/SocketContext.jsx";
import AudienceDriftMeter, {
  createNeutralAudienceDriftProjection,
} from "../components/AudienceDriftMeter.jsx";
import { adaptMessage } from "./messageHelpers.js";
import {
  buildMessageTree,
  ThreadItem,
  ConfusionMeter,
} from "./messageThread.jsx";
import "./AudienceInput.css";
import "./TrainerView.css";

// §3.1 Color Is Idea-Bound; §3.3 Thread Color Assignment & Lifecycle — use a calibrated palette of
// clearly separated hues so each root thread retains a stable, idea-bound tone for the lineage visuals.
const THREAD_COLOR_PALETTE = [
  "#e63946", // red
  "#f4d35e", // yellow
  "#52b788", // green
  "#48bfe3", // cyan
  "#4361ee", // blue
  "#9d4edd", // magenta
];

const TRACE_ENABLED = false;

function assignThreadColors(roots = []) {
  const assignments = new Map();
  const paletteLength = THREAD_COLOR_PALETTE.length;
  if (paletteLength === 0) {
    return assignments;
  }

  let previousColor = null;
  let paletteIndex = 0;

  roots.forEach((root) => {
    if (!root || typeof root.messageId !== "string") {
      return;
    }
    let candidate = THREAD_COLOR_PALETTE[paletteIndex];
    // Avoid assigning the same hue as the immediately preceding root to keep adjacent threads visually separable.
    if (candidate === previousColor) {
      paletteIndex = (paletteIndex + 1) % paletteLength;
      candidate = THREAD_COLOR_PALETTE[paletteIndex];
    }
    assignments.set(root.messageId, candidate);
    previousColor = candidate;
    paletteIndex = (paletteIndex + 1) % paletteLength;
    // Palette reuse is tolerated after a different hue appears so we keep the set concise yet consistent.
  });

  return assignments;
}

function TrainerThreadRow({
  root,
  confusion,
  confusionByRootId,
  voteTotals,
  voteTotalsMap,
  trainerReplyToId,
  setTrainerReplyToId,
  trainerReplyDrafts,
  setTrainerReplyDrafts,
  handleTrainerReplySubmit,
  threadColor,
}) {
  const rowRef = useRef(null);
  const messageRefs = useRef(new Map());
  const [rowNode, setRowNode] = useState(null);
  const [connectorPaths, setConnectorPaths] = useState([]);
  const [overlaySize, setOverlaySize] = useState({ width: 0, height: 0 });
  const [messageRegistryVersion, setMessageRegistryVersion] = useState(0);

  const resolvedThreadColor =
    typeof threadColor === "string"
      ? threadColor
      : THREAD_COLOR_PALETTE[0];
  const themeStyle = { "--thread-color": resolvedThreadColor };

  const updatePath = useCallback(() => {
    const row = rowRef.current;
    if (!row) {
      setOverlaySize({ width: 0, height: 0 });
      setConnectorPaths([]);
      return;
    }
    const rowRect = row.getBoundingClientRect();
    setOverlaySize({ width: rowRect.width, height: rowRect.height });

    const newPaths = [];
    messageRefs.current.forEach(({ node, parentId }, messageId) => {
      if (!node || !parentId) {
        return;
      }
      const parentEntry = messageRefs.current.get(parentId);
      if (!parentEntry?.node) {
        return;
      }
      const parentRect = parentEntry.node.getBoundingClientRect();
      const parentX = parentRect.left - rowRect.left;
      const parentY = parentRect.bottom - rowRect.top;
      const replyRect = node.getBoundingClientRect();
      const childX = replyRect.left - rowRect.left;
      const childY =
        replyRect.top + replyRect.height / 2 - rowRect.top;
      newPaths.push({
        key: messageId,
        d: `M ${parentX} ${parentY} L ${parentX} ${childY} L ${childX} ${childY}`,
      });
    });

    setConnectorPaths(newPaths);
  }, []);

  const attachRowRef = useCallback((node) => {
    rowRef.current = node;
    setRowNode(node);
  }, []);

  const registerMessageRef = useCallback(
    (messageId, parentMessageId, node) => {
      if (node) {
        messageRefs.current.set(messageId, { node, parentId: parentMessageId });
      } else {
        messageRefs.current.delete(messageId);
      }
      setMessageRegistryVersion((prev) => prev + 1);
      updatePath();
    },
    [updatePath]
  );

  useLayoutEffect(() => {
    updatePath();
    if (!rowNode) {
      return undefined;
    }
    const handleResize = () => updatePath();
    window.addEventListener("resize", handleResize);
    let observer;
    if (typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(handleResize);
      const nodesToObserve = new Set([rowNode]);
      messageRefs.current.forEach(({ node }) => {
        if (node) nodesToObserve.add(node);
      });
      nodesToObserve.forEach((node) => {
        if (node) observer.observe(node);
      });
    }
    return () => {
      window.removeEventListener("resize", handleResize);
      if (observer) {
        observer.disconnect();
      }
    };
  }, [rowNode, messageRegistryVersion, updatePath]);

  const overlayVisible =
    connectorPaths.length > 0 &&
    overlaySize.width > 0 &&
    overlaySize.height > 0;

  return (
    <div
      className="trainer-message-stream-row"
      ref={attachRowRef}
      style={themeStyle}
    >
      <div className="thread-connector-layer" aria-hidden="true">
        {overlayVisible && (
          <svg
            width={overlaySize.width}
            height={overlaySize.height}
            viewBox={`0 0 ${overlaySize.width} ${overlaySize.height}`}
            preserveAspectRatio="none"
          >
            {connectorPaths.map(({ key, d }) => (
              <path
                key={`connector-${key}`}
                d={d}
                fill="none"
                stroke="var(--thread-color, #e63946)"
                strokeWidth="2"
                strokeLinecap="round"
              />
            ))}
          </svg>
        )}
      </div>
      <div className="trainer-message-lineage-gutter">
        <div
          className="trainer-message-lineage-bar"
          aria-hidden="true"
          role="presentation"
        />
      </div>
      <div
        id={`thread-root-${root.messageId}`}
        className="trainer-thread-wrapper"
      >
        <ThreadItem
          node={root}
          depth={0}
          replyToId={trainerReplyToId}
          setReplyToId={setTrainerReplyToId}
          replyDrafts={trainerReplyDrafts}
          setReplyDrafts={setTrainerReplyDrafts}
          handleSubmitReply={handleTrainerReplySubmit}
          voteTotals={voteTotals}
          voteTotalsMap={voteTotalsMap}
          confusionByRootId={confusionByRootId}
          actorRole="trainer"
          showVoteControls={true}
          showVoteReadOnly={true}
          allowConfusionAnchors={false}
          allowConfusionRow={true}
          showConfusionRow={confusion.showConfusionRow}
          confusionScore={confusion.confusionScore}
          resolutionType={confusion.resolutionType}
          registerMessageRef={registerMessageRef}
        />
      </div>
    </div>
  );
}

const assert = (condition, message) => {
  if (!condition) {
    throw new Error(message);
  }
};

const OFF_TOPIC_PATTERN = /off[-_\s]?topic/i;


function matchesOffTopicValue(value) {
  if (value === true) {
    return true;
  }
  if (typeof value === "string") {
    return OFF_TOPIC_PATTERN.test(value);
  }
  if (Array.isArray(value)) {
    return value.some(matchesOffTopicValue);
  }
  if (value && typeof value === "object") {
    return Object.values(value).some(matchesOffTopicValue);
  }
  return false;
}

function hasOffTopicMarker(source) {
  if (!source || typeof source !== "object") {
    return false;
  }
  return (
    matchesOffTopicValue(source.offTopic ?? source.isOffTopic) ||
    matchesOffTopicValue(source.topicStatus ?? source.classification) ||
    matchesOffTopicValue(source.labels ?? source.tags ?? source.flags)
  );
}

function isThreadOffTopic(root, confusionSignal) {
  if (hasOffTopicMarker(confusionSignal)) {
    return true;
  }
  if (hasOffTopicMarker(root?.payload?.meta)) {
    return true;
  }
  if (hasOffTopicMarker(root?.payload?.content?.meta)) {
    return true;
  }
  if (hasOffTopicMarker(root?.payload)) {
    return true;
  }
  if (hasOffTopicMarker(root?.payload?.content)) {
    return true;
  }
  return false;
}

const AUDIENCE_LABEL_DISPLAY = {
  off_focus: "Off Focus",
  on_topic: "On Topic",
};

function getAudienceLabelDisplay(label) {
  if (!label) return null;
  return AUDIENCE_LABEL_DISPLAY[label] ?? label;
}

function summarizeThreadConfusion(root, confusionByRootId) {
  const confusionSignal = confusionByRootId?.[root.messageId];
  const contributorValue = confusionSignal?.contributors;
  const contributorCountFromSignal = Array.isArray(contributorValue)
    ? contributorValue.length
    : typeof contributorValue === "number"
      ? contributorValue
      : contributorValue && typeof contributorValue === "object"
        ? Object.keys(contributorValue).length
        : undefined;
  const contributorCount = Math.max(
    0,
    contributorCountFromSignal ??
      (typeof confusionSignal?.confusionScore === "number"
        ? confusionSignal.confusionScore
        : 0)
  );
  const confusionScore =
    typeof confusionSignal?.confusionScore === "number"
      ? confusionSignal.confusionScore
      : contributorCount;
  const resolutionType = confusionSignal?.resolutionType;
  const isRoot = !root.parentMessageId;
  const hasConfusionSignal = contributorCount > 0;
  const threadIsOffTopic = isThreadOffTopic(root, confusionSignal);
  const showConfusionRow = isRoot && hasConfusionSignal && !threadIsOffTopic;

  return {
    confusionSignal,
    contributorCount,
    confusionScore,
    resolutionType,
    showConfusionRow,
    threadIsOffTopic,
    isRoot,
  };
}

function scrollToThreadRoot(rootMessageId) {
  if (!rootMessageId) return;
  if (typeof document === "undefined") return;
  const target = document.getElementById(`thread-root-${rootMessageId}`);
  if (target && typeof target.scrollIntoView === "function") {
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

export default function TrainerView() {
  const { socket, emit, onEvent, offEvent, connectionStatus } = useSocket();
  const [focus, setFocus] = useState(null);
  const [focusInput, setFocusInput] = useState("");
  const [livePulse, setLivePulse] = useState(null);
  const [messages, setMessages] = useState([]);
  const audienceLabelsRef = useRef({});
  const [voteTotals, setVoteTotals] = useState({});
  const [confusionAdvisory, setConfusionAdvisory] = useState(null);
  const [showInsights, setShowInsights] = useState(false);
  const [hiddenInsights, setHiddenInsights] = useState(null);
  const [visibleInsights, setVisibleInsights] = useState(null);
  const [driftProjection, setDriftProjection] = useState(() =>
    createNeutralAudienceDriftProjection()
  );
  const [trainerInput, setTrainerInput] = useState("");
  const [trainerReplyToId, setTrainerReplyToId] = useState(null);
  const [trainerReplyDrafts, setTrainerReplyDrafts] = useState({});
  const confusionByRootId = useMemo(() => {
    const threads = confusionAdvisory?.threads;
    if (!Array.isArray(threads) || threads.length === 0) {
      return null;
    }

    const map = {};
    threads.forEach((thread) => {
      const rootMessageId =
        thread && typeof thread.rootMessageId === "string"
          ? thread.rootMessageId
          : null;
      if (!rootMessageId) {
        return;
      }

      map[rootMessageId] = thread;
    });

    return map;
  }, [confusionAdvisory]);

  // PulseTimeline now relies directly on the `pulse:update` payload so the visual stays tied to the canonical stream without cached selectors.
  // Source: canonical `livePulse` updates from the server (pulse:update) drive this value via `canonicalParticipantCount`, counting only `actorRole === "audience"` sockets.
  // We consider `livePulse` the authoritative stream for participant information, so PulseSummary reads this same slot.
  const canonicalParticipantCount =
    livePulse?.participants && typeof livePulse.participants === "object"
      ? Object.values(livePulse.participants).reduce(
        (count, participant) =>
          participant?.actorRole === "audience" ? count + 1 : count,
        0
      )
      : undefined;

  useEffect(() => {
    if (!socket) {
      console.warn("[WIRE_TEST][CLIENT] socket is NULL at mount");
      return;
    }

    console.log("[WIRE_TEST][CLIENT] socket connected", {
      id: socket.id,
      connected: socket.connected,
    });

    return () => {
      console.log("[WIRE_TEST][CLIENT] socket unmounted", {
        id: socket.id,
      });
    };
  }, [socket]);

  useEffect(() => {
    if (!socket) return;

    const wireTestHandler = (payload) => {
      console.log("[WIRE_TEST][CLIENT_RECEIVE][AUDIENCE_DRIFT]", payload);
    };

    console.log("[WIRE_TEST][CLIENT] registering audience:drift:update listener");

    socket.on("audience:drift:update", wireTestHandler);

    return () => {
      console.log("[WIRE_TEST][CLIENT] removing audience:drift:update listener");
      socket.off("audience:drift:update", wireTestHandler);
    };
  }, [socket]);

  useEffect(() => {
    if (!socket || typeof socket.onAny !== "function") return;

    const anyHandler = (event, payload) => {
      if (event.includes("drift")) {
        console.log("[WIRE_TEST][CLIENT_ANY_EVENT]", event, payload);
      }
    };

    socket.onAny(anyHandler);

    return () => {
      socket.offAny(anyHandler);
    };
  }, [socket]);

  useEffect(() => {
    if (livePulse && canonicalParticipantCount === undefined) {
      console.warn(
        "[TrainerView] pulse:update payload missing participants info required for PulseTimeline scale."
      );
    }
  }, [livePulse, canonicalParticipantCount]);

  useEffect(() => {
    if (process.env.NODE_ENV === "production") {
      return;
    }

    const timelineCount =
      typeof canonicalParticipantCount === "number"
        ? canonicalParticipantCount
        : 0;

    // `canonicalParticipantCount` can legitimately be undefined while the socket stream is still establishing,
    // so only run the dev-side assert when we have a canonical value to compare.
    if (canonicalParticipantCount !== undefined) {
      console.assert(
        canonicalParticipantCount === timelineCount,
        "[TrainerView DEV TRACE] PulseSummary canonicalParticipantCount diverges from PulseTimeline",
        {
          summary: {
            value: canonicalParticipantCount,
            source:
              "livePulse pulse:update (explicit count or derived from participants map)",
          },
          timeline: {
            value: timelineCount,
            source:
              "PulseTimeline participantsCount prop (defaults to 0 when canonical value missing)",
          },
        }
      );
    }
  }, [canonicalParticipantCount]);

  // -------------------------------
  // Socket listeners
  // -------------------------------
  useEffect(() => {
    // src/pages/TrainerView.jsx — `livePulse` is the canonical state key updated by the server’s `pulse:update` event whenever audience votes change.
    const handlePulse = (payload) => {
      if (!payload) {
        setLivePulse(null);
        return;
      }

      const { participants } = payload;
      const explicitParticipantsCount = payload.participantsCount;
      const derivedParticipantsCount = participants
        ? Object.values(participants).reduce(
            (count, participant) =>
              participant?.actorRole === "audience" ? count + 1 : count,
            0
          )
        : undefined;
      const canonicalParticipantCount = derivedParticipantsCount;

      if (TRACE_ENABLED) {
        console.groupCollapsed("[TRACE] pulse:update received");
        console.log("raw participants:", participants);
        console.log("explicit participantsCount:", explicitParticipantsCount);
        console.log("derived count:", derivedParticipantsCount);
        console.log("canonicalParticipantCount:", canonicalParticipantCount);
        console.groupEnd();
      }

      if (TRACE_ENABLED) {
        console.log(
          "[TRACE] canonicalParticipantCount →",
          canonicalParticipantCount
        );
      }

      const nextPulse = {
        ...payload,
        participants:
          payload.participants && typeof payload.participants === "object"
            ? { ...payload.participants }
            : payload.participants,
        eventLog: Array.isArray(payload.eventLog)
          ? payload.eventLog.map((entry) => (entry ? { ...entry } : entry))
          : payload.eventLog,
      };

      setLivePulse(nextPulse);

      if (process.env.NODE_ENV !== "production") {
        const explicitCount = nextPulse?.participantsCount;
        const derivedCount = nextPulse?.participants
          ? Object.keys(nextPulse.participants).length
          : undefined;

        const canonicalParticipantCount =
          explicitCount ?? derivedCount ?? undefined;

        if (TRACE_ENABLED) {
          console.groupCollapsed("[TRACE] pulse:update payload");
          console.log("livePulse:", nextPulse);
          console.log("participants:", nextPulse?.participants);
          console.log("participantsCount (explicit):", explicitCount);
          console.log("participantsCount (derived):", derivedCount);
          console.log("canonicalParticipantCount:", canonicalParticipantCount);
          console.groupEnd();
        }
      }
    };

    onEvent("pulse:update", handlePulse);
    return () => offEvent("pulse:update", handlePulse);
  }, [onEvent, offEvent]);

  useEffect(() => {
    const handleDriftUpdate = (payload) => {
      console.log(
        "[WIRE_TEST][CLIENT_RECEIVE][AUDIENCE_DRIFT]",
        payload
      );
      if (typeof payload?.score === "number") {
        console.log("[WIRE_TEST][SET_DRIFT_PROJECTION]", {
          incomingScore: payload.score,
          previous: driftProjection,
          next: payload.score,
        });
        setDriftProjection({ score: payload.score });
        console.log("[WIRE_TEST][METER_STATE_APPLIED]", payload.score);
      }
    };

    onEvent("audience:drift:update", handleDriftUpdate);
    return () => offEvent("audience.drift.update", handleDriftUpdate);
  }, [onEvent, offEvent]);

  useEffect(() => {
    const handleLabelUpdate = (payload) => {
      if (!payload || !payload.messageId) {
        return;
      }

      const nextLabels = {
        ...audienceLabelsRef.current,
        [payload.messageId]: {
          label: payload.label,
          labelDisplay: getAudienceLabelDisplay(payload.label),
          source: payload.source,
          timestamp: payload.timestamp,
        },
      };
      audienceLabelsRef.current = nextLabels;

      setMessages((prev) =>
        prev.map((message) =>
          message.messageId === payload.messageId
            ? {
                ...message,
                label: payload.label,
                labelDisplay: getAudienceLabelDisplay(payload.label),
                labelSource: payload.source,
              }
            : message
        )
      );
    };

    onEvent("audience:label:update", handleLabelUpdate);
    return () => offEvent("audience:label:update", handleLabelUpdate);
  }, [onEvent, offEvent]);

  useEffect(() => {
    const handleMessageStateUpdate = ({ messages: canonicalMessages }) => {
      if (!Array.isArray(canonicalMessages)) return;

      const adapted = canonicalMessages
        .map(adaptMessage)
        .filter(Boolean);

      const enriched = adapted.map((message) => {
        const labelInfo = audienceLabelsRef.current[message.messageId];
        if (!labelInfo) {
          return message;
        }
        return {
          ...message,
          label: labelInfo.label,
          labelDisplay:
            labelInfo.labelDisplay ?? getAudienceLabelDisplay(labelInfo.label),
          labelSource: labelInfo.source,
        };
      });

      setMessages(enriched);
    };

    const handleMomentUpdate = (payload) => {
      if (!payload) {
        setHiddenInsights(null);
        return;
      }

      if (Array.isArray(payload.insights)) {
        setHiddenInsights(payload.insights);
      } else {
        setHiddenInsights(null);
      }
    };

    // --------------------------------------------------
    // CONFUSION ADVISORY (Tier-1, Listener Only)
    // No UI, no interpretation, no mutation of messages
    // --------------------------------------------------
    const handleConfusionUpdate = (payload) => {
      if (!payload) {
        setConfusionAdvisory(null);
        return;
      }

      setConfusionAdvisory(payload);
    };

    onEvent("message.state.update", handleMessageStateUpdate);
    onEvent("moment:update", handleMomentUpdate);
    onEvent("confusion:update", handleConfusionUpdate);

    return () => {
      offEvent("message.state.update", handleMessageStateUpdate);
      offEvent("moment:update", handleMomentUpdate);
      offEvent("confusion:update", handleConfusionUpdate);
    };
  }, [onEvent, offEvent]);

  useEffect(() => {
    const handleVoteUpdate = ({ messageId, totals }) => {
      if (!messageId || !totals) {
        return;
      }

      setVoteTotals((prev) => ({
        ...prev,
        [messageId]: totals,
      }));
    };

    onEvent("message.vote.update", handleVoteUpdate);
    return () => offEvent("message.vote.update", handleVoteUpdate);
  }, [onEvent, offEvent]);

  // -------------------------------
  // Focus sync
  // -------------------------------
  useEffect(() => {
    // Phase 8.6.1 — normalize focus payloads at boundary
    const handleFocusUpdate = (payload) => {
      console.log("[FOCUS] raw payload received:", payload);

      if (!payload) {
        console.log("[FOCUS] payload empty → clearing focus");
        setFocus(null);
        return;
      }

      // Most common / expected
      if (typeof payload === "string") {
        console.log("[FOCUS] normalized string:", payload);
        setFocus(payload);
        return;
      }

      // focus:update payload shape
      if (typeof payload.text === "string") {
        console.log("[FOCUS] normalized payload.text:", payload.text);
        setFocus(payload.text);
        return;
      }

      // Defensive: nested focus object
      if (payload.focus && typeof payload.focus.text === "string") {
        console.log(
          "[FOCUS] normalized payload.focus.text:",
          payload.focus.text
        );
        setFocus(payload.focus.text);
        return;
      }

      // Unknown shape — do not render garbage
      console.log("[FOCUS] unknown payload shape → clearing", payload);
      setFocus(null);
    };

    const handleFocusCleared = () => {
      console.log("[FOCUS] focus:cleared event received");
      setFocus(null);
    };

    onEvent("focus:update", handleFocusUpdate);
    onEvent("focus:set", handleFocusUpdate); // alias safety
    onEvent("focus:cleared", handleFocusCleared);

    return () => {
      offEvent("focus:update", handleFocusUpdate);
      offEvent("focus:set", handleFocusUpdate);
      offEvent("focus:cleared", handleFocusCleared);
    };
  }, [onEvent, offEvent]);

  const handleSetFocus = (event) => {
    event.preventDefault();
    const text = focusInput.trim();
    if (!text) return;

    emit("focus:set", { text });
    setFocusInput("");
  };

  const handleClearFocus = () => {
    emit("focus:cleared");
  };

  const emitTrainerMessage = ({ text, parentMessageId = null }) => {
    const trimmed = text?.trim();
    if (!trimmed) {
      return false;
    }

    emit("message:trainerReply", {
      content: { type: "text", text: trimmed },
      parentMessageId,
    });

    return true;
  };

  const handleTrainerSubmit = (event) => {
    event.preventDefault();
    if (emitTrainerMessage({ text: trainerInput })) {
      setTrainerInput("");
    }
  };

  const handleTrainerReplySubmit = (parentMessageId) => {
    const draft = trainerReplyDrafts[parentMessageId] ?? "";
    if (!emitTrainerMessage({ text: draft, parentMessageId })) {
      return;
    }

    setTrainerReplyDrafts((prev) => {
      const next = { ...prev };
      delete next[parentMessageId];
      return next;
    });
    setTrainerReplyToId(null);
  };

  const messageRoots = buildMessageTree(messages);
  const rootColorAssignments = assignThreadColors(messageRoots);
  const threadConfusions = messageRoots.map((root) => ({
    root,
    confusion: summarizeThreadConfusion(root, confusionByRootId),
    threadColor: rootColorAssignments.get(root.messageId),
  }));
  const confusionThreads = threadConfusions.filter(
    ({ confusion }) => confusion.showConfusionRow
  );
  const hasMessages = messageRoots.length > 0;
  const canonicalParticipants =
    livePulse?.participants && typeof livePulse.participants === "object"
      ? livePulse.participants
      : null;
  const summaryCounts = computePulseSummaryCounts(
    livePulse,
    canonicalParticipants
  );
  const summaryVoteTotals = summaryCounts;
  const summaryVoteCount =
    summaryCounts.engaged +
    summaryCounts.neutral +
    summaryCounts.frustrated;
  const timelineParticipantsCount = canonicalParticipantCount;
  const sessionIdLabel = socket?.sessionId ?? "session:default";

  return (
    <div className="trainer-view-shell">
      <div className="trainer-view-grid">
        <div data-column="left" className="trainer-left-column">
          <div className="trainer-left-panel">
            <header className="trainer-session-header">
              <div className="trainer-session-copy">
                <h1 className="trainer-session-title">Session View</h1>
                <p className="trainer-session-status">
                  Socket: {connectionStatus}
                </p>
                <p className="session-label trainer-session-meta">
                  Session: {sessionIdLabel}
                </p>
              </div>
              <button
                className="trainer-session-toggle"
                onClick={() => {
                  setVisibleInsights(hiddenInsights);
                  setShowInsights((v) => !v);
                }}
              >
                Insights
              </button>
            </header>

            {/* ---------------- TRAINER INSIGHTS (PULL-ONLY) ---------------- */}
            {showInsights && visibleInsights && (
              <div className="trainer-insights-panel">
                <h3 className="trainer-section-heading">Insights</h3>

                {Array.isArray(visibleInsights) && visibleInsights.length ? (
                  Object.entries(
                    visibleInsights.reduce((acc, insight) => {
                      const key = insight.category ?? "Other";
                      acc[key] = acc[key] || [];
                      acc[key].push(insight);
                      return acc;
                    }, {})
                  ).map(([category, insights]) => (
                    <div key={category} className="trainer-insights-category">
                      <div className="trainer-insights-category-label">
                        {category.toUpperCase()}
                      </div>
                      <ul className="trainer-insights-list">
                        {insights.map((insight) => (
                          <li key={insight.id} className="trainer-insight-item">
                            {insight.language}
                            {typeof insight.confidence === "number" && (
                              <span className="trainer-insight-confidence">
                                {" "}
                                (confidence {Math.round(insight.confidence * 100)}%)
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))
                ) : (
                  <p className="trainer-text-muted">
                    No Insights yet
                  </p>
                )}
              </div>
            )}

            {console.log("[WIRE_TEST][METER_RENDER]", { driftProjection })}
            <AudienceDriftMeter projection={driftProjection} />

            <div className="trainer-confusion-panel">
              <h3 className="trainer-section-heading trainer-confusion-heading">
                Confusion
              </h3>
              <div className="trainer-confusion-list">
                {confusionThreads.length ? (
                  confusionThreads.map(({ root, confusion }) => (
                    <div
                      key={root.messageId}
                      onClick={() => scrollToThreadRoot(root.messageId)}
                      className="trainer-confusion-thread"
                    >
                      <div className="trainer-confusion-thread-heading">
                        <span className="trainer-confusion-thread-title">
                          {root.text ?? root.messageId}
                        </span>
                      </div>
                      <ConfusionMeter confusionScore={confusion.confusionScore} />
                    </div>
                  ))
                ) : (
                  <div className="trainer-confusion-empty">
                    No threads currently surfaced
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

        <div data-column="center" className="trainer-center-column">
          {/* ===== Pulse ===== */}
          <section>
            {/* CENTER COLUMN pulse timeline (authoritative) */}
            {(() => {
              if (TRACE_ENABLED) {
                console.group("[TRACE] TrainerView → PulseTimeline render");
                console.log(
                  "canonicalParticipantCount (render-scope):",
                  canonicalParticipantCount
                );
                console.log(
                  "typeof canonicalParticipantCount:",
                  typeof canonicalParticipantCount
                );
                console.log(
                  "canonicalParticipantCount === 0:",
                  canonicalParticipantCount === 0
                );
                console.log(
                  "canonicalParticipantCount === undefined:",
                  canonicalParticipantCount === undefined
                );
                console.groupEnd();
              }

              if (process.env.NODE_ENV !== "production") {
                if (
                  typeof summaryVoteCount === "number" &&
                  typeof timelineParticipantsCount === "number" &&
                  summaryVoteCount > timelineParticipantsCount
                ) {
                  if (TRACE_ENABLED) {
                    console.warn(
                      "[TRACE] PulseSummary vote count exceeds participant count",
                      {
                        summaryVoteCount,
                        canonicalParticipantCount,
                        timelineParticipantsCount,
                      }
                    );
                  }
                }
              }
            })()}
            <PulseTimeline
              eventLog={livePulse?.eventLog ?? []}
              participantsCount={canonicalParticipantCount}
            />
            {connectionStatus !== "connected" && (
              <div className="pulse-timeline-placeholder">
                Waiting for live pulse data before drawing the timeline.
              </div>
            )}
            <PulseSummary summaryVoteTotals={summaryVoteTotals} />
          </section>

          <section className="trainer-panel-card trainer-focus-panel">
            <h3 className="trainer-section-heading">Focus</h3>
            <p className="trainer-text-muted">
              {focus ?? "No focus set"}
            </p>
          </section>

            <div className="trainer-message-area">
              <h3 className="trainer-section-heading">Messages</h3>
              <div className="trainer-message-scroller">
                {hasMessages ? (
                <div className="message-stream trainer-message-stream">
                  {threadConfusions.map(({ root, confusion, threadColor }) => (
                    <TrainerThreadRow
                      key={root.messageId}
                      root={root}
                      threadColor={threadColor}
                      confusion={confusion}
                      confusionByRootId={confusionByRootId}
                      voteTotals={voteTotals[root.messageId]}
                      voteTotalsMap={voteTotals}
                      trainerReplyToId={trainerReplyToId}
                      setTrainerReplyToId={setTrainerReplyToId}
                      trainerReplyDrafts={trainerReplyDrafts}
                      setTrainerReplyDrafts={setTrainerReplyDrafts}
                      handleTrainerReplySubmit={handleTrainerReplySubmit}
                    />
                  ))}
                </div>
              ) : (
                <p className="trainer-text-muted">No messages yet</p>
              )}

              <form className="message-input-bar" onSubmit={handleTrainerSubmit}>
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={trainerInput}
                  onChange={(event) => setTrainerInput(event.target.value)}
                />
                <button type="submit">Send</button>
              </form>
            </div>
          </div>

        </div>
        {/* ================= RIGHT COLUMN ================= */}
        <div data-column="right" className="trainer-right-column">
          <section className="trainer-focus-controls">
            <h3 className="trainer-section-heading">Focus Controls</h3>
            <p className="trainer-text-muted trainer-focus-help">
              Current focus is visible above the messages panel.
            </p>

            <input
              type="text"
              placeholder=""
              value={focusInput}
              onChange={(event) => setFocusInput(event.target.value)}
              className="trainer-focus-input"
            />

            <div className="trainer-focus-actions">
              <button className="trainer-focus-button" onClick={handleSetFocus}>
                Set Focus
              </button>
              <button
                className="trainer-focus-button trainer-focus-button--secondary"
                onClick={handleClearFocus}
              >
                Clear Focus
              </button>
            </div>
          </section>

          {/* Session Metadata */}
          <section className="trainer-panel-card">
            <h3 className="trainer-section-heading">Session Info</h3>
            <p className="trainer-text-muted trainer-panel-note">
              Session metadata will appear here.
            </p>
          </section>

          {/* Insights Placeholder (read-only) */}
          <section className="trainer-panel-card">
            <h3 className="trainer-section-heading">Insights</h3>
            <p className="trainer-text-muted trainer-panel-note">
              Insights will appear here after the session.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}

const VISIBLE_WINDOW_MS = 60_000; // Show roughly one minute of data in the visual “cardiac monitor” window.

function PulseSummary({ summaryVoteTotals }) {
  const totals = summaryVoteTotals ?? {
    engaged: 0,
    neutral: 0,
    frustrated: 0,
  };
  const columns = [
    { label: "Engaged", value: totals.engaged },
    { label: "Neutral", value: totals.neutral },
    { label: "Frustrated", value: totals.frustrated },
  ];

  return (
    <div className="pulse-distribution">
      {columns.map(({ label, value }) => (
        <div key={label} className="pulse-distribution-column">
          <span className="label pulse-distribution-label">{label}</span>
          <span className="value pulse-distribution-value">{value}</span>
        </div>
      ))}
    </div>
  );
}

function PulseTimeline(props) {
  const {
    eventLog = [],
    participantsCount,
    scaleMin,
    scaleMax,
    points,
  } = props;
  const participantCount = participantsCount;

  const participantsPending = participantsCount === undefined;

  if (participantsPending) {
    console.debug("[PulseTimeline] participants pending");
  }

  if (process.env.NODE_ENV !== "production") {
    console.assert(
      participantsPending || typeof participantsCount === "number",
      "participantsCount unresolved outside pending state"
    );
  }

  // Normalize participantsCount for early / pre-session renders
  const resolvedParticipantsCount =
    typeof participantsCount === "number"
      ? participantsCount
      : 0;
  const scale = participantsPending ? 1 : resolvedParticipantsCount;
  const scalingProps = {
    participantsCount: resolvedParticipantsCount,
    eventLogLength: Array.isArray(eventLog) ? eventLog.length : undefined,
    pulseHistoryLength: props.pulseHistory?.length,
    scale: props.scale,
  };

  if (process.env.NODE_ENV !== "production") {
    if (TRACE_ENABLED) {
      console.groupCollapsed("[TRACE] PulseTimeline props");
      console.log("resolvedParticipantsCount:", resolvedParticipantsCount);
      console.log("scaleMin:", scaleMin);
      console.log("scaleMax:", scaleMax);
      console.log("points:", points);
      console.groupEnd();
    }

    // Zero is an expected transitional value while the canonical participant count is still pending.
    const resolvedCountIsValid = resolvedParticipantsCount >= 0;
    if (!resolvedCountIsValid) {
      console.warn(
        "[ASSERT] PulseTimeline received invalid resolvedParticipantsCount:",
        resolvedParticipantsCount
      );
    }

    if (TRACE_ENABLED) {
      console.groupCollapsed("[TRACE] PulseTimeline scaling props");
      console.log("scaling props snapshot:", scalingProps);
      console.log("resolvedParticipantsCount:", resolvedParticipantsCount);
      console.groupEnd();
    }
    console.assert(
      resolvedCountIsValid,
      "[ASSERT] PulseTimeline received invalid resolvedParticipantsCount",
      { resolvedParticipantsCount }
    );
  }

  // Source: raw prop from TrainerView's livePulse payload. The timeline defaults to 0 for missing values, so the debug here shines light on when PulseSummary sees `undefined` while PulseTimeline consumes 0.
  const canonicalPulseMap = {
    engaged: 1,
    neutral: 0,
    frustrated: -1,
  };

  const normalizedEvents = (Array.isArray(eventLog) ? eventLog : [])
    .map((entry, index) => {
      if (!entry) {
        return null;
      }

      const rawValue =
        typeof entry.value === "number"
          ? entry.value
          : canonicalPulseMap[entry.value];
      if (
        rawValue === null ||
        rawValue === undefined ||
        (rawValue !== 1 && rawValue !== 0 && rawValue !== -1)
      ) {
        return null;
      }

      return {
        ts: entry.ts ?? entry.timestamp ?? Date.now() + index,
        value: rawValue,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.ts - b.ts);

  const [baselineStartTs] = useState(() => Date.now());
  const [nowTs, setNowTs] = useState(() => Date.now());

  useEffect(() => {
    let active = true;
    let rafId;
    const updateNow = () => {
      if (!active) {
        return;
      }
      setNowTs(Date.now());
      rafId = requestAnimationFrame(updateNow);
    };
    rafId = requestAnimationFrame(updateNow);
    return () => {
      active = false;
      cancelAnimationFrame(rafId);
    };
  }, []);

  const timelineEntries = [
    { ts: baselineStartTs, value: 0 },
    ...normalizedEvents,
  ];

  const hasParticipantData = resolvedParticipantsCount > 0;
  const participantScale = scale;
  // displayCount bottoms out at 1 so a visible ± range exists even with zero/missing participants, and the left labels are strictly diagnostics for verifying that participant-based scaling.
  const displayCount = Math.max(1, participantScale);
  const minY = -displayCount;
  const maxY = displayCount;
  const safeScale = displayCount;

  const timelinePoints = [];
  const startTs = timelineEntries[0]?.ts ?? Date.now();
  timelinePoints.push({ ts: startTs, netValue: 0 });

  let previousVote = 0;
  let netValueTotal = 0;

  for (let i = 1; i < timelineEntries.length; i += 1) {
    const entry = timelineEntries[i];
    const delta = entry.value - previousVote;
    netValueTotal += delta;

    timelinePoints.push({
      ts: entry.ts,
      netValue: netValueTotal,
    });

    previousVote = entry.value;
  }

  const width =
    Math.max(360, Math.max(normalizedEvents.length - 1, 0) * 48 + 80);
  const height = 180;
  const centerY = height / 2;
  const amplitude = centerY - 16;

  const latestHistoryTs =
    timelinePoints[timelinePoints.length - 1]?.ts ?? Date.now();
  const effectiveLatestTs = Math.max(latestHistoryTs, nowTs);
  const windowStartTs = effectiveLatestTs - VISIBLE_WINDOW_MS;

  let netValueBeforeWindow = timelinePoints[0]?.netValue ?? 0;
  for (let i = timelinePoints.length - 1; i >= 0; i -= 1) {
    if (timelinePoints[i].ts < windowStartTs) {
      netValueBeforeWindow = timelinePoints[i].netValue;
      break;
    }
  }

  // Restrict rendering to the most recent window to preserve the fixed-width cardiac monitor feel.
  const pointsInVisibleWindow = timelinePoints.filter(
    (point) => point.ts >= windowStartTs
  );

  const windowedTimelinePoints = [];
  if (pointsInVisibleWindow.length === 0) {
    windowedTimelinePoints.push({
      ts: windowStartTs,
      netValue: netValueBeforeWindow,
    });
  } else {
    if (pointsInVisibleWindow[0].ts > windowStartTs) {
      windowedTimelinePoints.push({
        ts: windowStartTs,
        netValue: netValueBeforeWindow,
      });
    }
    windowedTimelinePoints.push(...pointsInVisibleWindow);
  }

  const span = Math.max(effectiveLatestTs - windowStartTs, 1);

  const xForTs = (ts) => {
    const progress = (ts - windowStartTs) / span;
    return Math.max(0, Math.min(width, progress * width));
  };

  const yForValue = (value) =>
    centerY - (value / safeScale) * amplitude;

  const hasEvents = windowedTimelinePoints.length > 0;
  const baselinePoint = {
    ts: nowTs,
    netValue: 0,
    synthetic: true,
  };
  // Right-anchored neutral baseline keeps the timeline visible before any events arrive.
  const pointsForPath = hasEvents ? windowedTimelinePoints : [baselinePoint];

  const commands = pointsForPath.map((point, index) => {
    const x = xForTs(point.ts);
    const y = yForValue(point.netValue);
    return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
  });
  const latestNetValue =
    timelinePoints[timelinePoints.length - 1]?.netValue ?? 0;
  const leadX = xForTs(nowTs);
  const leadY = yForValue(latestNetValue);
  const nowX = leadX.toFixed(2);
  commands.push(`L ${nowX} ${yForValue(latestNetValue).toFixed(2)}`);

  const pathD = commands.join(" ");

  const formatAxisTime = (timestamp) =>
    new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

  const axisLineValues = [maxY, 0, minY];

  return (
    <div className="pulse-timeline">
      <div className="pulse-timeline-header">
        <div>
          <div className="pulse-timeline-title">PULSE</div>
        </div>
        <div className="pulse-timeline-current">
          Room: {participantCount}
        </div>
      </div>
      <div className="pulse-timeline-track">
        <div
          className="pulse-timeline-track-inner"
          style={{ minHeight: height }}
        >
          <div
            className="pulse-timeline-scale-axis"
            style={{ height }}
            aria-hidden="true"
          >
            {[
              { value: maxY, label: maxY >= 0 ? `+${maxY}` : `${maxY}`, key: "max" },
              { value: 0, label: "0", key: "zero" },
              { value: minY, label: `${minY}`, key: "min" },
            ].map(({ value, label, key }) => (
              <span
                key={`scale-label-${key}`}
                className="pulse-timeline-scale-label"
                style={{ top: `${yForValue(value)}px` }}
              >
                {label}
              </span>
            ))}
          </div>
          <div className="pulse-timeline-svg-wrapper">
            <svg
              className="pulse-timeline-svg"
              viewBox={`0 0 ${width} ${height}`}
              preserveAspectRatio="none"
            >
              {axisLineValues.map((value) => (
                <line
                  key={`axis-${value}`}
                  x1="0"
                  x2={width}
                  y1={yForValue(value)}
                  y2={yForValue(value)}
                  stroke="#eee"
                  strokeWidth="1"
                />
              ))}
              <line
                x1="0"
                x2={width}
                y1={height - 4}
                y2={height - 4}
                stroke="#ccc"
                strokeWidth="1"
              />
              <path d={pathD} fill="none" stroke="#0066ff" strokeWidth="2" />
              <circle cx={leadX} cy={leadY} r={3} fill="#0066ff" />
            </svg>
          </div>
        </div>
      </div>
      <div className="pulse-timeline-legend">
        <span />
        <span />
        <span />
      </div>
      {windowedTimelinePoints.length > 1 && (
        <div className="pulse-timeline-time-axis">
          <span />
          <span />
        </div>
      )}
    </div>
  );
}

function computePulseSummaryCounts(livePulse, canonicalParticipants) {
  const counts = { engaged: 0, neutral: 0, frustrated: 0 };
  if (!livePulse || !livePulse.votes || typeof livePulse.votes !== "object") {
    return counts;
  }

  const participantsMap =
    canonicalParticipants && typeof canonicalParticipants === "object"
      ? canonicalParticipants
      : livePulse.participants;
  const hasParticipantData =
    participantsMap && typeof participantsMap === "object";

  Object.entries(livePulse.votes).forEach(([voterId, vote]) => {
    const participant = hasParticipantData ? participantsMap[voterId] : null;
    const participantRole = participant?.actorRole ?? participant?.role;
    if (hasParticipantData && (!participant || participantRole !== "audience")) {
      return;
    }

    if (vote === "engaged") {
      counts.engaged += 1;
    } else if (vote === "neutral") {
      counts.neutral += 1;
    } else if (vote === "frustrated") {
      counts.frustrated += 1;
    }
  });

  return counts;
}
