export const SoftFlagWindow = [];

export function analyzeEvent(event) {
  SoftFlagWindow.push(event);
  trimWindow();

  const flags = [];

  if (isPulseVolatility(event)) {
    flags.push(makeFlag("instability", 2));
  }

  if (isLinguisticDistress(event)) {
    flags.push(makeFlag("distress", 3));
  }

  if (isWithdrawal(event)) {
    flags.push(makeFlag("withdrawal", 1));
  }

  if (isGroupShift()) {
    flags.push(makeFlag("confusion", 2));
  }

  return flags;
}

function makeFlag(category, level) {
  return {
    type: "soft-flag",
    category,
    level,
    confidence: Math.random() * 0.3 + 0.1,
    timestamp: Date.now()
  };
}

function trimWindow() {
  const cutoff = Date.now() - 1000 * 60 * 5;
  while (SoftFlagWindow.length && SoftFlagWindow[0].timestamp < cutoff) {
    SoftFlagWindow.shift();
  }
}

function isPulseVolatility(event) {
  if (event.type !== "pulse") return false;
  return Math.abs(event.value) > 0.6;
}

function isLinguisticDistress(event) {
  if (event.type !== "message") return false;
  const t = event.text.toLowerCase();
  return (
    t.includes("burned out") ||
    t.includes("breaking down") ||
    t.includes("i can't") ||
    t.includes("overwhelmed")
  );
}

function isWithdrawal(event) {
  if (event.type !== "pulse") return false;
  return event.value === 0;
}

function isGroupShift() {
  if (SoftFlagWindow.length < 4) return false;
  const last = SoftFlagWindow.slice(-4);
  const avg = last.reduce((a, e) => a + (e.value || 0), 0) / last.length;
  return Math.abs(avg) > 0.5;
}
