import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useSocket } from "../socket/SocketContext.jsx";
import AudienceDriftMeter, {
  createNeutralAudienceDriftProjection,
} from "../components/AudienceDriftMeter.jsx";
import { buildMessageTree } from "../utils/messageUtils.js";
import { PulseSummary } from "../components/pulse/PulseSummary.jsx";
import { PulseTimeline } from "../components/pulse/PulseTimeline.jsx";
import { MessageThreadRow } from "../components/threads/MessageThreadRow.jsx";
import { MessageInputBar } from "../components/messages/MessageInputBar.jsx";
import { InsightsPanel } from "../components/insights/InsightsPanel.jsx";
import { ConfusionPanel } from "../components/confusion/ConfusionPanel.jsx";
import { SessionHeader } from "../components/session/SessionHeader.jsx";
import { FocusControls } from "../components/focus/FocusControls.jsx";
import { assignThreadColors, scrollToThreadRoot } from "../utils/threadUtils.js";
import { summarizeThreadConfusion } from "../utils/confusionUtils.js";
import { computePulseSummaryCounts } from "../utils/pulseUtils.js";
import {
  computeActivityPulseUpdates,
  didChangeValue,
  didCrossUpwardThreshold,
  summarizeThread,
} from "../utils/threadToolsUtils.js";
import { useTrainerSocket } from "../hooks/useTrainerSocket.js";
import { useMessageState } from "../hooks/useMessageState.js";
import { useFocusState } from "../hooks/useFocusState.js";
import { useSessionState } from "../hooks/useSessionState.js";
import { SessionAccessPanel } from "../components/session/SessionAccessPanel.jsx";
import { useObsCaptureState } from "../hooks/useObsCaptureState.js";
import { createObsCaptureClient } from "../obs/obsCaptureClient.js";
import "./AudienceInput.css";
import "./TrainerView.css";

const TRACE_ENABLED = false;


export default function TrainerView() {
  const { socket, emit, onEvent, offEvent, connectionStatus } = useSocket();
  
  // Reference to LiveView window to prevent multiple instances
  const liveViewWindowRef = useRef(null);
  const obsClientRef = useRef(null);
  const [activeThreadLens, setActiveThreadLens] = useState("all");
  const [lastThreadMapViewedAt, setLastThreadMapViewedAt] = useState(() =>
    Date.now()
  );
  const [grewCrossedAtByRootId, setGrewCrossedAtByRootId] = useState({});
  const [topicChangedAtByRootId, setTopicChangedAtByRootId] = useState({});
  const [lensNowMs, setLensNowMs] = useState(() => Date.now());
  const [activityNowMs, setActivityNowMs] = useState(() => Date.now());
  const [lastActivityAtByRootId, setLastActivityAtByRootId] = useState({});
  const prevReplyCountByRootIdRef = useRef({});
  const prevTopicStateByRootIdRef = useRef({});
  const prevLatestTsByRootIdRef = useRef({});
  
  // Local state for UI toggles and insights
  const [showInsights, setShowInsights] = useState(false);
  const [visibleInsights, setVisibleInsights] = useState(null);
  const [hiddenInsights, setHiddenInsights] = useState(null);

  const [obsCapture, setObsCapture] = useState({
    status: "idle",
    reason: null,
    metrics: null,
    captureSessionId: null,
    ts: null,
  });
  
  // Pulse and drift state
  const [livePulse, setLivePulse] = useState(null);
  const [driftProjection, setDriftProjection] = useState(() =>
    createNeutralAudienceDriftProjection()
  );
  
  // Confusion advisory state
  const [confusionAdvisory, setConfusionAdvisory] = useState(null);

  // Focus management hook
  const {
    focus,
    setFocus,
    focusInput,
    setFocusInput,
    entries,
    activeFocusId,
    defaultFocusId,
    activeFocusText,
    handleAddFocus,
    handleActivateFocus,
    handleResetToDefault,
    handleReorder,
    handleEditInPlace,
    handleReviseByNew,
  } = useFocusState({ emit, onEvent, offEvent });

  // Message management hook
  const {
    messages,
    setMessages,
    voteTotals,
    setVoteTotals,
    messageInput,
    setMessageInput,
    replyToId,
    setReplyToId,
    replyDrafts,
    setReplyDrafts,
    handleMessageSubmit,
    handleReplySubmit,
  } = useMessageState({ emit });

  // Socket event subscriptions hook
  useTrainerSocket({
    socket,
    onEvent,
    offEvent,
    setLivePulse,
    setDriftProjection,
    setMessages,
    setVoteTotals,
    setHiddenInsights,
    setConfusionAdvisory,
    setFocus,
  });

  useObsCaptureState({
    onEvent,
    offEvent,
    setObsCapture,
  });

  // Lazy init OBS capture client (browser-only capture; server tracks status)
  if (!obsClientRef.current) {
    obsClientRef.current = createObsCaptureClient({ emit });
  }

  // Session state hook
  const { accessCode, participantCount } = useSessionState({
    socket,
    emit,
    onEvent,
    offEvent,
  });

  // Ensure this client is registered as a trainer (required for trainer-only Focus Box actions)
  useEffect(() => {
    if (!socket?.connected) return;
    emit("session:join", {
      role: "trainer",
      name: "Trainer",
      metadata: { client: "trainer_view" },
    });
  }, [socket?.connected, emit]);
  // Memoized confusion lookup
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

  // Development warnings for pulse data
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

  const messageRoots = useMemo(() => buildMessageTree(messages), [messages]);
  const rootColorAssignments = useMemo(() => assignThreadColors(messageRoots), [messageRoots]);
  const threadSummaries = useMemo(
    () => messageRoots.map((root) => summarizeThread(root)),
    [messageRoots]
  );
  const threadSummaryByRootId = useMemo(() => {
    const map = {};
    threadSummaries.forEach((summary) => {
      if (summary?.rootMessageId) {
        map[summary.rootMessageId] = summary;
      }
    });
    return map;
  }, [threadSummaries]);
  const threadConfusions = useMemo(() => {
    return messageRoots.map((root) => ({
      root,
      confusion: summarizeThreadConfusion(root, confusionByRootId),
      threadColor: rootColorAssignments.get(root.messageId),
    }));
  }, [messageRoots, confusionByRootId, rootColorAssignments]);

  // "Last view" is a trainer-local single timestamp; clearing back to All Threads updates it.
  useEffect(() => {
    if (activeThreadLens !== "all") return;
    setLastThreadMapViewedAt(Date.now());
  }, [activeThreadLens]);

  // Keep time-window lenses fresh so items age out without requiring new messages to arrive.
  useEffect(() => {
    const isTimeWindowLens =
      activeThreadLens === "threads_that_grew" ||
      activeThreadLens === "topic_changes";
    if (!isTimeWindowLens) {
      return undefined;
    }
    setLensNowMs(Date.now());
    const id = setInterval(() => setLensNowMs(Date.now()), 1000);
    return () => clearInterval(id);
  }, [activeThreadLens]);

  // Keep activity pulses fresh without relying on new server events.
  useEffect(() => {
    const id = setInterval(() => setActivityNowMs(Date.now()), 250);
    return () => clearInterval(id);
  }, []);

  // Track boundary crossings for "Threads That Grew" (≤4 → ≥5 replies)
  useEffect(() => {
    const now = Date.now();
    const threshold = 5;
    const grewUpdates = {};
    let changed = false;

    threadSummaries.forEach((summary) => {
      const rootId = summary?.rootMessageId;
      if (!rootId) return;
      const prev = prevReplyCountByRootIdRef.current[rootId];
      const next = summary.replyCount;
      if (
        typeof prev === "number" &&
        didCrossUpwardThreshold(prev, next, threshold)
      ) {
        grewUpdates[rootId] = now;
        changed = true;
      }
      prevReplyCountByRootIdRef.current[rootId] = next;
    });

    if (changed) {
      setGrewCrossedAtByRootId((prev) => ({ ...prev, ...grewUpdates }));
    }
  }, [threadSummaries]);

  // Track topic state transitions for "Topic Changes"
  useEffect(() => {
    const now = Date.now();
    const updates = {};
    let changed = false;

    threadSummaries.forEach((summary) => {
      const rootId = summary?.rootMessageId;
      if (!rootId) return;
      const prev = prevTopicStateByRootIdRef.current[rootId];
      const next = summary.topicState;
      if (didChangeValue(prev, next)) {
        updates[rootId] = now;
        changed = true;
      }
      prevTopicStateByRootIdRef.current[rootId] = next;
    });

    if (changed) {
      setTopicChangedAtByRootId((prev) => ({ ...prev, ...updates }));
    }
  }, [threadSummaries]);

  // Track ephemeral per-thread activity pulses (TrainerView-local).
  // A pulse is emitted when the latest message timestamp for a thread increases.
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

  const visibleThreadConfusions = useMemo(() => {
    if (activeThreadLens === "all") {
      return threadConfusions;
    }

    const now = lensNowMs;
    const grewWindowMs = 300_000;
    const topicWindowMs = 120_000;

    return threadConfusions.filter(({ root }) => {
      const rootId = root?.messageId;
      if (!rootId) return false;

      if (activeThreadLens === "new_since_last_view") {
        const latest = threadSummaryByRootId[rootId]?.latestMessageTsMs ?? null;
        return typeof latest === "number" && latest > lastThreadMapViewedAt;
      }

      if (activeThreadLens === "threads_that_grew") {
        const crossedAt = grewCrossedAtByRootId[rootId];
        return typeof crossedAt === "number" && crossedAt >= now - grewWindowMs;
      }

      if (activeThreadLens === "topic_changes") {
        const changedAt = topicChangedAtByRootId[rootId];
        return typeof changedAt === "number" && changedAt >= now - topicWindowMs;
      }

      return true;
    });
  }, [
    activeThreadLens,
    threadConfusions,
    threadSummaryByRootId,
    lastThreadMapViewedAt,
    grewCrossedAtByRootId,
    topicChangedAtByRootId,
    lensNowMs,
  ]);
  const confusionThreads = useMemo(() => {
    return threadConfusions.filter(
      ({ confusion }) => confusion.showConfusionRow
    );
  }, [threadConfusions]);
  const canonicalParticipants = useMemo(() => {
    return livePulse?.participants && typeof livePulse.participants === "object"
      ? livePulse.participants
      : null;
  }, [livePulse]);
  const summaryCounts = useMemo(() => {
    return computePulseSummaryCounts(
      livePulse,
      canonicalParticipants
    );
  }, [livePulse, canonicalParticipants]);
  const summaryVoteTotals = summaryCounts;
  const summaryVoteCount =
    summaryCounts.engaged +
    summaryCounts.neutral +
    summaryCounts.frustrated;
  const timelineParticipantsCount = canonicalParticipantCount;
  const sessionIdLabel = socket?.sessionId ?? "session:default";

  const handleToggleInsights = useCallback(() => {
    setVisibleInsights(hiddenInsights);
    setShowInsights((v) => !v);
  }, [hiddenInsights]);

  const handleMessageInputChange = useCallback((event) => {
    setMessageInput(event.target.value);
  }, []);

  const activeThreadLensLabel = useMemo(() => {
    switch (activeThreadLens) {
      case "new_since_last_view":
        return "New Since Last View";
      case "threads_that_grew":
        return "Threads That Grew";
      case "topic_changes":
        return "Topic Changes";
      case "all":
      default:
        return "All Threads";
    }
  }, [activeThreadLens]);

  const handleScrollToThread = useCallback((rootMessageId) => {
    if (!rootMessageId) return;
    // Scroll locally in TrainerView
    scrollToThreadRoot(rootMessageId);
    // Emit socket event to scroll LiveView
    emit("trainer:scroll:to:thread", {
      rootMessageId,
    });
  }, [emit]);

  // Handle opening LiveView window with single-instance enforcement
  const handleOpenLiveView = useCallback(() => {
    if (!accessCode) return;
    
    const liveViewUrl = `/live/${accessCode}`;
    
    // Check if LiveView window already exists and is still open
    if (liveViewWindowRef.current && !liveViewWindowRef.current.closed) {
      // Window exists and is open - focus it instead of opening a new one
      liveViewWindowRef.current.focus();
    } else {
      // No window or window was closed - open a new one
      liveViewWindowRef.current = window.open(
        liveViewUrl,
        'liveViewWindow',
        'width=1920,height=1080'
      );
    }
  }, [accessCode]);

  // Clean up window reference when window is closed or component unmounts
  useEffect(() => {
    const checkWindowClosed = setInterval(() => {
      if (liveViewWindowRef.current?.closed) {
        liveViewWindowRef.current = null;
      }
    }, 1000);

    return () => {
      clearInterval(checkWindowClosed);
      // Clear reference on unmount (window can stay open, just forget the reference)
      liveViewWindowRef.current = null;
    };
  }, []);

  return (
    <div className="trainer-view-shell">
      <div className="trainer-view-grid">
        <div data-column="left" className="trainer-left-column">
          <div className="trainer-left-panel">
            <SessionHeader
              connectionStatus={connectionStatus}
              sessionIdLabel={sessionIdLabel}
            />

            {showInsights && visibleInsights && (
              <InsightsPanel insights={visibleInsights} />
            )}

            {/* ===== Pulse ===== */}
            <section>
              <PulseTimeline
                eventLog={livePulse?.eventLog ?? []}
                participantsCount={canonicalParticipantCount}
                footer={<PulseSummary summaryVoteTotals={summaryVoteTotals} />}
              />
              {connectionStatus !== "connected" && (
                <div className="pulse-timeline-placeholder">
                  Waiting for live pulse data before drawing the timeline.
                </div>
              )}
            </section>

            <AudienceDriftMeter projection={driftProjection} />

            <ConfusionPanel confusionThreads={confusionThreads} onScrollToThread={handleScrollToThread} />
          </div>
        </div>

        <div data-column="center" className="trainer-center-column">
          <div className="trainer-message-area">
            <h3 className="trainer-section-heading">Messages</h3>
            <div className="thread-tools-bar" aria-label="Thread Tools">
              <div className="thread-tools-bar-left">
                <span className="thread-tools-label">Thread Tools</span>
                <select
                  className="thread-tools-select"
                  aria-label="Select thread lens"
                  value={activeThreadLens}
                  onChange={(e) => setActiveThreadLens(e.target.value)}
                >
                  <option value="all">All Threads</option>
                  <option value="new_since_last_view">New Since Last View</option>
                  <option value="threads_that_grew">Threads That Grew</option>
                  <option value="topic_changes">Topic Changes</option>
                </select>
              </div>
              {activeThreadLens !== "all" && (
                <div className="thread-tools-viewing" aria-live="polite">
                  Viewing: {activeThreadLensLabel}
                </div>
              )}
            </div>
            <div className="trainer-message-scroller">
              {visibleThreadConfusions.length ? (
                <div className="message-stream trainer-message-stream">
                  {visibleThreadConfusions.map(({ root, confusion, threadColor }) => {
                    const rootId = root?.messageId;
                    const lastActiveAt =
                      rootId ? lastActivityAtByRootId[rootId] : null;
                    const activityPulse =
                      typeof lastActiveAt === "number" &&
                      activityNowMs - lastActiveAt <= 900;

                    return (
                      <MessageThreadRow
                        key={root.messageId}
                        root={root}
                        threadColor={threadColor}
                        confusion={confusion}
                        confusionByRootId={confusionByRootId}
                        voteTotals={voteTotals[root.messageId]}
                        voteTotalsMap={voteTotals}
                        replyToId={replyToId}
                        setReplyToId={setReplyToId}
                        replyDrafts={replyDrafts}
                        setReplyDrafts={setReplyDrafts}
                        handleReplySubmit={handleReplySubmit}
                        onScrollToThread={handleScrollToThread}
                        defaultCollapsed={true}
                        activityPulse={activityPulse}
                      />
                    );
                  })}
                </div>
              ) : (
                <p className="trainer-text-muted">No messages yet</p>
              )}

              <MessageInputBar
                value={messageInput}
                onChange={handleMessageInputChange}
                onSubmit={handleMessageSubmit}
                placeholder="Type a message..."
              />
            </div>
          </div>
        </div>
        {/* ================= RIGHT COLUMN ================= */}
        <div data-column="right" className="trainer-right-column">
          <FocusControls
            focusInput={focusInput}
            setFocusInput={setFocusInput}
            entries={entries}
            activeFocusId={activeFocusId}
            defaultFocusId={defaultFocusId}
            activeFocusText={activeFocusText}
            handleAddFocus={handleAddFocus}
            handleActivateFocus={handleActivateFocus}
            handleResetToDefault={handleResetToDefault}
            handleReorder={handleReorder}
            handleEditInPlace={handleEditInPlace}
            handleReviseByNew={handleReviseByNew}
          />

          {/* Session Info with Access */}
          <section className="trainer-panel-card">
            <h3 className="trainer-section-heading">Session Info</h3>
            
            {/* Session Access Code */}
            <SessionAccessPanel
              accessCode={accessCode}
              showQr={false}
            />
            
            {/* Open LiveView Button */}
            <button
              className="trainer-liveview-button"
              onClick={handleOpenLiveView}
              disabled={!accessCode || connectionStatus !== 'connected'}
              title="Open projection display for in-room audience"
            >
              📺 Open LiveView
            </button>

            {/* OBS Capture (Pixels Only) */}
            <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid #e0e0e0" }}>
              <p style={{ margin: 0, fontSize: "0.75rem", color: "#666", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                OBS Capture
              </p>
              <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                <button
                  className="trainer-focus-button"
                  type="button"
                  onClick={() => obsClientRef.current?.startCapture()}
                  disabled={obsCapture.status === "capturing" || connectionStatus !== "connected"}
                  title="Start pixels-only capture (choose a window or tab)"
                >
                  Start
                </button>
                <button
                  className="trainer-focus-button trainer-focus-button--secondary"
                  type="button"
                  onClick={() => obsClientRef.current?.stopCapture()}
                  disabled={obsCapture.status !== "capturing"}
                  title="Stop capture"
                >
                  Stop
                </button>
              </div>

              <div style={{ marginTop: "10px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 16px" }}>
                <div>
                  <p style={{ margin: 0, fontSize: "0.75rem", color: "#666", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    Capture Status
                  </p>
                  <p style={{ margin: 0, fontSize: "1.0rem", fontWeight: "600", color: "#222" }}>
                    {obsCapture.status}
                  </p>
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: "0.75rem", color: "#666", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    Source Metrics
                  </p>
                  <p style={{ margin: 0, fontSize: "1.0rem", fontWeight: "600", color: "#222" }}>
                    {obsCapture.metrics?.width && obsCapture.metrics?.height
                      ? `${obsCapture.metrics.width}×${obsCapture.metrics.height}`
                      : "—"}
                    {typeof obsCapture.metrics?.frameRate === "number"
                      ? ` @${Math.round(obsCapture.metrics.frameRate)}fps`
                      : ""}
                  </p>
                </div>
              </div>

              {obsCapture.reason ? (
                <p className="trainer-text-muted trainer-panel-note" style={{ marginTop: "8px" }}>
                  {obsCapture.reason}
                </p>
              ) : null}
            </div>
            
            {/* Session Metadata */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e0e0e0' }}>
              <div>
                <p style={{ margin: 0, fontSize: '0.75rem', color: '#666', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Messages
                </p>
                <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: '600', color: '#222' }}>
                  {messages.length}
                </p>
              </div>
              
              <div>
                <p style={{ margin: 0, fontSize: '0.75rem', color: '#666', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Status
                </p>
                <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: '600', color: connectionStatus === 'connected' ? '#0b5fff' : '#666' }}>
                  {connectionStatus === 'connected' ? 'Live' : connectionStatus}
                </p>
              </div>
            </div>
          </section>

          {/* Insights Panel with Toggle */}
          <section className="trainer-panel-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 className="trainer-section-heading" style={{ margin: 0 }}>Insights</h3>
              <button 
                className="trainer-session-toggle" 
                onClick={handleToggleInsights}
                style={{ fontSize: '0.85rem' }}
              >
                {showInsights ? 'Hide' : 'Show'}
              </button>
            </div>
            
            {showInsights && visibleInsights && (
              <div style={{ marginTop: '12px' }}>
                <InsightsPanel insights={visibleInsights} />
              </div>
            )}
            
            {!showInsights && (
              <p className="trainer-text-muted trainer-panel-note" style={{ marginTop: '12px' }}>
                Click "Show" to view insights when available.
              </p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}


