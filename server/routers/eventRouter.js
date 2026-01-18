/**
 * eventRouter.js
 * --------------------------------------------------
 * Unified event routing system for ALL realtime pipelines.
 *
 * Responsibilities:
 *  - Listen to socket events
 *  - Forward them to the correct pipeline entry function
 *  - Remain pipeline-agnostic (no pulse/emotion/focus imports)
 *
 * Pipelines are injected by the server at startup:
 *
 *    eventRouter(io, {
 *      pulsePipeline,
 *      emotionPipeline,
 *      focusPipeline
 *    });
 *
 * This architecture allows expansion without rewriting handlers.
 * 
 * 
 * 
 * // focus:update arrives as { sessionId, focus } — normalize to Focus object only
 * 
 * // Contract: focus state MUST always be a Focus object { text, focusId, sessionId, ... }

 */

import { applyOffFocusSelfReportGate } from "../pipelines/audienceDrift/classification.state.js";
import { updateDriftForMessage } from "../pipelines/audienceDrift/aggregation.js";
import {
  DEFAULT_FOCUS_ID,
  DEFAULT_FOCUS_TEXT,
  getActiveFocus,
} from "../pipelines/focus/focus.state.js";

const DEFAULT_SESSION_ID = "session:default";
const TRAINER_ROOM_SUFFIX = ":trainers";

function getTrainerRoom(sessionId) {
  return `${sessionId}${TRAINER_ROOM_SUFFIX}`;
}

// ------------------------------------------------------------------
// EventRouter
// Dispatches socket events to pipelines.
// Never: performs business logic, state mutation, or scoring.
// ------------------------------------------------------------------

export default function registerEventRouter(io, socket, pipelines = {}) {
  const {
    pulsePipeline = null,
    emotionPipeline = null,
    focusPipeline = null,
    messagePipeline = null,
    sessionPipeline = null,
    safetyPipeline = null,
    trainerPipeline = null,
    momentPipeline = null, // Added Phase 2.4.2
    confusionPipeline = null,
    obsPipeline = null,
  } = pipelines;

  const isProd = process.env.NODE_ENV === "production";
  // Debug passthrough events are allowed only in non-production by default.
  // You can further disable in dev by setting ALLOW_DEBUG_EMITS=false.
  const allowDebugEmits =
    !isProd && process.env.ALLOW_DEBUG_EMITS !== "false";

  const leaveRoomsForSession = (sessionId) => {
    if (!sessionId) return;
    socket.leave(sessionId);
    socket.leave(getTrainerRoom(sessionId));
  };

  const joinRoomsForSession = (sessionId, { isTrainer = false } = {}) => {
    if (!sessionId) return;
    socket.join(sessionId);
    if (isTrainer) {
      socket.join(getTrainerRoom(sessionId));
    }
  };

  const assignSessionId = (requestedSessionId) => {
    const targetSessionId = requestedSessionId ?? DEFAULT_SESSION_ID;

    if (socket.sessionId && socket.sessionId !== targetSessionId) {
      leaveRoomsForSession(socket.sessionId);
    }

    socket.sessionId = targetSessionId;
    // Join the session room unconditionally; trainer room is joined after
    // role is known (post session:join).
    socket.join(targetSessionId);
    if (messagePipeline?.syncSessionState) {
      messagePipeline.syncSessionState(targetSessionId);
    }
    return targetSessionId;
  };

  const syncFocusState = (sessionId) => {
    if (!sessionId) return;
    if (focusPipeline?.syncFocusState) {
      focusPipeline.syncFocusState(socket, sessionId);
      return;
    }
    if (!focusPipeline?.getActiveFocus) return;

    const focusState = focusPipeline.getActiveFocus(sessionId);
    socket.emit("focus:update", {
      sessionId,
      focus: focusState,
    });
  };

  // Assign socket to default session room (for routing) but don't add as participant yet
  // Participants are only added when they explicitly call session:join with a code
  const sessionId = socket.sessionId ?? DEFAULT_SESSION_ID;
  socket.sessionId = sessionId;
  socket.join(sessionId);
  
  // Sync focus state so UI can show current focus (if any)
  syncFocusState(sessionId);

  console.log("[ROUTER] client connected:", socket.id, "- awaiting explicit join");

  /**
   * --------------------------------------------------
   * AUDIENCE: PULSE
   * --------------------------------------------------
   * Still supported exactly as before. Just routed through
   * the new architecture.
   */
socket.on("audience:pulse", (payload = {}) => {
  console.log("[ROUTER] audience:pulse received:", payload);

  if (!pulsePipeline?.handlePulseSubmit) {
    console.log("[ROUTER] pulsePipeline.handlePulseSubmit MISSING");
    return;
  }

  const sessionId = socket.sessionId ?? DEFAULT_SESSION_ID;
  pulsePipeline.handlePulseSubmit({
    sessionId,
    userId: socket.id,
    value: payload.pulse,
  });

});


  // ----------------------------------------------------
  // FOCUS PIPELINE (Step 6.2 — Scaffold Only)
  // No activation of behavior. Pure wiring.
  // ----------------------------------------------------
  const isTrainerSocket = (sessionId) => {
    if (!sessionPipeline?.getParticipant) return false;
    const participant = sessionPipeline.getParticipant(socket.id, sessionId);
    return participant?.actorRole === "trainer";
  };

  const requireTrainer = (sessionId, action) => {
    if (isTrainerSocket(sessionId)) return true;
    console.warn("[AUTH] denied non-trainer action", {
      action,
      socketId: socket.id,
      sessionId,
    });
    return false;
  };

  socket.on("focus:set", (payload = {}) => {
    const currentSessionId = socket.sessionId ?? DEFAULT_SESSION_ID;
    console.log("[8.1] focus:set reached router", payload);
    if (!requireTrainer(currentSessionId, "focus:set")) return;
    if (focusPipeline?.handleSetFocus) {
      focusPipeline.handleSetFocus({
        io,
        socketId: socket.id,
        sessionId: currentSessionId,
        ...payload,
      });
    }
  });

  socket.on("focus:clear", () => {
    const currentSessionId = socket.sessionId ?? DEFAULT_SESSION_ID;
    if (!requireTrainer(currentSessionId, "focus:clear")) return;
    if (focusPipeline?.handleClearFocus) {
      focusPipeline.handleClearFocus({
        socketId: socket.id,
        sessionId: currentSessionId,
      });
    }
  });

  // Focus Box (trainer-only) events
  socket.on("focus:entry:add", (payload = {}) => {
    const sessionId = socket.sessionId ?? DEFAULT_SESSION_ID;
    if (!requireTrainer(sessionId, "focus:entry:add")) return;
    focusPipeline?.handleAddEntry?.({
      io,
      socketId: socket.id,
      sessionId,
      ...payload,
    });
  });

  socket.on("focus:activate", (payload = {}) => {
    const sessionId = socket.sessionId ?? DEFAULT_SESSION_ID;
    if (!requireTrainer(sessionId, "focus:activate")) return;
    focusPipeline?.handleActivate?.({
      io,
      socketId: socket.id,
      sessionId,
      ...payload,
    });
  });

  socket.on("focus:reset_default", (payload = {}) => {
    const sessionId = socket.sessionId ?? DEFAULT_SESSION_ID;
    if (!requireTrainer(sessionId, "focus:reset_default")) return;
    focusPipeline?.handleResetDefault?.({
      io,
      socketId: socket.id,
      sessionId,
      ...payload,
    });
  });

  socket.on("focus:edit_in_place", (payload = {}) => {
    const sessionId = socket.sessionId ?? DEFAULT_SESSION_ID;
    if (!requireTrainer(sessionId, "focus:edit_in_place")) return;
    focusPipeline?.handleEditInPlace?.({
      io,
      socketId: socket.id,
      sessionId,
      ...payload,
    });
  });

  socket.on("focus:revise_by_new", (payload = {}) => {
    const sessionId = socket.sessionId ?? DEFAULT_SESSION_ID;
    if (!requireTrainer(sessionId, "focus:revise_by_new")) return;
    focusPipeline?.handleReviseByNew?.({
      io,
      socketId: socket.id,
      sessionId,
      ...payload,
    });
  });

  socket.on("focus:reorder", (payload = {}) => {
    const sessionId = socket.sessionId ?? DEFAULT_SESSION_ID;
    if (!requireTrainer(sessionId, "focus:reorder")) return;
    focusPipeline?.handleReorder?.({
      io,
      socketId: socket.id,
      sessionId,
      ...payload,
    });
  });

  // ----------------------------------------------------
  // SESSION JOIN - Enhanced with access code support
  // ----------------------------------------------------
  socket.on("session:join", (payload = {}) => {
    console.log("[ROUTER] session:join received:", { socketId: socket.id, payload });

    if (!sessionPipeline?.handleJoin) {
      console.warn("[ROUTER] sessionPipeline.handleJoin not available");
      return;
    }

    // Call session pipeline to handle join (validates code, adds participant)
    const result = sessionPipeline.handleJoin({
      socketId: socket.id,
      payload,
      pulsePipeline, // Pass pulse pipeline for broadcasting participant count updates
    });

    // Handle error
    if (result.status === 'error') {
      console.warn("[ROUTER] session:join failed:", result.error);
      socket.emit('session:error', {
        error: result.error,
        message: result.message,
      });
      return;
    }

    // Success - assign session and sync state
    const { sessionId, accessCode, participant } = result;
    
    // Assign socket to session room
    assignSessionId(sessionId);
    // Join trainer-only room if applicable
    if (participant?.actorRole === "trainer") {
      joinRoomsForSession(sessionId, { isTrainer: true });
    }

    // NOW broadcast participant count - socket has joined the room and will receive it
    if (sessionPipeline?.broadcastParticipantCount) {
      sessionPipeline.broadcastParticipantCount(sessionId);
    }

    // Sync state from all pipelines
    if (messagePipeline?.syncSessionState) {
      messagePipeline.syncSessionState(sessionId);
    }
    
    syncFocusState(sessionId);
    
    // Sync confusion state (if available)
    if (confusionPipeline?.syncConfusionState) {
      confusionPipeline.syncConfusionState(socket, sessionId);
    }
    
    // Sync pulse state (if available)
    if (pulsePipeline?.syncPulseState) {
      pulsePipeline.syncPulseState(socket, sessionId);
    }

    // Sync OBS state (if available)
    if (obsPipeline?.syncState) {
      obsPipeline.syncState(socket, sessionId);
    }

    // Send success response to client
    socket.emit('session:joined', {
      sessionId,
      accessCode,
      participant,
    });

    console.log("[ROUTER] session:join success:", { socketId: socket.id, sessionId, accessCode });
  });

  socket.on("session:leave", () => {
    const currentSessionId = socket.sessionId ?? DEFAULT_SESSION_ID;
    if (sessionPipeline?.handleLeave) {
      sessionPipeline.handleLeave({
        socketId: socket.id,
      });
    }
    // Ensure the socket stops receiving session-scoped broadcasts.
    leaveRoomsForSession(currentSessionId);
    socket.sessionId = DEFAULT_SESSION_ID;
    joinRoomsForSession(DEFAULT_SESSION_ID, { isTrainer: false });
    syncFocusState(DEFAULT_SESSION_ID);
  });

  socket.on("session:reconnect", (payload = {}) => {
    const sessionId = socket.sessionId ?? DEFAULT_SESSION_ID;
    syncFocusState(sessionId);
    if (sessionPipeline?.handleReconnect) {
      sessionPipeline.handleReconnect({
        socketId: socket.id,
        payload,
      });
    }

    if (momentPipeline?.getHistory) {
      // Trainer-only: insights are never replayed to audience sockets.
      if (requireTrainer(sessionId, "moment:replay")) {
        const history = momentPipeline.getHistory(sessionId);
        if (history.length) {
          history.forEach((envelope) => {
            socket.emit("moment:update", envelope);
          });
        }
      }
    }

    if (obsPipeline?.syncState) {
      obsPipeline.syncState(socket, sessionId);
    }
  });

  // ----------------------------------------------------
  // OBS PIPELINE (Pixels-only capture lifecycle)
  // ----------------------------------------------------
  socket.on("obs:capture:request", (payload = {}) => {
    const sessionId = socket.sessionId ?? DEFAULT_SESSION_ID;
    if (!requireTrainer(sessionId, "obs:capture:request")) return;
    if (obsPipeline?.handleCaptureRequest) {
      obsPipeline.handleCaptureRequest({
        sessionId,
        socketId: socket.id,
        ...payload,
      });
    }
  });

  socket.on("obs:capture:started", (payload = {}) => {
    const sessionId = socket.sessionId ?? DEFAULT_SESSION_ID;
    if (!requireTrainer(sessionId, "obs:capture:started")) return;
    if (obsPipeline?.handleCaptureStarted) {
      obsPipeline.handleCaptureStarted({
        sessionId,
        socketId: socket.id,
        ...payload,
      });
    }
  });

  socket.on("obs:capture:stopped", (payload = {}) => {
    const sessionId = socket.sessionId ?? DEFAULT_SESSION_ID;
    if (!requireTrainer(sessionId, "obs:capture:stopped")) return;
    if (obsPipeline?.handleCaptureStopped) {
      obsPipeline.handleCaptureStopped({
        sessionId,
        socketId: socket.id,
        ...payload,
      });
    }
  });

  socket.on("obs:capture:interrupted", (payload = {}) => {
    const sessionId = socket.sessionId ?? DEFAULT_SESSION_ID;
    if (!requireTrainer(sessionId, "obs:capture:interrupted")) return;
    if (obsPipeline?.handleCaptureInterrupted) {
      obsPipeline.handleCaptureInterrupted({
        sessionId,
        socketId: socket.id,
        ...payload,
      });
    }
  });

  socket.on("obs:capture:permission_denied", (payload = {}) => {
    const sessionId = socket.sessionId ?? DEFAULT_SESSION_ID;
    if (!requireTrainer(sessionId, "obs:capture:permission_denied")) return;
    if (obsPipeline?.handlePermissionDenied) {
      obsPipeline.handlePermissionDenied({
        sessionId,
        socketId: socket.id,
        ...payload,
      });
    }
  });

  socket.on("obs:capture:not_supported", (payload = {}) => {
    const sessionId = socket.sessionId ?? DEFAULT_SESSION_ID;
    if (!requireTrainer(sessionId, "obs:capture:not_supported")) return;
    if (obsPipeline?.handleNotSupported) {
      obsPipeline.handleNotSupported({
        sessionId,
        socketId: socket.id,
        ...payload,
      });
    }
  });

  socket.on("obs:capture:error", (payload = {}) => {
    const sessionId = socket.sessionId ?? DEFAULT_SESSION_ID;
    if (!requireTrainer(sessionId, "obs:capture:error")) return;
    if (obsPipeline?.handleError) {
      obsPipeline.handleError({
        sessionId,
        socketId: socket.id,
        ...payload,
      });
    }
  });

  // ----------------------------------------------------
  // SESSION METADATA REQUEST (for trainer view)
  // ----------------------------------------------------
  socket.on("session:request_metadata", (payload = {}) => {
    const sessionId = socket.sessionId ?? DEFAULT_SESSION_ID;
    
    if (!sessionPipeline?.getAccessCode || !sessionPipeline?.getParticipantCount) {
      return;
    }

    const accessCode = sessionPipeline.getAccessCode(sessionId);
    const participantCount = sessionPipeline.getParticipantCount(sessionId);

    console.log(`[ROUTER] session:request_metadata - ${sessionId} → code: ${accessCode}, participants: ${participantCount}`);

    socket.emit('session:metadata', {
      sessionId,
      accessCode,
      participantCount,
    });
  });

  // ----------------------------------------------------
  // SAFETY PIPELINE (Step 6.4 — Scaffold Only)
  // No logic runs yet — scaffolding only.
  // ----------------------------------------------------
  socket.on("safety:softFlag", (payload = {}) => {
    if (safetyPipeline?.handleSoftFlag) {
      safetyPipeline.handleSoftFlag({
        socketId: socket.id,
        payload,
      });
    }
  });

  socket.on("safety:pattern", (payload = {}) => {
    if (safetyPipeline?.handlePattern) {
      safetyPipeline.handlePattern({
        socketId: socket.id,
        payload,
      });
    }
  });

  // ----------------------------------------------------
  // MESSAGE PIPELINE (Step 6.1 — Scaffold Only)
  // Does NOT activate message pipeline behavior.
  // ----------------------------------------------------
  socket.on("message:audience", (payload) => {
    const eventName = "message:audience";
    console.log("[MESSAGE_ROUTER][RECEIVED]", {
      eventName,
      payload,
    });
    if (messagePipeline?.handleAudienceMessage) {
      messagePipeline.handleAudienceMessage({
        socketId: socket.id,
        sessionId: socket.sessionId ?? DEFAULT_SESSION_ID,
        ...payload,
      });
    }
  });

  socket.on("message:vote:intent", (payload = {}) => {
    const sessionId = socket.sessionId ?? DEFAULT_SESSION_ID;
    if (messagePipeline?.handleVoteIntent) {
      messagePipeline.handleVoteIntent({
        io,
        socket,
        payload: {
          sessionId,
          ...payload,
        },
      });
    }
  });

  socket.on("message:trainerReply", (payload = {}) => {
    const sessionId = socket.sessionId ?? DEFAULT_SESSION_ID;
    if (!requireTrainer(sessionId, "message:trainerReply")) return;
    if (messagePipeline?.handleTrainerReply) {
      messagePipeline.handleTrainerReply({
        socketId: socket.id,
        sessionId,
        ...payload,
      });
    }
  });

  socket.on("self-report:signal", (payload = {}) => {
    const sessionId = socket.sessionId ?? DEFAULT_SESSION_ID;
    applyOffFocusSelfReportGate({
      sessionId,
      messageId: payload?.messageId,
      type: payload?.type,
    });

    const activeFocus = getActiveFocus(sessionId);
    const isDefaultFocus =
      activeFocus?.focusId === DEFAULT_FOCUS_ID ||
      activeFocus?.text === DEFAULT_FOCUS_TEXT;

    if (isDefaultFocus) {
      io.to(sessionId).emit("audience:drift:update", {
        sessionId,
        status: "paused",
        reason: "default_focus",
        timestamp: payload?.ts ?? Date.now(),
      });
      return;
    }

    const score = updateDriftForMessage({
      sessionId,
      messageId: payload?.messageId,
      timestamp: payload?.ts ?? Date.now(),
    });

    if (typeof score === "number") {
      io.to(sessionId).emit("audience:drift:update", {
        sessionId,
        score,
        source: "self_report",
        messageId: payload?.messageId ?? null,
        timestamp: payload?.ts ?? Date.now(),
      });
    }
  });

  socket.on("message.state.update", (payload = {}) => {
    if (!allowDebugEmits) {
      return;
    }
    const sessionId =
      payload?.sessionId ?? socket.sessionId ?? DEFAULT_SESSION_ID;
    if (!Array.isArray(payload?.messages)) return;
    io.to(sessionId).emit("message.state.update", {
      ...payload,
      sessionId,
    });
  });

  socket.on("audience:drift:update", (payload = {}) => {
    if (!allowDebugEmits) {
      return;
    }
    const sessionId =
      payload?.sessionId ?? socket.sessionId ?? DEFAULT_SESSION_ID;
    if (typeof payload?.score !== "number") return;
    io.to(sessionId).emit("audience:drift:update", {
      ...payload,
      sessionId,
      score: payload.score,
    });
  });

  // -------------------------------------------
  // TRAINER ACTION (PHASE 2.10)
  // -------------------------------------------
  socket.on("trainer:action", (payload = {}) => {
    if (!trainerPipeline?.handleTrainerAction) {
      return;
    }
    const sessionId = socket.sessionId ?? DEFAULT_SESSION_ID;
    if (!requireTrainer(sessionId, "trainer:action")) return;

    const action =
      payload.action ??
      payload.actionType ??
      payload.command ??
      "advance";

    trainerPipeline.handleTrainerAction({
      action,
      type: payload.type,
      ts: payload.ts ?? Date.now(),
      socketId: socket.id,
      sessionId,
    });
  });

  /**
   * --------------------------------------------------
   * CONFUSION SIGNAL (Tier-1, Scaffold Only)
   * Accepts normalized confusion signals.
   * No scoring, no broadcast, no mutation outside pipeline.
   * --------------------------------------------------
   */
  socket.on("confusion:signal", (payload = {}) => {
    if (!confusionPipeline?.handleConfusionSignal) {
      return;
    }

    const sessionId = socket.sessionId ?? DEFAULT_SESSION_ID;

    confusionPipeline.handleConfusionSignal({
      sessionId,
      ...payload,
    });
  });

  socket.on("confusion:clear", (payload = {}) => {
    if (!confusionPipeline?.handleConfusionClear) {
      return;
    }

    const sessionId = socket.sessionId ?? DEFAULT_SESSION_ID;

    confusionPipeline.handleConfusionClear({
      sessionId,
      rootMessageId: payload.rootMessageId,
      participantId: socket.id,
      ts: payload.ts ?? Date.now(),
    });
  });

  socket.on("trainer:resolve_confusion", (payload = {}) => {
    if (!confusionPipeline?.handleConfusionResolution) {
      return;
    }

    const sessionId = socket.sessionId ?? DEFAULT_SESSION_ID;
    if (!requireTrainer(sessionId, "trainer:resolve_confusion")) return;
    const { rootMessageId, resolutionType } = payload;
    if (!rootMessageId || !resolutionType) {
      return;
    }

    confusionPipeline.handleConfusionResolution({
      io,
      sessionId,
      rootMessageId,
      resolutionType,
    });
  });

  // ----------------------------------------------------
  // TRAINER SCROLL TO THREAD
  // Broadcasts scroll command to all clients in session (including LiveView)
  // ----------------------------------------------------
  socket.on("trainer:scroll:to:thread", (payload = {}) => {
    const sessionId = socket.sessionId ?? DEFAULT_SESSION_ID;
    if (!requireTrainer(sessionId, "trainer:scroll:to:thread")) return;
    const { rootMessageId } = payload;
    if (!rootMessageId) {
      return;
    }

    // Broadcast to all clients in the session
    io.to(sessionId).emit("trainer:scroll:to:thread", {
      sessionId,
      rootMessageId,
    });
  });

  /**
   * --------------------------------------------------
    * Future event types (emotion, focus, camera, etc.)
   *
   * Example shape (not active yet):
   *
   * socket.on("audience:emotion", (payload) => {
   *   emotionPipeline.handleEmotion({...});
   * });
   */

  // -------------------------------------------
  // Trainer routes (gated)
  // -------------------------------------------
  socket.on("trainer:command", (payload = {}) => {
    const sessionId = socket.sessionId ?? DEFAULT_SESSION_ID;
    if (!requireTrainer(sessionId, "trainer:command")) return;
    trainerPipeline?.handleCommand?.({
      ...payload,
      socketId: socket.id,
      ts: payload.ts ?? Date.now(),
      sessionId,
    });
  });

  socket.on("trainer:nudge", (payload = {}) => {
    const sessionId = socket.sessionId ?? DEFAULT_SESSION_ID;
    if (!requireTrainer(sessionId, "trainer:nudge")) return;
    trainerPipeline?.handleNudge?.({
      ...payload,
      socketId: socket.id,
      ts: payload.ts ?? Date.now(),
      sessionId,
    });
  });

  socket.on("disconnect", () => {
    // -----------------------------------------------
    // Step 7.1 — High-Risk Migration
    // Session Pipeline now owns disconnect behavior.
    // -----------------------------------------------
    if (sessionPipeline?.handleLeave) {
      sessionPipeline.handleLeave({
        socketId: socket.id,
        pulsePipeline,
      });
    }

    if (emotionPipeline?.handleDisconnect) {
      emotionPipeline.handleDisconnect(socket.id);
    }
    if (focusPipeline?.handleDisconnect) {
      focusPipeline.handleDisconnect(socket.id);
    }

    if (messagePipeline?.handleDisconnect) {
      messagePipeline.handleDisconnect(socket.id);
    }

    if (safetyPipeline?.handleDisconnect) {
      safetyPipeline.handleDisconnect(socket.id);
    }

    if (trainerPipeline?.handleDisconnect) {
      trainerPipeline.handleDisconnect(socket.id);
    }

    console.log("[ROUTER] client disconnected:", socket.id);
  });
}
