// Phase 2.17 — Emotional Envelope Normalization
// Ensures predictable structure for all emotional envelopes.

export function normalizeEmotionEnvelope(env = {}) {
  const ts = env.ts ?? Date.now();

  return {
    schemaVersion: 1,
    ts,

    features: env.features ?? {},

    aggregate: {
      hasNegativeSignals: env.aggregate?.hasNegativeSignals ?? false,
      hasPositiveSignals: env.aggregate?.hasPositiveSignals ?? false,
      signalCount: env.aggregate?.signalCount ?? 0,
    },

    emotion: {
      valence: env.emotion?.valence ?? null,
      arousal: env.emotion?.arousal ?? null,
      intensity: env.emotion?.intensity ?? null,
      confidence: env.emotion?.confidence ?? null,
    },
  };
}
