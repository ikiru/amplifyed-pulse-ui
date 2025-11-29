// s../utils/smoothing.js

const toFiniteNumber = (value, fallback = 0.5) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

// 🚦 Clamp values to safe 0–1 range
export function clamp01(value) {
  const parsed = toFiniteNumber(value, 0.5);
  return Math.min(1, Math.max(0, parsed));
}

// 📉 Simple moving average (window = 3–5 recommended)
export function movingAverage(values, window = 3) {
  if (!Array.isArray(values) || values.length === 0) return 0.5;

  const w = Math.min(window, values.length);
  let sum = 0;
  for (let i = values.length - w; i < values.length; i++) {
    sum += toFiniteNumber(values[i], 0.5);
  }
  return clamp01(sum / w);
}

// 🧪 Exponential smoothing (α = 0.35 recommended)
export function exponentialSmooth(prev, next, alpha = 0.35) {
  const normalizedPrev =
    prev == null ? null : toFiniteNumber(prev, toFiniteNumber(next, 0.5));
  const normalizedNext = toFiniteNumber(next, normalizedPrev ?? 0.5);
  const weight = clamp01(alpha);

  if (normalizedPrev == null) {
    return clamp01(normalizedNext);
  }

  return clamp01(normalizedPrev * (1 - weight) + normalizedNext * weight);
}

// ↗️ Signed drift between the newest and oldest value within a window
export function valueDrift(values = []) {
  if (!Array.isArray(values) || values.length < 2) return 0;
  const first = clamp01(values[0]);
  const last = clamp01(values[values.length - 1]);
  const delta = last - first;
  return Math.max(-1, Math.min(1, delta));
}

// ⚖️ Normalized variance within a bounded 0–1 signal
export function valueVariance(values = []) {
  if (!Array.isArray(values) || values.length < 2) return 0;
  const normalized = values.map((v) => clamp01(v));
  const mean =
    normalized.reduce((sum, value) => sum + value, 0) / normalized.length;
  const variance =
    normalized.reduce((sum, value) => sum + (value - mean) ** 2, 0) /
    normalized.length;
  // Theoretical max variance for [0,1] range is 0.25, use it for normalization.
  return clamp01(variance / 0.25);
}

// 📡 Rough density estimate: pulses per second compared against a ceiling
export function pulseDensity(events = [], windowMs = 3000, ceiling = 4) {
  if (!Array.isArray(events) || events.length === 0) return 0;
  const seconds = windowMs > 0 ? windowMs / 1000 : 1;
  if (seconds <= 0) return 0;
  const perSecond = events.length / seconds;
  const safeCeiling = ceiling > 0 ? ceiling : 4;
  return clamp01(perSecond / safeCeiling);
}

export const awarenessConfig = {
  smoothingWindowMs: 3000,
  ambientCooldownMs: 1000,
  attentionCooldownMs: 5000,
  thresholds: {
    drift: 0.35,
    variance: 0.4,
    density: 0.3,
  },
};

export function computeRoomMetrics(events = [], config = awarenessConfig) {
  const list = Array.isArray(events) ? events : [];
  if (!list.length) {
    return { drift: 0, variance: 0, density: 0 };
  }

  const values = list
    .map((evt) => {
      if (typeof evt?.value === "number") return clamp01(evt.value);
      if (typeof evt?.level === "number") return clamp01(evt.level);
      return null;
    })
    .filter((v) => typeof v === "number");

  const drift =
    values.length >= 2
      ? Math.max(
          -1,
          Math.min(1, values[values.length - 1] - values[values.length - 2])
        )
      : 0;
  const variance = valueVariance(values);

  const now = Date.now();
  const firstTs =
    list.reduce((min, evt) => {
      const ts = Number(evt?.timestamp);
      if (!Number.isFinite(ts)) return min;
      return min == null ? ts : Math.min(min, ts);
    }, null) ?? now - config.smoothingWindowMs;
  const windowSpan = Math.max(
    config?.smoothingWindowMs ?? 3000,
    now - firstTs,
    1
  );
  const density = pulseDensity(list, windowSpan);

  return { drift, variance, density };
}

export function nextAwarenessState(
  prevState = "AMBIENT",
  metrics = {},
  timestamps = {},
  config = awarenessConfig
) {
  const state = typeof prevState === "string" ? prevState : "AMBIENT";
  const {
    smoothingWindowMs = awarenessConfig.smoothingWindowMs,
    ambientCooldownMs = awarenessConfig.ambientCooldownMs,
    attentionCooldownMs = awarenessConfig.attentionCooldownMs,
    thresholds = awarenessConfig.thresholds,
  } = config || {};

  const {
    now = Date.now(),
    stateEnteredAt = 0,
    activeEnteredAt = stateEnteredAt,
    attentionEnteredAt = stateEnteredAt,
  } = timestamps || {};

  const driftMag = Math.abs(metrics?.drift ?? 0);
  const variance = clamp01(metrics?.variance ?? 0);
  const density = clamp01(metrics?.density ?? 0);

  const driftHigh = driftMag >= (thresholds?.drift ?? 0.35);
  const varianceHigh = variance >= (thresholds?.variance ?? 0.4);
  const densityHigh = density >= (thresholds?.density ?? 0.3);

  const varianceSpike = variance >= (thresholds?.variance ?? 0.4) * 1.15;
  const densitySpike = density >= (thresholds?.density ?? 0.3) * 1.1;

  switch (state) {
    case "AMBIENT": {
      if (driftHigh || varianceHigh) {
        return "ACTIVE";
      }
      return "AMBIENT";
    }
    case "ACTIVE": {
      if (varianceSpike || densitySpike) {
        return "ATTENTION";
      }

      const calm =
        driftMag <= (thresholds?.drift ?? 0.35) * 0.65 &&
        variance <= (thresholds?.variance ?? 0.4) * 0.65 &&
        density <= (thresholds?.density ?? 0.3) * 0.65;
      const activeDuration = now - activeEnteredAt;
      if (calm && activeDuration >= ambientCooldownMs) {
        return "AMBIENT";
      }
      return "ACTIVE";
    }
    case "ATTENTION": {
      const attentionDuration = now - attentionEnteredAt;
      if (attentionDuration < attentionCooldownMs) {
        return "ATTENTION";
      }
      const settled =
        driftMag <= (thresholds?.drift ?? 0.35) * 0.85 &&
        variance <= (thresholds?.variance ?? 0.4) * 0.85 &&
        density <= (thresholds?.density ?? 0.3) * 0.85;

      return settled ? "ACTIVE" : "ATTENTION";
    }
    default:
      return "AMBIENT";
  }
}
