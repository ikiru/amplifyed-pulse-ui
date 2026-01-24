import { handleSetFocus as runHandleSetFocus } from "./focus.handleSet.js";
import { handleClearFocus as runHandleClearFocus } from "./focus.handleClear.js";
import {
  DEFAULT_FOCUS_ID,
  addFocusEntry,
  activateFocusById,
  editFocusInPlace,
  getActiveFocus,
  getFocusState,
  reorderFocusEntries,
  resetFocusToDefault,
  reviseFocusByNew,
  initializeFromSnapshot,
} from "./focus.state.js";
import * as SessionState from "../session/session.state.js";
import { broadcastFocus } from "./focus.broadcast.js";

export function registerFocusHandlers({ io, sessionPipeline } = {}) {
  /**
   * Check if session is LIVE (server-side guard)
   * 
   * @param {string} sessionId - Session identifier
   * @returns {boolean} True if session is LIVE
   */
  function isSessionLive(sessionId) {
    if (!sessionId) return false;
    const sessionState = SessionState.getSessionState(sessionId);
    return sessionState === 'LIVE';
  }

  function getTrainerSocketIds(sessionId) {
    const participants = sessionPipeline?.getParticipants?.(sessionId) ?? {};
    return Object.entries(participants)
      .filter(([, p]) => p?.actorRole === "trainer")
      .map(([socketId]) => socketId);
  }

  function emitToTrainers(sessionId, event, payload) {
    const trainerSocketIds = getTrainerSocketIds(sessionId);
    trainerSocketIds.forEach((socketId) => {
      io.to(socketId).emit(event, payload);
    });
  }

  function broadcastTrainerState(sessionId) {
    const state = getFocusState(sessionId);
    const activeFocus = getActiveFocus(sessionId);
    emitToTrainers(sessionId, "focus:trainer:state", {
      sessionId,
      entries: state.entries,
      activeFocusId: state.activeFocusId,
      activeFocus,
      defaultFocusId: DEFAULT_FOCUS_ID,
    });
  }

  function handleSetFocus(payload = {}) {
    return runHandleSetFocus({
      io,
      ...payload,
    });
  }

  function handleClearFocus(payload = {}) {
    return runHandleClearFocus({
      io,
      ...payload,
    });
  }

  function handleAddEntry(payload = {}) {
    const { sessionId, text } = payload;
    if (!sessionId) return;

    // Server-side guard: reject if LIVE
    if (isSessionLive(sessionId)) {
      console.warn(`[focusPipeline] Rejected focus:add: Session ${sessionId} is LIVE`);
      // Emit error to trainers only
      emitToTrainers(sessionId, "focus:write:rejected", {
        sessionId,
        reason: "SESSION_IS_LIVE",
        message: "Cannot add focus entry: Session is Live",
      });
      return;
    }

    addFocusEntry(sessionId, { text, authorRole: "trainer" });
    io.to(sessionId).emit("session:event", {
      type: "focus:entry_added",
      sessionId,
      timestamp: Date.now(),
    });
    broadcastTrainerState(sessionId);
  }

  function handleActivate(payload = {}) {
    const { sessionId, focusId } = payload;
    if (!sessionId || !focusId) return;
    activateFocusById(sessionId, focusId, { authorRole: "trainer" });
    const active = getActiveFocus(sessionId);
    io.to(sessionId).emit("session:event", {
      type: "focus:activated",
      sessionId,
      timestamp: Date.now(),
      focusId,
    });
    if (active) broadcastFocus(io, sessionId, active);
    broadcastTrainerState(sessionId);
  }

  function handleResetDefault(payload = {}) {
    const { sessionId } = payload;
    if (!sessionId) return;
    resetFocusToDefault(sessionId);
    const active = getActiveFocus(sessionId);
    io.to(sessionId).emit("session:event", {
      type: "focus:reset_default",
      sessionId,
      timestamp: Date.now(),
      focusId: DEFAULT_FOCUS_ID,
    });
    if (active) broadcastFocus(io, sessionId, active);
    broadcastTrainerState(sessionId);
  }

  function handleEditInPlace(payload = {}) {
    const { sessionId, focusId, text } = payload;
    if (!sessionId || !focusId) return;

    // Server-side guard: reject if LIVE
    if (isSessionLive(sessionId)) {
      console.warn(`[focusPipeline] Rejected focus:edit: Session ${sessionId} is LIVE`);
      emitToTrainers(sessionId, "focus:write:rejected", {
        sessionId,
        reason: "SESSION_IS_LIVE",
        message: "Cannot edit focus entry: Session is Live",
      });
      return;
    }

    editFocusInPlace(sessionId, focusId, { text });
    const active = getActiveFocus(sessionId);
    io.to(sessionId).emit("session:event", {
      type: "focus:edit_in_place",
      sessionId,
      timestamp: Date.now(),
      focusId,
    });
    // If the active focus was edited, audience must see the change.
    if (active?.focusId === focusId) {
      broadcastFocus(io, sessionId, active);
    }
    broadcastTrainerState(sessionId);
  }

  function handleReviseByNew(payload = {}) {
    const { sessionId, focusId, text } = payload;
    if (!sessionId) return;

    // Server-side guard: reject if LIVE
    if (isSessionLive(sessionId)) {
      console.warn(`[focusPipeline] Rejected focus:revise: Session ${sessionId} is LIVE`);
      emitToTrainers(sessionId, "focus:write:rejected", {
        sessionId,
        reason: "SESSION_IS_LIVE",
        message: "Cannot revise focus entry: Session is Live",
      });
      return;
    }

    reviseFocusByNew(sessionId, focusId, { text, authorRole: "trainer" });
    io.to(sessionId).emit("session:event", {
      type: "focus:revise_by_new",
      sessionId,
      timestamp: Date.now(),
      focusId,
    });
    broadcastTrainerState(sessionId);
  }

  function handleReorder(payload = {}) {
    const { sessionId, orderedFocusIds } = payload;
    if (!sessionId) return;

    // Server-side guard: reject if LIVE
    if (isSessionLive(sessionId)) {
      console.warn(`[focusPipeline] Rejected focus:reorder: Session ${sessionId} is LIVE`);
      emitToTrainers(sessionId, "focus:write:rejected", {
        sessionId,
        reason: "SESSION_IS_LIVE",
        message: "Cannot reorder focus entries: Session is Live",
      });
      return;
    }

    reorderFocusEntries(sessionId, orderedFocusIds);
    io.to(sessionId).emit("session:event", {
      type: "focus:reordered",
      sessionId,
      timestamp: Date.now(),
    });
    broadcastTrainerState(sessionId);
  }

  /**
   * Sync focus state to a specific socket (for join/rejoin)
   * 
   * @param {Object} socket - Socket.IO socket instance
   * @param {string} sessionId - Session identifier
   */
  function syncFocusState(socket, sessionId) {
    if (!socket || !sessionId) {
      return;
    }

    const focusState = getActiveFocus(sessionId);
    socket.emit("focus:update", {
      sessionId,
      focus: focusState,
    });

    // Trainer-only full state (if role known)
    const participant = sessionPipeline?.getParticipant?.(socket.id, sessionId);
    if (participant?.actorRole === "trainer") {
      const state = getFocusState(sessionId);
      socket.emit("focus:trainer:state", {
        sessionId,
        entries: state.entries,
        activeFocusId: state.activeFocusId,
        activeFocus: focusState,
        defaultFocusId: DEFAULT_FOCUS_ID,
      });
    }
  }

  return {
    handleSetFocus,
    handleClearFocus,
    handleAddEntry,
    handleActivate,
    handleResetDefault,
    handleEditInPlace,
    handleReviseByNew,
    handleReorder,
    getActiveFocus,
    syncFocusState,
    getFocusState,
    initializeFromSnapshot, // Export for session pipeline orchestrator
  };
}
