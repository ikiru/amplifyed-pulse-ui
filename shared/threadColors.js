const THREAD_COLOR_PALETTE = [
  "#e63946", // red
  "#f4d35e", // yellow
  "#52b788", // green
  "#48bfe3", // cyan
  "#4361ee", // blue
  "#9d4edd", // magenta
];

export function assignThreadColors(roots = []) {
  const assignments = new Map();
  const paletteLength = THREAD_COLOR_PALETTE.length;
  if (paletteLength === 0) {
    return assignments;
  }

  let previousColor = null;
  let paletteIndex = 0;

  roots.forEach((root) => {
    if (!root || typeof root.messageId !== "string") {
      return;
    }
    let candidate = THREAD_COLOR_PALETTE[paletteIndex];
    if (candidate === previousColor) {
      paletteIndex = (paletteIndex + 1) % paletteLength;
      candidate = THREAD_COLOR_PALETTE[paletteIndex];
    }
    assignments.set(root.messageId, candidate);
    previousColor = candidate;
    paletteIndex = (paletteIndex + 1) % paletteLength;
  });

  return assignments;
}
