// ------------------------------------------------------------------
// Moment Envelope Builder (Phase 2.3.1)
// ------------------------------------------------------------------
// Owns:
//   Unified structure for trainer-side trendline events.
//   Ensures all pipelines (pulse, safety, emotion, message, trainer)
//   contribute to ONE consistent "moment" packet.
//
// Never:
//   Performs scoring logic.
//   Reads participants.
//   Interacts with session or pulse state.
//
// Pure builder only.
// ------------------------------------------------------------------

export function buildMomentEnvelope({
  pulseValue = null,
  safetyFlag = "none",
  emotionScore = null,
  messageSignal = null,
  trainerSignal = null // Trainer-issued meta event (nudge, slowDown, speedUp, break, checkin)
} = {}) {

  // Ensure valid strings for safety flags
  const normalizedSafety =
    safetyFlag === "softFlag" ? "softFlag" : "none";

  return {
    timestamp: Date.now(),
    pulse: pulseValue ?? null,
    safety: normalizedSafety,
    emotion: emotionScore ?? null,
    message: messageSignal ?? null,
    // ------------------------------------------------------------
    // Trainer Metadata (Phase 2.3.7G)
    // - Represents a *momentary* trainer-issued action
    // - Never long-term state
    // - Never cumulative
    // - Used by InsightLine for meta annotations
    // ------------------------------------------------------------
    trainer: trainerSignal ?? null
  };
}
