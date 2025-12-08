// Shared pulse normalization logic

export const clamp01 = (value, fallback = 0.5) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.min(1, Math.max(0, value));
  }
  const parsed = Number(value);
  if (Number.isFinite(parsed)) {
    return Math.min(1, Math.max(0, parsed));
  }
  return fallback;
};

export const EMOTION_DELTAS = {
  clear: { clarity: 2, confusion: -1, engagement: 1, frustration: -1 },
  confused: { clarity: -1, confusion: 2, engagement: 0, frustration: 1 },
  engaged: { clarity: 1, confusion: 0, engagement: 2, frustration: 0 },
  overwhelmed: { clarity: -2, confusion: 1, engagement: -1, frustration: 2 },
  neutral: { clarity: 0, confusion: 0, engagement: 0, frustration: 0 },
  frustrated: { clarity: -2, confusion: 1, engagement: -1, frustration: 3 },
  curious: { clarity: 1, confusion: 0, engagement: 1, frustration: -1 },
  overloaded: { clarity: -1, confusion: 2, engagement: -1, frustration: 1 },
};

export const EMOTION_VECTOR = {
  engaged: [0.85, 0.1, 0.95, 0.05],
  neutral: [0.55, 0.2, 0.5, 0.1],
  frustrated: [0.25, 0.15, 0.3, 0.85],
  curious: [0.75, 0.35, 0.65, 0.15],
  confused: [0.3, 0.85, 0.4, 0.7],
  overloaded: [0.15, 0.65, 0.25, 0.9],
};

export const normalizeEmotionValue = (emotion, fallbackValue) => {
  if (typeof fallbackValue === "number") {
    return clamp01(fallbackValue);
  }
  const delta = EMOTION_DELTAS[emotion];
  if (!delta) return 0.5;
  const level =
    (delta.clarity -
      delta.confusion +
      delta.engagement -
      delta.frustration +
      8) /
    16;
  return clamp01(level);
};
