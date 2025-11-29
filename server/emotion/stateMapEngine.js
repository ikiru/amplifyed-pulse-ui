export const EmotionWindow = [];

export function updateStateMap(event) {
  EmotionWindow.push(event);
  trimWindow();

  const summary = summarize(EmotionWindow);
  const trend = computeTrend(EmotionWindow);
  const mood = determineMood(summary);

  return {
    type: "state-map",
    mood,
    trend,
    confidence: computeConfidence(summary),
    signals: summary,
    timestamp: Date.now()
  };
}

function trimWindow() {
  const cutoff = Date.now() - 1000 * 60 * 5;
  while (EmotionWindow.length && EmotionWindow[0].timestamp < cutoff) {
    EmotionWindow.shift();
  }
}

function summarize(window) {
  const counts = {
    positive: 0,
    confused: 0,
    frustrated: 0,
    calm: 0,
    engaged: 0
  };

  window.forEach(e => {
    if (e.type === "pulse") {
      const key = e.emotion;
      counts[key] = (counts[key] || 0) + 1;
    }
  });

  return counts;
}

function determineMood(counts) {
  const pairs = Object.entries(counts);
  const [largestKey] = pairs.reduce(
    (max, curr) => (curr[1] > max[1] ? curr : max),
    ["none", 0]
  );

  if (largestKey === "positive" || largestKey === "calm") return "engaged";
  if (largestKey === "confused") return "confused";
  if (largestKey === "frustrated") return "frustrated";
  return "mixed";
}

function computeTrend(window) {
  if (window.length < 30) return "stable";

  const now = summarize(window.slice(-30));
  const prev = summarize(window.slice(-60, -30));

  const nowSum = sumObj(now);
  const prevSum = sumObj(prev);
  const delta = nowSum - prevSum;

  if (delta > 5) return "rising";
  if (delta < -5) return "falling";
  return "stable";
}

function computeConfidence(summary) {
  const total = Object.values(summary).reduce((a, b) => a + b, 0);
  if (total < 5) return 0.15;
  if (total < 12) return 0.28;
  if (total < 25) return 0.42;
  return 0.55;
}

function sumObj(obj) {
  return Object.values(obj).reduce((a, b) => a + b, 0);
}
