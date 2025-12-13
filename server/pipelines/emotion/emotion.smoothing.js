/**
 * Phase 3.2 — Bounded Emotional Smoothing
 * Pure function. No state. No inference.
 */

export function isStableEmotion(window, emotionValue) {
  if (!Array.isArray(window) || window.length === 0) return false;

  return window.every(
    (entry) =>
      entry &&
      entry.emotion &&
      entry.emotion.value === emotionValue
  );
}

export function smoothEmotionValues(
  current = {},
  previous = null,
  alpha = 0.7
) {
  if (!previous) {
    return normalize(current);
  }

  return {
    valence: blend(current.valence, previous.valence, alpha, -1, 1),
    arousal: blend(current.arousal, previous.arousal, alpha, 0, 1),
    intensity: blend(current.intensity, previous.intensity, alpha, 0, 1),
    confidence: blend(current.confidence, previous.confidence, alpha, 0, 1),
  };
}

function blend(current, previous, alpha, min, max) {
  const c = typeof current === "number" ? current : 0;
  const p = typeof previous === "number" ? previous : c;

  const blended = alpha * c + (1 - alpha) * p;
  return clamp(blended, min, max);
}

function normalize(values = {}) {
  return {
    valence: clamp(values.valence ?? 0, -1, 1),
    arousal: clamp(values.arousal ?? 0, 0, 1),
    intensity: clamp(values.intensity ?? 0, 0, 1),
    confidence: clamp(values.confidence ?? 0, 0, 1),
  };
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
