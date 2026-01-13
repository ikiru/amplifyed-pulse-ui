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

const DEFAULT_SESSION_ID = "session:default";

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
  } = pipelines;

  const assignSessionId = (requestedSessionId) => {
    const targetSessionId = requestedSessionId ?? DEFAULT_SESSION_ID;

    if (socket.sessionId && socket.sessionId !== targetSessionId) {
      socket.leave(socket.sessionId);
    }

    socket.sessionId = targetSessionId;
    socket.join(targetSessionId);
    if (messagePipeline?.syncSessionState) {
      messagePipeline.syncSessionState(targetSessionId);
    }
    return targetSessionId;
  };

  const syncFocusState = (sessionId) => {
    if (!sessionId || !focusPipeline?.getActiveFocus) {
      return;
    }

    const focusState = focusPipeline.getActiveFocus(sessionId);
    if (!focusState) return;

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

 pulsePipeline.handlePulseSubmit({
  userId: socket.id,
  value: payload.pulse,
});

});


  // ----------------------------------------------------
  // FOCUS PIPELINE (Step 6.2 — Scaffold Only)
  // No activation of behavior. Pure wiring.
  // ----------------------------------------------------
  socket.on("focus:set", (payload = {}) => {
    const currentSessionId = socket.sessionId ?? DEFAULT_SESSION_ID;
    console.log("[8.1] focus:set reached router", payload);
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
    if (focusPipeline?.handleClearFocus) {
      focusPipeline.handleClearFocus({
        socketId: socket.id,
        sessionId: currentSessionId,
      });
    }
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

    // Send success response to client
    socket.emit('session:joined', {
      sessionId,
      accessCode,
      participant,
    });

    console.log("[ROUTER] session:join success:", { socketId: socket.id, sessionId, accessCode });
  });

  socket.on("session:leave", () => {
    if (sessionPipeline?.handleLeave) {
      sessionPipeline.handleLeave({
        socketId: socket.id,
      });
    }
  });

  socket.on("session:reconnect", (payload = {}) => {
    syncFocusState(socket.sessionId);
    if (sessionPipeline?.handleReconnect) {
      sessionPipeline.handleReconnect({
        socketId: socket.id,
        payload,
      });
    }

    if (momentPipeline?.getHistory) {
      const history = momentPipeline.getHistory();
      if (history.length) {
        history.forEach((envelope) => {
          socket.emit("moment:update", envelope);
        });
      }
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
    if (messagePipeline?.handleTrainerReply) {
      messagePipeline.handleTrainerReply({
        socketId: socket.id,
        sessionId: socket.sessionId ?? DEFAULT_SESSION_ID,
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
  });

  socket.on("message.state.update", (payload = {}) => {
    const sessionId =
      payload?.sessionId ?? socket.sessionId ?? DEFAULT_SESSION_ID;
    if (!Array.isArray(payload?.messages)) return;
    io.to(sessionId).emit("message.state.update", {
      ...payload,
      sessionId,
    });
  });

  socket.on("audience:drift:update", (payload = {}) => {
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

  socket.on("trainer:resolve_confusion", (payload = {}) => {
    if (!confusionPipeline?.handleConfusionResolution) {
      return;
    }

    const sessionId = socket.sessionId ?? DEFAULT_SESSION_ID;
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
  // Phase 2.10 Trainer Routes
  // -------------------------------------------
  if (trainerPipeline?.handleTrainerCommand) {
    trainerPipeline.handleTrainerCommand(io, socket);
  }
  if (trainerPipeline?.handleTrainerNudge) {
    trainerPipeline.handleTrainerNudge(io, socket);
  }

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
