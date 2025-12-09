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

export function createPulsePipeline(
  io,
  { safetyPipeline, emotionPipeline, sessionPipeline } = {}
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

  function handlePulseSubmit({ userId, value }) {
    // Step 7.3.6 — all pulse math handled by pulseEngine
    const result = pulseEngine?.applyPulseChange?.({ userId, value });

    if (safetyPipeline?.analyzeEvent) {
      safetyPipeline.analyzeEvent({ userId, value });
    }

    if (emotionPipeline?.handlePulse) {
      emotionPipeline.handlePulse({ userId, value });
    }

    // Step 7.3.5 — use broadcast module
    broadcastPulseUpdate(getParticipants?.());

    return result;
  }

  // Make helpers available to other pipelines
  return {
    // Step 7.3.2 — Expose pulse state for other pipelines
    roomState,

    broadcastPulseUpdate,
    handlePulseSubmit,
    handlePulseRevoke,
  };
}
