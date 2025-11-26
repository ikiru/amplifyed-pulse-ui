// src/shared/smoothing.js

// 🚦 Clamp values to safe 0–1 range
export function clamp01(value) {
  if (Number.isNaN(value)) return 0.5;
  return Math.min(1, Math.max(0, value));
}

// 📉 Simple moving average (window = 3–5 recommended)
export function movingAverage(values, window = 3) {
  if (!Array.isArray(values) || values.length === 0) return 0.5;

  const w = Math.min(window, values.length);
  let sum = 0;
  for (let i = values.length - w; i < values.length; i++) {
    sum += values[i];
  }
  return clamp01(sum / w);
}

// 🧪 Exponential smoothing (α = 0.35 recommended)
export function exponentialSmooth(prev, next, alpha = 0.35) {
  if (prev == null) return clamp01(next);
  return clamp01(prev * (1 - alpha) + next * alpha);
}
