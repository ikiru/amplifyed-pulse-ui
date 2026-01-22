/**
 * Slide Control Pipeline (v1)
 *
 * Contract: docs/SLIDE CONTROL PIPELINE CONTRACT (v1)
 * v1 local-channel: TrainerView talks to Local Agent on localhost; this pipeline
 * validates, logs, and broadcasts slide:ack, slide:state, slide:agent_status.
 */

const TRAINER_ROOM_SUFFIX = ":trainers";

function getTrainerRoom(sessionId) {
  return `${sessionId}${TRAINER_ROOM_SUFFIX}`;
}

function now() {
  return Date.now();
}

export function createSlideControlPipeline(io) {
  // sessionId -> { lastAck, lastResult, lastCommandId, agentStatus, bindingId?, boundTargetLabel?, updatedAt }
  const stateBySession = new Map();

  const getOrInit = (sessionId) => {
    if (!stateBySession.has(sessionId)) {
      stateBySession.set(sessionId, {
        lastAck: null,
        lastResult: null,
        lastCommandId: null,
        agentStatus: "disconnected",
        bindingId: null,
        boundTargetLabel: null,
        updatedAt: now(),
      });
    }
    return stateBySession.get(sessionId);
  };

  const broadcastToTrainers = (sessionId, event, payload) => {
    io.to(getTrainerRoom(sessionId)).emit(event, { ...payload, sessionId, ts: now() });
  };

  return {
    handleCommand({ sessionId, socketId, ...payload } = {}) {
      if (!sessionId) return;
      getOrInit(sessionId);
      console.log("[slideControl] slide:command", { sessionId, socketId, commandId: payload?.commandId, type: payload?.type });
    },

    handleAck({ sessionId, socketId, ack, commandId, reason, bindingId, boundTargetLabel } = {}) {
      if (!sessionId) return;
      const s = getOrInit(sessionId);
      s.lastAck = ack ?? null;
      s.lastResult = reason != null ? { ack, reason } : { ack };
      s.lastCommandId = commandId ?? null;
      if (bindingId !== undefined) s.bindingId = bindingId ?? null;
      if (boundTargetLabel !== undefined) s.boundTargetLabel = boundTargetLabel ?? null;
      s.updatedAt = now();

      broadcastToTrainers(sessionId, "slide:ack", {
        ack: s.lastAck,
        commandId: s.lastCommandId,
        reason: s.lastResult?.reason,
      });
      broadcastToTrainers(sessionId, "slide:state", {
        lastAck: s.lastAck,
        lastResult: s.lastResult,
        lastCommandId: s.lastCommandId,
        bindingId: s.bindingId,
        boundTargetLabel: s.boundTargetLabel,
      });
      console.log("[slideControl] slide:ack", { sessionId, ack: s.lastAck, commandId: s.lastCommandId });
    },

    handleAgentStatus({ sessionId, socketId, agentStatus, bindingId, boundTargetLabel } = {}) {
      if (!sessionId) return;
      const s = getOrInit(sessionId);
      if (agentStatus != null) s.agentStatus = agentStatus;
      if (bindingId !== undefined) s.bindingId = bindingId ?? null;
      if (boundTargetLabel !== undefined) s.boundTargetLabel = boundTargetLabel ?? null;
      s.updatedAt = now();

      broadcastToTrainers(sessionId, "slide:agent_status", {
        agentStatus: s.agentStatus,
        bindingId: s.bindingId,
        boundTargetLabel: s.boundTargetLabel,
      });
      console.log("[slideControl] slide:agent_status", { sessionId, agentStatus: s.agentStatus });
    },

    handleBindList({ sessionId, socketId } = {}) {
      if (!sessionId) return;
      console.log("[slideControl] slide:bind:list", { sessionId, socketId });
    },

    handleBindSelect({ sessionId, socketId, targetId } = {}) {
      if (!sessionId) return;
      console.log("[slideControl] slide:bind:select", { sessionId, socketId, targetId });
    },

    handleBindUnbind({ sessionId, socketId } = {}) {
      if (!sessionId) return;
      console.log("[slideControl] slide:bind:unbind", { sessionId, socketId });
    },

    handleBindRebind({ sessionId, socketId } = {}) {
      if (!sessionId) return;
      console.log("[slideControl] slide:bind:rebind", { sessionId, socketId });
    },

    syncState(socket, sessionId) {
      if (!socket || !sessionId) return;
      const s = getOrInit(sessionId);
      socket.emit("slide:state", {
        sessionId,
        lastAck: s.lastAck,
        lastResult: s.lastResult,
        lastCommandId: s.lastCommandId,
        bindingId: s.bindingId,
        boundTargetLabel: s.boundTargetLabel,
        ts: s.updatedAt,
      });
      socket.emit("slide:agent_status", {
        sessionId,
        agentStatus: s.agentStatus,
        bindingId: s.bindingId,
        boundTargetLabel: s.boundTargetLabel,
        ts: s.updatedAt,
      });
    },
  };
}
