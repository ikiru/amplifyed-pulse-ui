// Phase 3.2 — Deterministic Emotional Scoring
// Pure function: no side effects, no history, no inference

export function computeEmotionScores(momentEnvelope = {}) {
  const { emotionSignals = {} } = momentEnvelope;
  const { pulse, message, trainer } = emotionSignals;

  // --- Pulse contribution (primary) ---
  const pulseValence =
    typeof pulse?.valence === "number" ? pulse.valence : 0;

  const pulseArousal =
    typeof pulse?.arousal === "number" ? pulse.arousal : 0;

  // --- Message contribution (secondary) ---
  const messageIntensity =
    typeof message?.intensity === "number" ? message.intensity : 0;

  // --- Trainer contribution (confidence only) ---
  const trainerPresent = trainer ? 1 : 0;

  // --- Aggregate deterministically ---
  const valence = clamp(pulseValence, -1, 1);

  const arousal = clamp(
    0.7 * pulseArousal + 0.3 * messageIntensity,
    0,
    1
  );

  const intensity = clamp(
    0.6 * Math.abs(pulseValence) + 0.4 * messageIntensity,
    0,
    1
  );

  const confidence = clamp(
    0.5 +
      0.25 * (pulse ? 1 : 0) +
      0.15 * (message ? 1 : 0) +
      0.1 * trainerPresent,
    0,
    1
  );

  return {
    valence,
    arousal,
    intensity,
    confidence,
  };
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
