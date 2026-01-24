/**
 * Amplify Stage Engine Pipeline (v1)
 *
 * The default Stage Executor for AmplifyEd.
 * Responsibilities:
 * - Manage Stage Executor status (Ready/Warning/Blocked)
 * - Track Media Cue execution state (Playing/Stopped)
 * - Track Screen Capture state (for slides/demo)
 * - Coordinate Slide Control actions
 *
 * Contract: docs/AMPLIFY_STAGE_ENGINE_CONTRACT.md
 */

const DEFAULT_STATUS = "idle";

function now() {
  return Date.now();
}

function normalizeStatus(status) {
  const allowed = new Set([
    "idle",
    "ready",
    "warning",
    "blocked",
    "capturing", // specialized ready state
    "requesting_permission",
    "error",
  ]);
  return allowed.has(status) ? status : "error";
}

export function createStageEnginePipeline(io) {
  // sessionId -> State
  const stateBySession = new Map();

  const getOrInit = (sessionId) => {
    if (!stateBySession.has(sessionId)) {
      stateBySession.set(sessionId, {
        status: DEFAULT_STATUS, // Overall executor status
        reasons: [],
        sessionId,
        
        // Sub-states
        capture: {
          status: "idle",
          activeSessionId: null,
          metrics: null,
          sourceHint: null,
          updatedAt: now(),
        },
        
        media: {
          status: "stopped", // stopped | playing
          currentCueId: null,
          startedAt: null,
        },

        updatedAt: now(),
      });
    }
    return stateBySession.get(sessionId);
  };

  const broadcastStatus = (sessionId, state) => {
    io.to(sessionId).emit("stage:executor:status", {
      status: state.status,
      reasons: state.reasons,
      capture: state.capture,
      media: state.media,
      ts: state.updatedAt,
    });
  };

  const updateState = (sessionId, updater) => {
    const s = getOrInit(sessionId);
    updater(s);
    s.updatedAt = now();
    broadcastStatus(sessionId, s);
    return s;
  };

  return {
    getStatus(sessionId) {
      const s = getOrInit(sessionId);
      // Logic to derive overall status from sub-states
      if (s.capture.status === "capturing" || s.media.status === "playing") {
        return "active";
      }
      return s.status;
    },

    syncState(socket, sessionId) {
      if (!socket || !sessionId) return;
      const s = getOrInit(sessionId);
      socket.emit("stage:executor:status", {
        status: s.status,
        reasons: s.reasons,
        capture: s.capture,
        media: s.media,
        ts: s.updatedAt,
      });
    },

    // --- Capture Lifecycle (Screen Share/Slides) ---

    handleCaptureRequest({ sessionId, socketId } = {}) {
      if (!sessionId) return;
      updateState(sessionId, (s) => {
        s.capture.status = "requesting_permission";
        s.status = "ready"; // implicity ready if we are requesting
      });
      
      io.to(sessionId).emit("stage:capture:requesting_permission", {
        sessionId,
        socketId: socketId ?? null,
        ts: now(),
      });
    },

    handleCaptureStarted({ sessionId, captureSessionId, metrics, sourceHint, socketId } = {}) {
      if (!sessionId) return;
      const id = typeof captureSessionId === "string" ? captureSessionId : `cap_${now()}`;
      
      updateState(sessionId, (s) => {
        s.capture.status = "capturing";
        s.capture.activeSessionId = id;
        s.capture.metrics = metrics ?? null;
        s.capture.sourceHint = sourceHint ?? "unknown";
        s.status = "ready";
      });

      io.to(sessionId).emit("stage:capture:started", {
        sessionId,
        captureSessionId: id,
        sourceHint: sourceHint ?? "unknown",
        socketId: socketId ?? null,
        ts: now(),
      });
    },

    handleCaptureStopped({ sessionId, socketId, reason } = {}) {
      if (!sessionId) return;
      updateState(sessionId, (s) => {
        s.capture.status = "idle";
        s.capture.activeSessionId = null;
        s.capture.metrics = null;
      });

      io.to(sessionId).emit("stage:capture:stopped", {
        sessionId,
        socketId: socketId ?? null,
        reason: reason ?? "stopped",
        ts: now(),
      });
    },

    handleCaptureError({ sessionId, socketId, error } = {}) {
      if (!sessionId) return;
      updateState(sessionId, (s) => {
        s.capture.status = "error";
      });
      
      io.to(sessionId).emit("stage:capture:error", {
        sessionId,
        error: error || "Unknown capture error",
        ts: now(),
      });
    },

    // --- Media Cue Execution ---

    handleMediaPlay({ sessionId, cueId } = {}) {
      if (!sessionId || !cueId) return;
      updateState(sessionId, (s) => {
        s.media.status = "playing";
        s.media.currentCueId = cueId;
        s.media.startedAt = now();
      });
      
      io.to(sessionId).emit("stage:media:playing", {
        sessionId,
        cueId,
        ts: now(),
      });
    },

    handleMediaStop({ sessionId } = {}) {
      if (!sessionId) return;
      updateState(sessionId, (s) => {
        s.media.status = "stopped";
        s.media.currentCueId = null;
        s.media.startedAt = null;
      });
      
      io.to(sessionId).emit("stage:media:stopped", {
        sessionId,
        ts: now(),
      });
    },
  };
}
