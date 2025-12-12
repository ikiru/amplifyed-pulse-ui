// Phase 2.16 — Emotional Aggregation Layer Bootstrap
// Combines raw emotional features without inference or scoring.

export function aggregateEmotionFeatures(features = {}) {
  const allFeatures = Object.values(features).filter(Boolean);

  const hasNegative = allFeatures.some(
    (f) => f.signal && f.signal.includes("negative")
  );

  const hasPositive = allFeatures.some(
    (f) => f.signal && f.signal.includes("positive")
  );

  return {
    hasNegativeSignals: hasNegative,
    hasPositiveSignals: hasPositive,
    signalCount: allFeatures.length,
  };
}
