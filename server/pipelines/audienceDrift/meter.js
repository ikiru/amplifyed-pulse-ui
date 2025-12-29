import { getDriftScore } from "./aggregation.js";

const FEATURE_AUDIENCE_DRIFT_METER =
  process.env.FEATURE_AUDIENCE_DRIFT_METER === "1";

const CENTER_BAND_WIDTH = 0.4;

function getMeterProjection(sessionId) {
  if (!FEATURE_AUDIENCE_DRIFT_METER) {
    return null;
  }
  if (!sessionId) {
    return null;
  }

  const score = getDriftScore(sessionId);
  if (typeof score !== "number") {
    return null;
  }

  return {
    score,
    centerBand: {
      min: -CENTER_BAND_WIDTH,
      max: CENTER_BAND_WIDTH,
    },
  };
}

export { FEATURE_AUDIENCE_DRIFT_METER, getMeterProjection };
