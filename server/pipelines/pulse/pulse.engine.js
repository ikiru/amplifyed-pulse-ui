/**
 * Pulse Engine (Step 7.3.3 — Scaffold Only)
 *
 * This module will house all scoring and pulse-processing
 * logic in later steps:
 *
 *  - vote mapping (+1 / 0 / -1)
 *  - pulse delta calculation
 *  - sentiment scoring
 *  - future aggregation/compression logic
 *  - hooks for Safety + Emotion engines
 *
 * In this step, we only set up the skeleton.
 */

export function createPulseEngine(pulseState) {

  // ----------------------------------------------------
  // Placeholder calculation methods (will be migrated in
  // Step 7.3.4 and 7.3.5). They currently do nothing.
  // ----------------------------------------------------

  // ----------------------------------------------------
  // Map pulse values to numeric scoring
  // ----------------------------------------------------
  function computePulseDelta(value) {
    switch (value) {
      case "engaged":
        return 1;
      case "neutral":
        return 0;
      case "frustrated":
        return -1;
      default:
        return 0;
    }
  }

  // ----------------------------------------------------
  // Apply the pulse to state (no broadcast here)
  // ----------------------------------------------------
  function applyPulseChange({ sessionId, userId, value }) {
    // Write vote into real pulse state
    pulseState.setVote(sessionId, userId, value);

    // Append to event log
    pulseState.addEventLog(sessionId, {
      userId,
      value,
      ts: Date.now(),
    });

    return { userId, value };
  }

  // ----------------------------------------------------
  // Step 7.3.3 — Expose engine API
  // Enables pulsePipeline.handlePulseSubmit to call applyPulseChange
  // ----------------------------------------------------
  return { applyPulseChange };
}
