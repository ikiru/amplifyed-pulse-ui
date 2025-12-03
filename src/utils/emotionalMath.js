export const SMOOTHING = {
  engaged: 0.25,
  neutral: 0.3,
  frustrated: 0.2,
};

export const DECAY_RATE = 0.98;

const startTime = Date.now();
export const t = () => Date.now() - startTime;

export function applyEMA(oldValue, newValue, alpha) {
  return alpha * newValue + (1 - alpha) * oldValue;
}
