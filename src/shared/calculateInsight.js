// src/shared/calculateInsight.js

// Takes 4 pulse channels and converts into 1 Insight score
export function calculateInsight([engagement, confusion, alignment, friction]) {
  if (
    engagement == null ||
    confusion == null ||
    alignment == null ||
    friction == null
  ) {
    return 0;
  }

  // Normalize: confusion + friction should invert
  const c = 1 - confusion; 
  const f = 1 - friction;

  const raw = (engagement + c + alignment + f) / 4;

  // Clamp 0–1
  return Math.min(1, Math.max(0, raw));
}

