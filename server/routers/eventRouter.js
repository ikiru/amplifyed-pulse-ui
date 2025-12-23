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

import { handleTrainerCommand } from "../pipelines/trainer/trainer.handleCommand.js";
import { handleTrainerNudge } from "../pipelines/trainer/trainer.handleNudge.js";
import { handleVoteIntent } from "../pipelines/message/message.vote.handle.js";

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

  const sessionId = assignSessionId(socket.sessionId ?? DEFAULT_SESSION_ID);
  sessionPipeline?.handleJoin({
    socketId: socket.id,
    payload: {},
  });
  syncFocusState(sessionId);

  console.log("[ROUTER] client connected:", socket.id);

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
  // SESSION JOIN (Step 7.2)
  // Does not alter production behavior until frontend emits.
  // ----------------------------------------------------
  socket.on("session:join", (payload = {}) => {
    const nextSessionId = assignSessionId(
      payload?.sessionId ?? socket.sessionId ?? DEFAULT_SESSION_ID
    );
    syncFocusState(nextSessionId);

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
        sessionId: socket.sessionId ?? DEFAULT_SESSION_ID,
        ...payload,
      });
    }
  });

  socket.on("message:vote:intent", (payload = {}) => {
    const sessionId = socket.sessionId ?? DEFAULT_SESSION_ID;
    handleVoteIntent({
      io,
      socket,
      payload: {
        sessionId,
        ...payload,
      },
    });
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
  handleTrainerCommand(io, socket);
  handleTrainerNudge(io, socket);

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
