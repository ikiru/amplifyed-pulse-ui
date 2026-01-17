/**
 * OBS Pipeline (v1)
 *
 * Pixels-only capture authority:
 * - The browser performs getDisplayMedia and owns the MediaStream.
 * - The server owns the single-session state machine + event broadcast.
 *
 * Contract: docs/OBS Pipeline Contract.md
 */

const DEFAULT_STATUS = "idle";

function now() {
  return Date.now();
}

function normalizeStatus(status) {
  const allowed = new Set([
    "idle",
    "requesting_permission",
    "capturing",
    "interrupted",
    "ended",
    "error_already_capturing",
    "error_permission_denied",
    "error_not_supported",
    "error_unknown",
  ]);
  return allowed.has(status) ? status : "error_unknown";
}

export function createObsPipeline(io) {
  // sessionId -> { status, reason, sessionId, activeSessionId, metrics, updatedAt }
  const stateBySession = new Map();

  const getOrInit = (sessionId) => {
    if (!stateBySession.has(sessionId)) {
      stateBySession.set(sessionId, {
        status: DEFAULT_STATUS,
        reason: "Idle.",
        sessionId,
        activeSessionId: null,
        metrics: null,
        updatedAt: now(),
      });
    }
    return stateBySession.get(sessionId);
  };

  const broadcastStatus = (sessionId, next) => {
    io.to(sessionId).emit("obs:status_changed", {
      status: next.status,
      reason: next.reason,
      sessionId,
      metrics: next.metrics ?? null,
      captureSessionId: next.activeSessionId ?? null,
      ts: next.updatedAt,
    });
  };

  const setStatus = (sessionId, status, reason, patch = {}) => {
    const s = getOrInit(sessionId);
    s.status = normalizeStatus(status);
    s.reason = typeof reason === "string" ? reason : s.reason;
    if (Object.prototype.hasOwnProperty.call(patch, "activeSessionId")) {
      s.activeSessionId = patch.activeSessionId ?? null;
    }
    if (Object.prototype.hasOwnProperty.call(patch, "metrics")) {
      s.metrics = patch.metrics ?? null;
    }
    s.updatedAt = now();
    broadcastStatus(sessionId, s);
    return s;
  };

  const clearToIdle = (sessionId, reason = "Idle.") => {
    return setStatus(sessionId, "idle", reason, {
      activeSessionId: null,
      metrics: null,
    });
  };

  return {
    getStatus(sessionId) {
      return getOrInit(sessionId).status;
    },

    getActiveSession(sessionId) {
      const s = getOrInit(sessionId);
      return s.activeSessionId
        ? { id: s.activeSessionId, sessionId, metrics: s.metrics ?? null }
        : null;
    },

    getMetrics(sessionId) {
      return getOrInit(sessionId).metrics ?? null;
    },

    syncState(socket, sessionId) {
      if (!socket || !sessionId) return;
      const s = getOrInit(sessionId);
      socket.emit("obs:status_changed", {
        status: s.status,
        reason: s.reason,
        sessionId,
        metrics: s.metrics ?? null,
        captureSessionId: s.activeSessionId ?? null,
        ts: s.updatedAt,
      });
    },

    handleCaptureRequest({ sessionId, socketId } = {}) {
      if (!sessionId) return;
      const current = getOrInit(sessionId);
      if (current.status === "capturing" && current.activeSessionId) {
        // v1: start while active returns existing session; do not change state.
        broadcastStatus(sessionId, current);
        return;
      }
      setStatus(
        sessionId,
        "requesting_permission",
        "Choose a window or tab to continue.",
        { activeSessionId: null }
      );
      io.to(sessionId).emit("obs:capture:requesting_permission", {
        sessionId,
        socketId: socketId ?? null,
        ts: now(),
      });
    },

    handleCaptureStarted({ sessionId, captureSessionId, metrics, sourceHint, socketId } = {}) {
      if (!sessionId) return;
      const id = typeof captureSessionId === "string" ? captureSessionId : `cap_${now()}`;
      setStatus(sessionId, "capturing", "Capture started.", {
        activeSessionId: id,
        metrics: metrics ?? null,
      });
      io.to(sessionId).emit("obs:capture:started", {
        sessionId,
        captureSessionId: id,
        sourceHint: sourceHint ?? "unknown",
        socketId: socketId ?? null,
        ts: now(),
      });
    },

    handleCaptureStopped({ sessionId, socketId, reason } = {}) {
      if (!sessionId) return;
      setStatus(sessionId, "ended", "Capture stopped.", {});
      io.to(sessionId).emit("obs:capture:stopped", {
        sessionId,
        socketId: socketId ?? null,
        reason: reason ?? "stopped",
        ts: now(),
      });
      // Return to idle after emitting ended.
      clearToIdle(sessionId, "Idle.");
    },

    handleCaptureInterrupted({ sessionId, socketId, reason } = {}) {
      if (!sessionId) return;
      setStatus(
        sessionId,
        "interrupted",
        "Capture was interrupted. Reselect a window or tab to continue.",
        {}
      );
      io.to(sessionId).emit("obs:capture:interrupted", {
        sessionId,
        socketId: socketId ?? null,
        reason: reason ?? "interrupted",
        ts: now(),
      });
    },

    handlePermissionDenied({ sessionId, socketId } = {}) {
      if (!sessionId) return;
      setStatus(
        sessionId,
        "error_permission_denied",
        "Capture was not started. Choose a window or tab to continue.",
        { activeSessionId: null }
      );
      io.to(sessionId).emit("obs:capture:permission_denied", {
        sessionId,
        socketId: socketId ?? null,
        ts: now(),
      });
    },

    handleNotSupported({ sessionId, socketId } = {}) {
      if (!sessionId) return;
      setStatus(
        sessionId,
        "error_not_supported",
        "Capture isn't available in this browser. Use Chrome or Edge.",
        { activeSessionId: null }
      );
      io.to(sessionId).emit("obs:capture:not_supported", {
        sessionId,
        socketId: socketId ?? null,
        ts: now(),
      });
    },

    handleError({ sessionId, socketId } = {}) {
      if (!sessionId) return;
      setStatus(
        sessionId,
        "error_unknown",
        "Capture hit an unexpected error. Try reselecting the source.",
        { activeSessionId: null }
      );
      io.to(sessionId).emit("obs:capture:error", {
        sessionId,
        socketId: socketId ?? null,
        ts: now(),
      });
    },
  };
}

