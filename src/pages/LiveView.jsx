import React, { useState, useMemo, useCallback, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useSocket } from "../socket/SocketContext.jsx";
import { useLiveViewSocket } from "../hooks/useLiveViewSocket.js";
import { PulseTimeline } from "../components/pulse/PulseTimeline.jsx";
import { MessageThreadRow } from "../components/threads/MessageThreadRow.jsx";
import { QRCodeDisplay } from "../components/session/QRCodeDisplay.jsx";
import { buildMessageTree } from "../utils/messageUtils.js";
import { assignThreadColors, scrollToThreadRoot } from "../utils/threadUtils.js";
import { summarizeThreadConfusion } from "../utils/confusionUtils.js";
import "./LiveView.css";

/**
 * LiveView
 * 
 * Projection-optimized display for live session activity.
 * Shows Focus, Pulse, and Messages in a layout designed for in-room projectors.
 * 
 * Read-only display - no controls or interaction.
 * Launched from TrainerView via "Open LiveView" button.
 * 
 * Route: /live/:sessionCode
 */
export default function LiveView() {
  const { sessionCode } = useParams();
  const { socket, onEvent, offEvent, connectionStatus } = useSocket();

  // Local state
  const [livePulse, setLivePulse] = useState(null);
  const [messages, setMessages] = useState([]);
  const [voteTotals, setVoteTotals] = useState({});
  const [confusionAdvisory, setConfusionAdvisory] = useState(null);
  const [focus, setFocus] = useState(null);

  // Subscribe to socket events
  useLiveViewSocket({
    socket,
    onEvent,
    offEvent,
    setLivePulse,
    setMessages,
    setVoteTotals,
    setConfusionAdvisory,
    setFocus,
  });

  // Subscribe to trainer scroll events
  useEffect(() => {
    const handleScrollToThread = (payload) => {
      if (!payload?.rootMessageId) {
        return;
      }
      scrollToThreadRoot(payload.rootMessageId, ".liveview-message-list");
    };

    onEvent("trainer:scroll:to:thread", handleScrollToThread);
    return () => offEvent("trainer:scroll:to:thread", handleScrollToThread);
  }, [onEvent, offEvent]);

  // Build message tree and confusion map (same as TrainerView)
  const messageRoots = useMemo(() => buildMessageTree(messages), [messages]);
  const rootColorAssignments = useMemo(() => assignThreadColors(messageRoots), [messageRoots]);
  
  // Build confusion lookup map (same as TrainerView)
  const confusionByRootId = useMemo(() => {
    const threads = confusionAdvisory?.threads;
    if (!Array.isArray(threads) || threads.length === 0) {
      return {};
    }
    const map = {};
    threads.forEach((thread) => {
      if (thread?.rootMessageId) {
        map[thread.rootMessageId] = thread;
      }
    });
    return map;
  }, [confusionAdvisory]);

  // Compute confusion for each thread (same as TrainerView)
  const threadConfusions = useMemo(() => {
    return messageRoots.map((root) => ({
      root,
      confusion: summarizeThreadConfusion(root, confusionByRootId),
      threadColor: rootColorAssignments.get(root.messageId),
    }));
  }, [messageRoots, confusionByRootId, rootColorAssignments]);

  // Display all messages (never delete messages - they can be collapsed)
  const displayMessages = threadConfusions;

  // Compute pulse data
  const canonicalParticipantCount = useMemo(() => {
    if (!livePulse?.participants || typeof livePulse.participants !== "object") {
      return undefined;
    }
    return Object.values(livePulse.participants).reduce(
      (count, participant) =>
        participant?.actorRole === "audience" ? count + 1 : count,
      0
    );
  }, [livePulse]);

  // Stable noop callbacks for read-only LiveView (no interaction handlers needed)
  const noop = useCallback(() => {}, []);

  // Error state: no session code
  if (!sessionCode) {
    return (
      <div className="liveview-shell liveview-error">
        <div className="liveview-error-content">
          <h1>Please launch LiveView from TrainerView</h1>
          <p>LiveView requires a valid session code</p>
        </div>
      </div>
    );
  }

  // Connection status indicator
  const showReconnecting = connectionStatus === "reconnecting";

  return (
    <div className="liveview-shell">
      {/* Reconnecting indicator */}
      {showReconnecting && (
        <div className="liveview-reconnecting">Reconnecting...</div>
      )}

      {/* Focus Bar */}
      <div className="liveview-focus-bar">
        <div className="liveview-focus-label">CURRENT FOCUS</div>
        <h1 className="liveview-focus-text">
          {focus || "Open Conversation"}
        </h1>
      </div>

      {/* Two-column layout */}
      <div className="liveview-content">
        {/* Left: Pulse */}
        <div className="liveview-pulse-zone">
          <PulseTimeline
            eventLog={livePulse?.eventLog ?? []}
            participantsCount={canonicalParticipantCount}
          />
          
          {/* Session Access Info */}
          <div className="liveview-session-access">
            <div className="liveview-session-access-label">JOIN THIS SESSION</div>
            <QRCodeDisplay accessCode={sessionCode} size={160} />
            <div className="liveview-session-access-code">
              {sessionCode}
            </div>
            <div className="liveview-session-access-help">
              Scan QR code or enter code at {window.location.origin}/join
            </div>
          </div>
        </div>

        {/* Right: Messages */}
        <div className="liveview-message-zone">
          {displayMessages.length > 0 ? (
            <div className="liveview-message-list">
              <div className="message-stream trainer-message-stream">
                {displayMessages.map(({ root, confusion, threadColor }) => (
                  <MessageThreadRow
                    key={root.messageId}
                    root={root}
                    threadColor={threadColor}
                    confusion={confusion}
                    confusionByRootId={confusionByRootId}
                    voteTotals={voteTotals[root.messageId]}
                    voteTotalsMap={voteTotals}
                    replyToId={null}
                    setReplyToId={noop}
                    replyDrafts={{}}
                    setReplyDrafts={noop}
                    handleReplySubmit={noop}
                    showReplyControls={false}
                  />
                ))}
              </div>
            </div>
          ) : (
            <p className="liveview-empty-state">
              Conversation will appear here
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
