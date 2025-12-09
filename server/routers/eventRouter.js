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
 */

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
  } = pipelines;

  console.log("[ROUTER] client connected:", socket.id);

  /**
   * --------------------------------------------------
   * AUDIENCE: PULSE
   * --------------------------------------------------
   * Still supported exactly as before. Just routed through
   * the new architecture.
   */
  socket.on("audience:pulse", (payload = {}) => {
    if (!pulsePipeline?.handlePulse) return;

    pulsePipeline.handlePulse({
      socketId: socket.id,
      pulse: payload.pulse,
      timestamp: Date.now(),
    });
  });

  socket.on("audience:message", (payload = {}) => {
    if (messagePipeline?.handleAudienceMessage) {
      messagePipeline.handleAudienceMessage({
        socketId: socket.id,
        text: payload.text,
      });
    }
  });

  // ----------------------------------------------------
  // FOCUS PIPELINE (Step 6.2 — Scaffold Only)
  // No activation of behavior. Pure wiring.
  // ----------------------------------------------------
  socket.on("focus:set", (payload = {}) => {
    if (pipelines.focusPipeline?.handleSetFocus) {
      pipelines.focusPipeline.handleSetFocus({
        socketId: socket.id,
        ...payload,
      });
    }
  });

  socket.on("focus:clear", () => {
    if (pipelines.focusPipeline?.handleClearFocus) {
      pipelines.focusPipeline.handleClearFocus({
        socketId: socket.id,
      });
    }
  });

  // ----------------------------------------------------
  // SESSION JOIN (Step 7.2)
  // Does not alter production behavior until frontend emits.
  // ----------------------------------------------------
  socket.on("session:join", (payload = {}) => {
    if (sessionPipeline?.handleJoin) {
      sessionPipeline.handleJoin({
        socketId: socket.id,
        payload,
      });
    }
  });

  socket.on("session:leave", () => {
    if (sessionPipeline?.handleLeave) {
      sessionPipeline.handleLeave({
        socketId: socket.id,
      });
    }
  });

  socket.on("session:reconnect", (payload = {}) => {
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
    if (messagePipeline?.handleAudienceMessage) {
      messagePipeline.handleAudienceMessage({
        socketId: socket.id,
        ...payload,
      });
    }
  });

  socket.on("message:trainerReply", (payload) => {
    if (messagePipeline?.handleTrainerReply) {
      messagePipeline.handleTrainerReply({
        socketId: socket.id,
        ...payload,
      });
    }
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

  // ----------------------------------------------------
  // TRAINER PIPELINE (Step 6.5 — Scaffold Only)
  // No logic runs yet — activation in Step 7.
  // ----------------------------------------------------
  socket.on("trainer:command", (payload) => {
    if (trainerPipeline?.handleCommand) {
      trainerPipeline.handleCommand({
        socketId: socket.id,
        ...payload,
      });
    }
  });

  socket.on("trainer:nudge", (payload) => {
    if (trainerPipeline?.handleNudge) {
      trainerPipeline.handleNudge({
        socketId: socket.id,
        payload,
      });
    }
  });

  socket.on("trainer:action", (payload = {}) => {
    if (trainerPipeline?.handleTrainerAction) {
      trainerPipeline.handleTrainerAction({
        socketId: socket.id,
        ...payload,
      });
    }
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
