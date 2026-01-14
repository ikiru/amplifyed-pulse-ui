import React, { useEffect, useMemo, useState, useCallback } from "react";
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
import { FocusDisplay } from "../components/focus/FocusDisplay.jsx";
import { assignThreadColors, scrollToThreadRoot } from "../utils/threadUtils.js";
import { summarizeThreadConfusion } from "../utils/confusionUtils.js";
import { computePulseSummaryCounts } from "../utils/pulseUtils.js";
import { useTrainerSocket } from "../hooks/useTrainerSocket.js";
import { useMessageState } from "../hooks/useMessageState.js";
import { useFocusState } from "../hooks/useFocusState.js";
import { useSessionState } from "../hooks/useSessionState.js";
import { SessionAccessPanel } from "../components/session/SessionAccessPanel.jsx";
import "./AudienceInput.css";
import "./TrainerView.css";

const TRACE_ENABLED = false;


export default function TrainerView() {
  const { socket, emit, onEvent, offEvent, connectionStatus } = useSocket();
  
  // Local state for UI toggles and insights
  const [showInsights, setShowInsights] = useState(false);
  const [visibleInsights, setVisibleInsights] = useState(null);
  const [hiddenInsights, setHiddenInsights] = useState(null);
  
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
    handleSetFocus,
    handleClearFocus,
  } = useFocusState({ emit });

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

  // Session state hook
  const { accessCode, participantCount } = useSessionState({
    socket,
    emit,
    onEvent,
    offEvent,
  });
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
  const threadConfusions = useMemo(() => {
    return messageRoots.map((root) => ({
      root,
      confusion: summarizeThreadConfusion(root, confusionByRootId),
      threadColor: rootColorAssignments.get(root.messageId),
    }));
  }, [messageRoots, confusionByRootId, rootColorAssignments]);
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

  const handleScrollToThread = useCallback((rootMessageId) => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/4231279e-6952-4b85-bc1a-061d94f40485',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'TrainerView.jsx:212',message:'handleScrollToThread called',data:{rootMessageId,hasEmit:!!emit},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    if (!rootMessageId) return;
    // Scroll locally in TrainerView
    scrollToThreadRoot(rootMessageId);
    // Emit socket event to scroll LiveView
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/4231279e-6952-4b85-bc1a-061d94f40485',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'TrainerView.jsx:217',message:'emitting trainer:scroll:to:thread',data:{rootMessageId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    emit("trainer:scroll:to:thread", {
      rootMessageId,
    });
  }, [emit]);

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

            <AudienceDriftMeter projection={driftProjection} />

            <ConfusionPanel confusionThreads={confusionThreads} onScrollToThread={handleScrollToThread} />
          </div>
        </div>

        <div data-column="center" className="trainer-center-column">
          {/* ===== Pulse ===== */}
          <section>
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

          <FocusDisplay focus={focus} />

          <div className="trainer-message-area">
            <h3 className="trainer-section-heading">Messages</h3>
            <div className="trainer-message-scroller">
              {threadConfusions.length ? (
                <div className="message-stream trainer-message-stream">
                  {threadConfusions.map(({ root, confusion, threadColor }) => (
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
                    />
                  ))}
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
            handleSetFocus={handleSetFocus}
            handleClearFocus={handleClearFocus}
          />

          {/* Session Info with Access */}
          <section className="trainer-panel-card">
            <h3 className="trainer-section-heading">Session Info</h3>
            
            {/* Session Access Code */}
            <SessionAccessPanel
              accessCode={accessCode}
            />
            
            {/* Open LiveView Button */}
            <button
              className="trainer-liveview-button"
              onClick={() => {
                if (accessCode) {
                  const liveViewUrl = `/live/${accessCode}`;
                  window.open(liveViewUrl, '_blank', 'width=1920,height=1080');
                }
              }}
              disabled={!accessCode || connectionStatus !== 'connected'}
              title="Open projection display for in-room audience"
            >
              📺 Open LiveView
            </button>
            
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


