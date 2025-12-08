// Emotional Scoring Engine (ET-1.2)
// ------------------------------------------------------
// Produces the final emotional score for a message:
//   1. Extract emotional features
//   2. Compute composite weighted score
//   3. Apply exponential smoothing
//   4. Emit emotional event: { t, v, raw }
// ------------------------------------------------------

import {
  computeSentiment,
  computeConfusion,
  computeFrustration,
  computeCogLoad,
  computeDominance,
  computeStall,
  computeCompositeEmotion
} from "./emotionalFeatureExtractors";

import { exponentialSmooth } from "./smoothing";

// ------------------------------------------------------
// computeEmotionalScore(message, history, prevValue)
// ------------------------------------------------------
// message:  { id, message, author, timestamp, role }
// history:  array of previous messages (from useMessageStream)
// prevValue: last emotional value (0–1) for smoothing
// ------------------------------------------------------

export function computeEmotionalScore(message, history = [], prevValue = 0.5) {
  const text = message?.message || "";

  // 1. Extract raw features
  const sentiment = computeSentiment(text);
  const confusion = computeConfusion(text);
  const frustration = computeFrustration(text);
  const cogLoad = computeCogLoad(text);
  const dominance = computeDominance(message, history);
  const stall = computeStall(history);

  // 2. Composite emotional score
  const composite = computeCompositeEmotion({
    sentiment,
    confusion,
    frustration,
    cogLoad,
    stall,
    dominance
  });

  // 3. Smooth using exponential smoothing
  const smooth = exponentialSmooth(prevValue, composite, 0.35);

  // 4. Return full emotional event
  return {
    t: message.timestamp,
    v: smooth,
    raw: {
      sentiment,
      confusion,
      frustration,
      cogLoad,
      stall,
      dominance,
      composite
    }
  };
}
