import React from "react";

const DEFAULT_CENTER_BAND_WIDTH = 0.4;
const DEFAULT_CENTER_BAND = {
  min: -DEFAULT_CENTER_BAND_WIDTH,
  max: DEFAULT_CENTER_BAND_WIDTH,
};
const DEFAULT_SCORE = 0;

export const createNeutralAudienceDriftProjection = () => ({
  score: DEFAULT_SCORE,
  centerBand: {
    ...DEFAULT_CENTER_BAND,
  },
});

const clamp = (value, min, max) => {
  if (typeof value !== "number" || Number.isNaN(value)) return min;
  return Math.max(min, Math.min(max, value));
};

const toPercent = (value) => {
  const normalized = clamp(value, -1, 1);
  return ((normalized + 1) / 2) * 100;
};

export default function AudienceDriftMeter({ projection }) {
  const centerBand =
    projection?.centerBand && typeof projection.centerBand === "object"
      ? projection.centerBand
      : DEFAULT_CENTER_BAND;
  const safeMin =
    typeof centerBand?.min === "number"
      ? centerBand.min
      : DEFAULT_CENTER_BAND.min;
  const safeMax =
    typeof centerBand?.max === "number"
      ? centerBand.max
      : DEFAULT_CENTER_BAND.max;
  const rawScore =
    typeof projection?.score === "number" ? projection.score : DEFAULT_SCORE;
  const clampedScore = clamp(rawScore, -1, 1);
  const safeStart = Math.min(toPercent(safeMin), toPercent(safeMax));
  const safeEnd = Math.max(toPercent(safeMin), toPercent(safeMax));
  const safeWidth = Math.max(0, safeEnd - safeStart);
  const indicatorLeft = toPercent(clampedScore);

  return (
    <div
      className="audience-drift-meter"
      role="meter"
      aria-label="Audience drift"
      aria-valuemin={-1}
      aria-valuemax={1}
      aria-valuenow={clampedScore}
    >
      <div className="audience-drift-track">
        <div
          className="audience-drift-safe-zone"
          style={{
            left: `${safeStart}%`,
            width: `${safeWidth}%`,
          }}
        />
        <div
          className="audience-drift-indicator"
          style={{
            left: `${indicatorLeft}%`,
          }}
        />
      </div>
      <div className="audience-drift-labels" aria-hidden="true">
        <span className="audience-drift-label audience-drift-label-left">
          Off Focus
        </span>
        <span className="audience-drift-label audience-drift-label-center">
          Productive Drift
        </span>
        <span className="audience-drift-label audience-drift-label-right">
          Over-Constrained
        </span>
      </div>
    </div>
  );
}
