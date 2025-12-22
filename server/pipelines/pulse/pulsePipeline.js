/**
 * Pulse Pipeline — Placeholder Scaffold
 * Handles +1 / 0 / -1 pulses and broadcast operations.
 * No logic implemented yet.
 */

// ------------------------------------------------------------------
// Pulse Pipeline
// Owns: votes, eventLog, pulse scoring
// Reads: participants (SessionPipeline) — READ ONLY
// Never: modifies participants or session state
// ------------------------------------------------------------------

import { createPulseState } from "./pulse.state.js";
import { createPulseEngine } from "./pulse.engine.js";
import { createPulseBroadcast } from "./pulse.broadcast.js";

// Phase 2.3.1 – unified moment builder
import { buildMomentEnvelope } from "../moment/moment.envelope.js";

// Phase 2.3.2 — multi-signal builder logic
import { createMomentBuilder } from "../moment/moment.builder.js";

export function createPulsePipeline(
  io,
  { safetyPipeline, emotionPipeline, sessionPipeline, momentPipeline } = {}
) {
  // Step 7.3.1 — Prepare Pulse State Module
  const pulseState = createPulseState?.();

  // Step 7.3.5 — Prepare Broadcast Module
  const pulseBroadcast = createPulseBroadcast?.(io, pulseState);
  const broadcastPulseUpdate = pulseBroadcast?.broadcastPulseUpdate;

  // Step 7.3.3 — Prepare Pulse Engine
  const pulseEngine = createPulseEngine?.(pulseState);

  // Step 7.3.2 — Centralize pulse state
  const { state: roomState } = pulseState;

  // Phase 2.3.3 — Initialize the Moment Builder
  const momentBuilder = createMomentBuilder(momentPipeline?.addMoment);

  // Phase 2.3.4 — Safety can attach to the moment builder OR remain the old pipeline object
  const safety =
    typeof safetyPipeline === "function"
      ? safetyPipeline(momentBuilder)
      : safetyPipeline;

  // Phase 2.3.5 — Emotion now may interact with the moment builder as well
  const emotion = emotionPipeline
    ? emotionPipeline(pulseState, momentBuilder)
    : null;

  // Step 7.4.2 — Get participants from Session Pipeline
  const getParticipants = sessionPipeline?.getAllParticipants;

  // ----------------------------------------------------
  // NEW HELPERS FOR SESSION PIPELINE (Step 7.1)
  // ----------------------------------------------------

  function handlePulseRevoke({ userId }) {
    // Step 7.3.6 — final orchestration form
    pulseState.clearVote(userId);

    broadcastPulseUpdate(getParticipants?.());
  }

  function handlePulseSubmit({ userId, value, payload }) {
    // Normalize userId (router always sends socket.id)
    if (!userId && payload?.socketId) {
      userId = payload.socketId;
    }
    if (!userId) {
      console.warn("[PIPELINE] Missing userId. Pulse ignored.");
      return;
    }

    const previousVote = roomState.votes[userId];
    if (previousVote === value) {
      console.log("[PIPELINE] Ignoring duplicate pulse value:", {
        userId,
        value,
        previousVote,
      });
      return { userId, value, skipped: true };
    }

    console.log("[PIPELINE] handlePulseSubmit fired:", {
      userId,
      value,
      timestamp: Date.now(),
    });

    // Step 7.3.6 — all pulse math handled by pulseEngine
    const result = pulseEngine.applyPulseChange({ userId, value });

    if (safety?.analyzeEvent) {
      safety.analyzeEvent({ userId, value });
    }

    if (emotion?.handlePulse) {
      emotion.handlePulse({ userId, value });
    }

    // 2. Begin a new Multi-Signal moment (Pulse contributes first)
    momentBuilder?.beginMoment({ pulseValue: value });

    // 4. Finalize the Multi-Signal moment (dispatch happens in builder)
    momentBuilder?.finalize();

    // Step 7.3.5 — use broadcast module
    const participants = getParticipants?.();
    console.log("[BROADCAST] pulse:update ->", {
      participants,
      votes: roomState.votes,
      eventLog: roomState.eventLog,
    });
    broadcastPulseUpdate(participants);

    return result;
  }

  // Make helpers available to other pipelines
  return {
    roomState,
    momentBuilder,
    broadcastPulseUpdate,
    handlePulseSubmit,
    handlePulseRevoke,
  };
}
