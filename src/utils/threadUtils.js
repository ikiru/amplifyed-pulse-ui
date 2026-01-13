/**
 * Thread Utilities
 * 
 * Utility functions for thread coloring and navigation.
 */

// §3.1 Color Is Idea-Bound; §3.3 Thread Color Assignment & Lifecycle
// Use a calibrated palette of clearly separated hues so each root thread 
// retains a stable, idea-bound tone for the lineage visuals.
export const THREAD_COLOR_PALETTE = [
  "#e63946", // red
  "#f4d35e", // yellow
  "#52b788", // green
  "#48bfe3", // cyan
  "#4361ee", // blue
  "#9d4edd", // magenta
];

/**
 * Assigns unique colors to thread roots from the palette
 * Avoids assigning same color to adjacent threads for visual separability
 * @param {Array} roots - Array of root message objects
 * @returns {Map} - Map of messageId -> color hex string
 */
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
    // Avoid assigning the same hue as the immediately preceding root to keep adjacent threads visually separable.
    if (candidate === previousColor) {
      paletteIndex = (paletteIndex + 1) % paletteLength;
      candidate = THREAD_COLOR_PALETTE[paletteIndex];
    }
    assignments.set(root.messageId, candidate);
    previousColor = candidate;
    paletteIndex = (paletteIndex + 1) % paletteLength;
    // Palette reuse is tolerated after a different hue appears so we keep the set concise yet consistent.
  });

  return assignments;
}

/**
 * Scrolls to a thread root element in the DOM
 * @param {string} rootMessageId - The message ID of the thread root
 */
export function scrollToThreadRoot(rootMessageId) {
  if (!rootMessageId) return;
  if (typeof document === "undefined") return;
  const target = document.getElementById(`thread-root-${rootMessageId}`);
  if (target && typeof target.scrollIntoView === "function") {
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}
