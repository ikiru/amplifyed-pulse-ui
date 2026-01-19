import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useSocket } from "../socket/SocketContext.jsx";
import { useLiveViewSocket } from "../hooks/useLiveViewSocket.js";
import { PulseTimeline } from "../components/pulse/PulseTimeline.jsx";
import { QRCodeDisplay } from "../components/session/QRCodeDisplay.jsx";
import { useObsCaptureState } from "../hooks/useObsCaptureState.js";
import "./LiveView.css";

/**
 * LiveView
 * 
 * Projection-optimized display for live session activity.
 * Shows Session Info, Pulse, Focus, and Slides (OBS deck feed) in a layout designed for in-room projectors.
 * 
 * Read-only display - no controls or interaction.
 * Launched from TrainerView via "Open LiveView" button.
 * 
 * Route: /live/:sessionCode
 */
export default function LiveView() {
  const { sessionCode } = useParams();
  const { socket, emit, onEvent, offEvent, connectionStatus } = useSocket();

  // Local state
  const [livePulse, setLivePulse] = useState(null);
  const [focus, setFocus] = useState(null);
  const [participantCount, setParticipantCount] = useState(null);
  const [sessionError, setSessionError] = useState(null);
  const [obsCapture, setObsCapture] = useState({
    status: "idle",
    reason: null,
    metrics: null,
    captureSessionId: null,
    ts: null,
  });

  const slideVideoRef = useRef(null);
  const [hasLocalObsStream, setHasLocalObsStream] = useState(false);
  const lastJoinAttemptRef = useRef({ code: null, connected: false });

  // Subscribe to socket events
  useLiveViewSocket({
    socket,
    onEvent,
    offEvent,
    setLivePulse,
    setFocus,
    setParticipantCount,
    setSessionError,
  });

  // OBS status (server state machine)
  useObsCaptureState({ onEvent, offEvent, setObsCapture });

  // Join the session room using the access code from the URL param.
  useEffect(() => {
    if (!socket?.connected || !sessionCode) {
      lastJoinAttemptRef.current = { code: sessionCode ?? null, connected: false };
      return;
    }

    // Avoid spamming join on rerenders while connected to the same code.
    const last = lastJoinAttemptRef.current;
    if (last.connected && last.code === sessionCode) {
      return;
    }

    setSessionError(null);
    emit("session:join", {
      accessCode: sessionCode,
      role: "audience",
      name: null,
      metadata: { client: "live_view" },
    });

    lastJoinAttemptRef.current = { code: sessionCode, connected: true };
  }, [socket?.connected, sessionCode, emit]);

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

  const effectiveParticipantCount =
    typeof canonicalParticipantCount === "number"
      ? canonicalParticipantCount
      : typeof participantCount === "number"
        ? participantCount
        : undefined;

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

  // Try to attach local OBS stream (Option B — local handoff from TrainerView)
  useEffect(() => {
    let intervalId = null;

    const tryAttach = () => {
      const stream =
        window.opener?.__LIVEVIEW__?.getObsStream?.() ?? null;
      if (!stream) {
        return false;
      }
      const node = slideVideoRef.current;
      if (!node) {
        return false;
      }

      if (node.srcObject !== stream) {
        node.srcObject = stream;
      }
      setHasLocalObsStream(true);
      return true;
    };

    // Initial attempt and short polling while LiveView initializes.
    tryAttach();
    intervalId = window.setInterval(() => {
      const ok = tryAttach();
      if (ok) {
        window.clearInterval(intervalId);
      }
    }, 500);

    return () => {
      if (intervalId) {
        window.clearInterval(intervalId);
      }
    };
  }, []);

  const showReconnecting = connectionStatus !== "connected";

  return (
    <div className="liveview-shell">
      {/* Reconnecting indicator */}
      {showReconnecting && (
        <div className="liveview-reconnecting">Reconnecting...</div>
      )}

      {sessionError && (
        <div className="liveview-banner liveview-banner--error">
          {sessionError}
        </div>
      )}

      <div className="liveview-columns">
        {/* LEFT COLUMN (25%): Pulse + Session */}
        <div className="liveview-left">
          <div className="liveview-pulse-zone">
            <PulseTimeline
              eventLog={livePulse?.eventLog ?? []}
              participantsCount={effectiveParticipantCount}
            />
          </div>

          <div className="liveview-session-access">
            <div className="liveview-session-access-label">JOIN THIS SESSION</div>
            <QRCodeDisplay accessCode={sessionCode} size={160} />
            <div className="liveview-session-access-code">{sessionCode}</div>
            <div className="liveview-session-access-help">
              Scan QR code or enter code at {window.location.origin}/join
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (75%): Focus + Slides */}
        <div className="liveview-right">
          <div className="liveview-focus-panel">
            <div className="liveview-focus-label">CURRENT FOCUS</div>
            <div className="liveview-focus-text">{focus || "Open Conversation"}</div>
          </div>

          <div className="liveview-slides-panel">
            {hasLocalObsStream ? (
              <video
                ref={slideVideoRef}
                className="liveview-slides-video"
                autoPlay
                playsInline
                muted
              />
            ) : (
              <div className="liveview-slides-placeholder">
                <div className="liveview-slides-title">Slides</div>
                <div className="liveview-slides-status">
                  OBS: {obsCapture.status}
                  {obsCapture.reason ? ` — ${obsCapture.reason}` : ""}
                </div>
                <div className="liveview-slides-subtle">
                  Slides will appear here when LiveView can attach to the trainer&apos;s local capture.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
