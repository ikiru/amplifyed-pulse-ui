/**
 * Session Pipeline (Step 6.3 — Scaffold Only)
 * No state. No socket emits. No behavior.
 * Becomes enabled and migrated fully in Step 7.
 */

export function createSessionPipeline(io) {

  // --------------------------------------------
  // LOCAL SESSION STATE (temporary for Step 7.2)
  // Will be refactored into session.state.js in 7.6
  // --------------------------------------------
  const sessionState = {
    participants: {}
  };

  // ----------------------------------------------------
  // INTERNAL: Standardize participant schema
  // ----------------------------------------------------
  function normalizeParticipant(data) {
    return {
      role: data?.role || "audience",
      name: data?.name || null,
      metadata: data?.metadata || {},
      joinedAt: data?.joinedAt || Date.now(),
      status: "active",
    };
  }

  // ----------------------------------------------------
  // READ-ONLY PARTICIPANT ACCESS
  // Used by Pulse Pipeline for broadcasting
  // ----------------------------------------------------
  function getParticipants() {
    return sessionState.participants;
  }

  function getParticipant(id) {
    return sessionState.participants[id] || null;
  }

  function getAllParticipants() {
    return sessionState.participants;
  }

  function addParticipant(socketId, payload) {
    sessionState.participants[socketId] = normalizeParticipant(payload);
  }

  return {

    // ---------------------------------------------
    // USER LEAVE (Step 7.1 — High-Risk Migration)
    // ---------------------------------------------
    handleLeave({ socketId, pulsePipeline }) {

      // 1. Remove participant from Session (authoritative)
      if (sessionState.participants[socketId]) {
        delete sessionState.participants[socketId];
      }

      // 2. Clean up pulse vote for disconnected user
      if (pulsePipeline?.removeUserPulse) {
        pulsePipeline.removeUserPulse(socketId);
      }

      // 3. Broadcast pulse update with authoritative participants
      if (pulsePipeline?.broadcastPulseUpdate) {
        pulsePipeline.broadcastPulseUpdate(getAllParticipants());
      }
    },

    // ---------------------------------------------------
    // USER JOIN (Step 7.2 — High-Risk Migration)
    // ---------------------------------------------------
    handleJoin({ socketId, payload }) {
      addParticipant(socketId, {
        role: payload?.role || "audience",
        name: payload?.name || null,
        metadata: payload?.metadata || {},
      });

      return {
        status: "ok",
        participant: sessionState.participants[socketId]
      };
    },

    // Client reconnects
    handleReconnect({ socketId, payload }) {
      // placeholder — activation occurs in Step 7
    },

    getParticipants,
    getParticipant,
    getAllParticipants,

  };
}
