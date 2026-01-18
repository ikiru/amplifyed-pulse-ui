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
import { smoothEmotionValues } from "./emotion.smoothing.js";
import { computeEmotionScores } from "./emotion.scoring.js";
import { buildEmotionSignalEnvelope } from "./emotion.signalEnvelope.js";

export function createEmotionPipeline(io, momentPipeline) {
  function applyEmotion(momentEnvelope = {}, signals = {}) {
    const scores = computeEmotionScores(momentEnvelope);

    const smoothed = smoothEmotionValues(scores);

    return {
      ...momentEnvelope,
      signals: buildEmotionSignalEnvelope(signals),
      emotion: smoothed,
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
    const normalizedEnvelope = normalizeEmotionEnvelope(baseEnvelope);

    const finalEnvelope = applyEmotion(normalizedEnvelope, rawFeatures);

    const sessionId = moment?.sessionId ?? finalEnvelope?.sessionId ?? null;
    if (sessionId) {
      io.to(`${sessionId}:trainers`).emit("emotion:update", finalEnvelope);
    } else {
      // Backwards-compat: if sessionId is missing, fall back to global emit.
      io.emit("emotion:update", finalEnvelope);
    }

    return moment;
  }

  // ✅ Callable wrapper for pulsePipeline compatibility
  function emotionPipeline(pulseState, momentBuilder) {
    // Phase-safe: do not assume structure, do not mutate upstream state
    // If momentBuilder exists and is callable, build a moment, then handle it.
    if (typeof momentBuilder === "function") {
      const moment = momentBuilder(pulseState);
      handleMoment(moment);
      return moment;
    }

    // If a moment is passed through directly, handle it.
    handleMoment(pulseState);
    return pulseState;
  }

  // Keep method access for debugging / direct calls
  emotionPipeline.applyEmotion = applyEmotion;
  emotionPipeline.handleMoment = handleMoment;

  return emotionPipeline;
}
