/**
 * Emotion Pipeline — Placeholder Scaffold
 * DO NOT MODIFY LOGIC IN THIS PHASE.
 */

// ------------------------------------------------------------
// Phase 3 — Emotional Engine Activation (Placeholder Only)
// ------------------------------------------------------------
// Responsibilities:
//  * Provide deterministic, neutral emotional scoring
//  * Enrich moment envelopes with { emotionScore }
//  * Log activity for debugging
//  * Maintain full reversibility and no side effects
//
// Never:
//  * Reference archived emotional engine
//  * Perform smoothing or inference
//  * Mutate other pipelines
//  * Introduce new UI elements (debug-panel only downstream)
// ------------------------------------------------------------

import { extractors } from "./emotion.featureExtractors.js";
import { aggregateEmotionFeatures } from "./emotion.aggregator.js";
import { normalizeEmotionEnvelope } from "./emotion.normalizer.js";

export function createEmotionPipeline(io, momentPipeline) {
  // Placeholder scoring function
  function evaluateEmotion(envelope) {
    console.log("[Emotion] Placeholder evaluation executed for moment.");

    // Deterministic, reversible, neutral output
    return {
      valence: 0,
      arousal: 0,
      intensity: 0,
      confidence: 1,
    };
  }

  // Public API used by upstream orchestration
  function applyEmotion(envelope) {
    if (!envelope) return envelope;

    const emotionScore = evaluateEmotion(envelope);

    return {
      ...envelope,
      emotionScore,
    };
  }

  function handleMoment(moment) {
    const pulseFeature = extractors.extractPulseEmotionFeature(
      moment?.pulse ?? null
    );

    const rawFeatures = {
      pulse: pulseFeature,
    };

    const aggregate = aggregateEmotionFeatures(rawFeatures);

    const baseEnvelope = {
      ts: moment?.ts ?? Date.now(),
      features: rawFeatures,
      aggregate,
      emotion: null, // scoring arrives Phase 3
    };

    // Phase 2.17 — normalize schema for downstream consumers
    const emotionEnvelope = normalizeEmotionEnvelope(baseEnvelope);

    io.emit("emotion:update", emotionEnvelope);

    return moment;
  }

  return {
    applyEmotion,
    handleMoment,
  };
}
